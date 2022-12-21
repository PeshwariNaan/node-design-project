const fs = require('fs');

const express = require('express');
const app = express();

app.use(express.json()); //This is middleware that enables us to see the body of the request

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

const getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours, // IN es6 we actually don't have to write twice (KEY: VALUE) if the same name - only need tours in this case
    },
  });
};

const getTour = (req, res) => {
  //The colon: lets us add avariable to the request - A ? makes the parameter optional (/:yes?)
  // req.params gives us access to the variables in the url
  const id = req.params.id * 1; //This converts a string to a number
  const tour = tours.find((el) => el.id === id);

  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

const createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);

  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      //Must stringify and use code 201. 201 means created
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
};

const updateTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'invalid ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here>',
    },
  });
};

const deleteTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'invalid ID',
    });
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
};

// //GET request for all tours
// app.get('/api/v1/tours', getAllTours)

// //GET request for individual tour
// app.get('/api/v1/tours/:id', getTour)
// //POST request to add tour

// app.post('/api/v1/tours', createTour)

// //PATCH request to change tour
// app.patch('/api/v1/tours/:id', updateTour)

// //Delete request to delete tour
// app.delete('/api/v1/tours/:id', deleteTour)

app.route('/api/v1/tours').get(getAllTours).post(createTour);

app
  .route('/api/v1/tours/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

const port = 3000;

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
