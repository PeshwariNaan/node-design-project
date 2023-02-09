const mongoose = require('mongoose');
const slugify = require('slugify');
//const User = require('./userModel');
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
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.'],
      max: [5, 'Rating must be less than 5.0'],
      set: (val) => Math.round(val * 10) / 10,
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
    startLocation: {
      //Mongoose supports geospacial data right out of the box
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'], // This makes it so this cannot be anythng else but 'Point' - no other value is accepted
      },
      coordinates: [Number], // Long, Lat (backwords from what it usually is)
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], //This is how we create a reference to another document in a completely different collection
    //'User' obviously is the other model that we are referencing - This is child referencing***
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//tourSchema.index({ price: 1 }); // This is how we set the index and make the query much more efficient
//Setting the value here to '1' means we are sorting in ascending order
tourSchema.index({ price: 1, ratingsAverage: -1 }); // ** NOTE: If you create an index and then move to a compound index with one of the same values
// then be sure to manualy remove the first index in compass to get it to work properly. ALso don't set indexes on collections that are written to a lot because
//the cost of updating the index is not good.
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  //Need to use a regular function here and not an arrow so we have access to 'this' (will point to the current document)
  return this.duration / 7;
});

// This is making use of virtual populate - This solves the issue of having to many items referenced in an array.
// A tour can have many reviews so we do it this way. Now the data can be displayed but it doesn't persist in the DB
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //This is the field in the review model for the reference - this connects the models
  localField: '_id',
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create() (pre-document middleware)
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Example code of how to embed a user doc into the tour document when it is created
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map((id) => User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

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

tourSchema.pre(/^find/, function (next) {
  this.populate({
    //Note: populate can affect performance - it has to create a new query which is why
    path: 'guides',
    select: '-__v -passwordChangedAt', // put the - before the fields you don't want to see
  }); //Adding .populate will fill in the data from the reference
  //I created in the tours model.
  // This only happens with the query - not in the DB

  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took: ${Date.now() - this.start} milliseconds.`);
//   console.log(docs);
//   next();
// });

//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  const things = this.pipeline()[0];
  if (Object.keys(things)[0] !== '$geoNear') {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  }

  console.log('THIS IS THE PIPELINE: ', this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
