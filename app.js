const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// **GLOBAL MIDDLEWARE
console.log(`App is running in ${process.env.NODE_ENV} mode`);
if (process.env.NODE_ENV === 'developement') {
  app.use(morgan('dev'));
}

// Creating a litmiter to prevent DDoS attacks and brute force pw attacks
const limiter = rateLimit({
  max: 100, //This needs to be adapted to the webApps
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/api', limiter);

app.use(express.json()); //This is middleware that enables us to see the body of the request. we need app.use for middleware
app.use(express.static(`${__dirname}/public`));

//**Simple example of middleware structure */
// app.use((req, res, next) => {
//   //We have next as the 3rd argument for middleware
//   console.log('Hello from the middleware 🙌');
//   next(); //Always call next()
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.headers);
  next();
});

//**ROUTES */

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//Middleware for error handling all routes that don't match the two above
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); //any time next receives an argument no matter what it is,
  //express will automatically assume its an error.
  // Skips all other middlewares in the middleware stack and send the error to the global middleware handler
});

//Building global error handling middleware - by specifying 4 parameters- express automatically knows this is error handling middleware
app.use(globalErrorHandler);

module.exports = app;
