const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        50,
        'A tour name must have less than or equal to 50 characters',
      ],
      minlength: [
        10,
        'A tour name must have more than or equal to 10 characters',
      ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration,'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a max group size.'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult.',
      },
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.'],
      max: [5, 'Rating must be less than 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price.'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        // This only points to current doc on NEW document creation!!
        validator: function (val) {
          return val < this.price;
        },
        message: 'Price discount ({VALUE}) cannot be more than the price.',
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'The tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image.'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.virtual('durationWeeks').get(function () {
  //Need to use a regular function here and not an arrow so we have access to 'this' (will point to the current document)
  return this.duration / 7;
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create() (pre-document middleware)
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//We can have middleware running before and after a certain event - simple examples
// tourSchema.pre('save', function (next) {
//   console.log('WIll save document');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  //Using regex expression here so it this middleware will work on find and findOne
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took: ${Date.now() - this.start} milliseconds.`);
//   console.log(docs);
//   next();
// });

//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  //console.log('THIS IS TEH PIPELINE: ', this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
