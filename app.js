const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// **MIDDLEWARE
console.log(`App is running in ${process.env.NODE_ENV} mode`);
if (process.env.NODE_ENV === 'developement') {
  app.use(morgan('dev'));
}
app.use(express.json()); //This is middleware that enables us to see the body of the request. we need app.use for middleware
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  //We have next as the 3rd argument for middleware
  console.log('Hello from the middleware 🙌');
  next(); //Always call next()
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//**ROUTES */

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
