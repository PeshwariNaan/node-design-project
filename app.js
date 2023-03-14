const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitze = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const hpp = require('hpp');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const { csp, helmetConfig } = require('./utils/helmet_csp_config');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');

const AppError = require('./utils/appError');

//const app = express();
const app = express(helmetConfig);
csp(app);

app.enable('trust proxy'); //Added because heroku uses proxy's
app.set('view engine', 'pug'); //We can define our view engine but we do not need to add any packages - this already happens with express

app.set('views', path.join(__dirname, 'views'));

// Access-control-origin-header => *
app.use(cors());

//This is for more 'complex' routes other than GET and POST - This will handle PATCH and DELETE  etc..
// We can also do this for individual routes i.e. => app.options('/api/v1/tour/:id', cors())
app.options('*', cors());

//Serving static files
//app.use(express.static(`${__dirname}/public`)); //Using the path.join method below reduces errors with the paths having a '/' or not
app.use(express.static(path.join(__dirname, 'public'))); //This means that all static assets will be served from the public folder

// **GLOBAL MIDDLEWARE
//app.use(helmet({ contentSecurityPolicy: false })); //Okay for testing some stuff but failed after a while
// Set security HTTP Headers
//Best to use helmet early in the middleware stack so the http headers are surely set

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

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

//Body parser - reading data from body into req.body
app.use(express.json({ limit: '10kb' })); //This is middleware that enables us to see the body of the request. we need app.use for middleware
app.use(express.urlencoded({ extended: true, limit: '10kb' })); //This allows us to parse the data coming from forms. The extended option allows for more complex data
app.use(cookieParser()); // This is middleware that parses data from cookies like our jwt's

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

app.use(compression());

//**Simple example of middleware structure */
// app.use((req, res, next) => {
//   //We have next as the 3rd argument for middleware
//   console.log('Hello from the middleware 🙌');
//   next(); //Always call next()
// });

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  next();
});

//**ROUTES */
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//Middleware for error handling all routes that don't match the two above
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); //any time next receives an argument no matter what it is,
  //express will automatically assume its an error.
  // Skips all other middlewares in the middleware stack and send the error to the global middleware handler
});

//Building global error handling middleware - by specifying 4 parameters- express automatically knows this is error handling middleware
app.use(globalErrorHandler);

module.exports = app;
