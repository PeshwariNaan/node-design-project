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
      default: Date.now(),
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
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].numOfRatings,
    ratingsAverage: stats[0].avgRating,
  });
};
reviewSchema.post('save', function () {
  //Post middleware does have access to next but we don't need it here because this is the only post middleware that we have. If we needed to do something
  //with the output of this middleware then we would have to adjust/wait for this to finish
  //We want to run the calcAverageRating function each time a new review is created
  // this points to current review
  this.constructor.calcAverageRating(this.tour); //Using this.constructor gives us access to Review
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
