const express = require('express');
const tourController = require('../controllers/tourController');

const router = express.Router();

//How we called the checkId middlewar with sample data
//router.param('id', tourController.checkID);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
