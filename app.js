const fs = require('fs');

const express = require('express');
const app = express();

app.use(express.json()); //This is middleware that enables us to see the body of the request

// app.get('/', (req, res) => {
//   res.status(200).json({ message: 'Hello form the server side', app: 'natours' });
// });

// app.post('/', (req,res) => {
//     res.send("You can post to this endpoint...")
// })

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

//GET request for all tours
app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours, // IN es6 we actually don't have to write twice (KEY: VALUE) if the same name - only need tours in this case
    },
  });
});

//POST request to add tour
app.post('/api/v1/tours', (req, res) => {
  // console.log(req.body)

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
});

const port = 3000;

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
