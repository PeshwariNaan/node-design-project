const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.alerts = (req, res, next) => {
  const alert = req.query;
  if (alert === 'booking')
    res.locals.alert =
      "Your booking was successful! Please check your email for confirmation. If your booking doesn't show up immediately, please check back soon.";
  next();
};

exports.getOverview = catchAsync(async (req, res) => {
  // 1) Get all tour data from collection
  const tours = await Tour.find();
  // 2) Build template
  // 3) Render the template using data from step 1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data for the requested tour including reviews and guides
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }
  // 2) Build template
  // 3) Render the template using data from step 1
  res
    .status(200)
    // .set(
    //   'Content-Security-Policy',
    //   'connect-src https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com'
    // )
    .render('tour', {
      title: `${tour.name} Tour`,
      tour,
    });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  // 2) Find tours with returned ID
  const tourIDs = bookings.map((el) => el.tour); // We can also do a virtual populate here which would be better really - but do it this way to learn a different method
  const tours = await Tour.find({ _id: { $in: tourIDs } }); // First time seeing this. We cannot use findById so we use
  // -the $in operator to find all tours (_id) in the tourIDs array.
  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  }); // We can reuse this template because it will look the same just with only the booked tours
});
