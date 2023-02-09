const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

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

exports.getTour = (req, res) => {
  //This is how we set things up and node automatically knows to use base
  res.status(200).render('tour', {
    tour: 'The Forest Hiker',
    user: 'Josh',
  });
};
