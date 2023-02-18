// Review - add / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      reguired: true,
      min: [1, 'Rating must be equal or above 1.'],
      max: [5, 'Rating must be equal or less than 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    tour: {
      // This reference doesn't use an array because this can only reference one tour
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      // Parent reference to the user that created the review
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // Setting up an index so we don't have the same user putting multiple reviews on one review

// Middleware

reviewSchema.pre(/^find/, function (next) {
  //Decided not to have the tour info on the review - makes a mess of the data
  //Remeber that this will add two additional quesries by using populate twice
  //   this.populate({
  //     path: 'tour', //This is the ref
  //     select: 'name',
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo', //These are the only fields that we want to populate - make sure not to send personal info (i.e. email addresses)
  //   });
  this.populate({
    path: 'user',
    select: 'name photo', //These are the only fields that we want to populate - make sure not to send personal info (i.e. email addresses)
  });
  next();
});

reviewSchema.statics.calcAverageRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numOfRatings: { $sum: 1 }, //Number of ratings
        avgRating: { $avg: '$rating' }, //Calculate the average from the rating field
      },
    },
  ]);
  console.log('Stats: ', stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numOfRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};
reviewSchema.post('save', function () {
  // We want post because we want to see the rating after the new review has been added
  //Post middleware does have access to next but we don't need it here because this is the only post middleware that we have. If we needed to do something
  //with the output of this middleware then we would have to adjust/wait for this to finish
  //We want to run the calcAverageRating function each time a new review is created
  // this points to current review
  this.constructor.calcAverageRating(this.tour); //Using this.constructor gives us access to tour
});

//findByIdAndUpdate
//findByIdAndDelete
//** Before we did a two step process to get access to the document - we can skip this with the code below */
// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   //we need access to the review document to edit or delete and we need access to the tour to run calcAverageRating. We only have access to the query so we run a query which gives us access to the document
//   this.r = await this.findOne(); // saving this.r adds a property to the r variable and we can have access to this in the post method middleware below
//   console.log(('r for review: ', this.r));
//   next();
// });

// reviewSchema.post(/^findOneAnd/, async function () {
//   //await this.findOne() does NOT work here, query has already executed
//   await this.r.constructor.calcAverageRating(this.r.tour);
// });

//This middleware gives us access to the review doc we needed and we don't need the two step process we have above
reviewSchema.post(/^findOneAnd/, async (docs) => {
  await docs.constructor.calcAverageRating(docs.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
