// Review - add / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');

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
  //Remeber that this will add two additional quesries by using populate twice
  this.populate({
    path: 'tour', //This is the ref
    select: 'name',
  }).populate({
    path: 'user',
    select: 'name photo', //These are the only fields that we want to populate - make sure not to send personal info (i.e. email addresses)
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
