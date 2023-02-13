const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitze = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const AppError = require('./utils/appError');

const app = express();

app.set('view engine', 'pug'); //We can define our view engine but we do not need to add any packages - this already happens with express

app.set('views', path.join(__dirname, 'views'));

//Serving static files
//app.use(express.static(`${__dirname}/public`)); //Usiing the path.join method below reduces errors with the paths having a '/' or not
app.use(express.static(path.join(__dirname, 'public'))); //This means that all static assets will be served from the public folder
// **GLOBAL MIDDLEWARE

// Set security HTTP Headers
//app.use(helmet()); //Best to use helmet early in the middleware stack so the http headers are surely set
// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://*.tiles.mapbox.com',
  'https://events.mapbox.com',
  'https://js.stripe.com',
  'https://m.stripe.network',
  'https://*.cloudflare.com',
  'https://api.mapbox.com',
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://*.tiles.mapbox.com',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = [
  'https://unpkg.com',
  'https://*.tiles.mapbox.com',
  'https://events.mapbox.com',
  'https://api.mapbox.com',
  'https://tile.openstreetmap.org',
  'https://*.stripe.com',
  'https://bundle.js:*',
  'ws://127.0.0.1:*/',
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", ...fontSrcUrls],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:', ...scriptSrcUrls],
      frameSrc: ["'self'", 'https://js.stripe.com'],
      objectSrc: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:', 'https://m.stripe.network'],
      childSrc: ["'self'", 'blob:'],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      formAction: ["'self'"],
      connectSrc: [
        "'self'",
        "'unsafe-inline'",
        'data:',
        'blob:',
        ...connectSrcUrls,
      ],
      upgradeInsecureRequests: [],
    },
  })
);
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

//**Simple example of middleware structure */
// app.use((req, res, next) => {
//   //We have next as the 3rd argument for middleware
//   console.log('Hello from the middleware 🙌');
//   next(); //Always call next()
// });

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

//**ROUTES */
app.use('/', viewRouter);
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
