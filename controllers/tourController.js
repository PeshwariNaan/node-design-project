//const fs = require('fs');

const Tour = require('../models/tourModel');

//**This code was used for testiing routes with sample data */
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

//**USED this middleware to check id of sample data - good example */
// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);
//   // if (req.params.id * 1 > tours.length) {
//   //   return res.status(404).json({
//   //     status: 'fail',
//   //     message: 'invalid ID',
//   //   });
//   // }
//   next();
// };

exports.checkBody = (req, res, next) => {
  const test = req.body;
  if (!test.name || !test.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price',
    });
  }
  next();
};

//**ROUTE HANDLERS */
exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    // results: tours.length,
    // requestedAt: req.requestTime,
    // data: {
    //   tours, // IN es6 we actually don't have to write twice (KEY: VALUE) if the same name - only need tours in this case
    // },
  });
};

exports.getTour = (req, res) => {
  //The colon: lets us add avariable to the request - A ? makes the parameter optional (/:yes?)
  // req.params gives us access to the variables in the url
  //const id = req.params.id * 1; //This converts a string to a number
  //const tour = tours.find((el) => el.id === id);
  res.status(200).json({
    status: 'success',
    // data: {
    //   tour,
    // },
  });
};

exports.createTour = (req, res) => {
  res.status(201).json({
    status: 'success',
    // data: {
    //   tour: newTour,
    // },
  });
};

exports.updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here>',
    },
  });
};

exports.deleteTour = (req, res) => {
  res.status(204).json({
    status: 'success',
    data: null,
  });
};
