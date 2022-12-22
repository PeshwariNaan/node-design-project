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

//**Another example of custom middleware to check body of req - useful */
// exports.checkBody = (req, res, next) => {
//   const test = req.body;
//   if (!test.name || !test.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };

//**ROUTE HANDLERS */
exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find(); //If there is no argument all items in collection will be returned
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours, // IN es6 we actually don't have to write twice (KEY: VALUE) if they are the same name - only need tours in this case
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'Failed',
      message: err.message,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'Failed',
      message: err.message,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'Failed',
      message: err.message,
    });
  }
};
