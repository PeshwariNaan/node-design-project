const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// A function that returns a function

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No documnet found with that ID', 404)); //Remember that when we pass something to next, it automatically assumes this is an error
      //It jumps straight to the error handling middleware
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
