const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitze = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');
const helmet = require('helmet');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// **GLOBAL MIDDLEWARE

// Set security HTTP Headers
app.use(helmet()); //Best to use helmet early in the middleware stack so the http headers are surely set

console.log(`App is running in ${process.env.NODE_ENV} mode`);

//Developement Logging
if (process.env.NODE_ENV === 'developement') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
  //Creating a limiter to prevent DDoS attacks and brute force pw attacks
  max: 100, //This needs to be adapted to the webApps
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/api', limiter);

//Body parser - reading data from body into req.body
app.use(express.json({ limit: '10kb' })); //This is middleware that enables us to see the body of the request. we need app.use for middleware

// Data Sanitization against NoSQL query injection
app.use(mongoSanitze()); //This takes out the query operators needed for the injection

// Data Sanitization against XSS attacks
app.use(xss());

// Prevent parameter pollution (cleans up the query string)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//Serving static files
app.use(express.static(`${__dirname}/public`));

//**Simple example of middleware structure */
// app.use((req, res, next) => {
//   //We have next as the 3rd argument for middleware
//   console.log('Hello from the middleware 🙌');
//   next(); //Always call next()
// });

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.headers);
  next();
});

//**ROUTES */

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//Middleware for error handling all routes that don't match the two above
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); //any time next receives an argument no matter what it is,
  //express will automatically assume its an error.
  // Skips all other middlewares in the middleware stack and send the error to the global middleware handler
});

//Building global error handling middleware - by specifying 4 parameters- express automatically knows this is error handling middleware
app.use(globalErrorHandler);

module.exports = app;
