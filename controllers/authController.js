/* eslint-disable */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util'); //This is built into node
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createAndSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const expiryDate =
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000;
  //console.log('Expiry Date :', expiryDate);
  const cookieOptions = {
    expires: new Date(expiryDate),
    httpOnly: true, //This makes it so the token cannot be manipulated by the browser (XSS attacks) //Cannot be deleted either
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };
  //if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //Only activate in production //Moved to options above
  res.cookie('jwt', token, cookieOptions);

  //Remove pw from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  //console.log(url);
  await new Email(newUser, url).sendWelcome();
  createAndSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  //Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password'); //THese are commands for mongoose - check docs

  if (!user || !(await user.verifyPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401)); //Never tell the client which is the wrong field so a hacker cannot narrow it down
  }

  //If everything is okay, send token to client
  createAndSendToken(user, 200, req, res);
});

// Logout
exports.logout = (req, res) => {
  // res.cookie('jwt', 'loggedout', {
  //   expires: new Date(Date.now() + 10 * 1000),
  //   httpOnly: true,
  // });
  res.clearCookie('jwt');
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log(token);
  if (!token) {
    return res.redirect('/'); //This is from Q&A solution - not sure if it works yet
    // next(
    //   new AppError('You are not logged in! Please login to get access', 401)
    // );
  }
  // 2) Verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // This is a way of chaining the promisify util
  //console.log(decoded);
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists', 401) //We are checking if the user was deleted. The token may still exist but the user
      // was deleted from the DB.
    );
  }

  // 4) Check if user changed passwords after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }
  // Grant access to protected route
  req.user = currentUser; // The request object is what is passed from middleware to middlewhere and this is how we get access to it and add things as well
  res.locals.user = currentUser; //We add this to gain access to user in the pug templates
  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // 1) Getting token and check it exists
  if (req.cookies.jwt) {
    try {
      // Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 4) Check if user changed passwords after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // There is a logged in user
      res.locals.user = currentUser; //Never seen this before - Each pug template will have access to currentUser using '.locals'
      return next();
    } catch (err) {
      return next();
    }
  }
  next(); // If there is no cookie then we go to next immediately with no errors.
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // Roles is an array i.e. - ['admin', 'lead-guide].
    if (!roles.includes(req.user.role)) {
      //We have access to the req.user because the protect middleware ran before this one. It was added to the
      //req object.
      return next(
        new AppError('You do not have permission to perform this action!', 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('Sorry. There is no user with this email address.', 404)
    );
  }
  // 2) Generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //We get lots of errors without this

  // 3) Send it to users email

  // const message = `Forgot your password? Submit a PATCH request with your new
  //  password and passwordCOnfirm to ${resetURL}. \nIf you didn't forget your
  //  password, please ignor this email`;

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min',
    //   message,
    // });
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email.',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email, try again later.',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, //Checking to see if the tokan has expired using mongoose $gt operator
  });

  // 2) If token has not expired and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired.', 400)); // 400 is bad request
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); //Here we want to validate when we save - no arguments will run the validators

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createAndSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if the POSTed pw is correct
  if (!(await user.verifyPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong!', 401)); //401 unathorized
  }
  // 3) If pw is correct - update pw
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save(); //We want to run the validators
  // We cannot use User.findByIdAndUpdate because the validators will not run correctly and the middleware will not run (BAD!!)

  // 4) Log user in, send JWT
  createAndSendToken(user, 200, req, res);
});
