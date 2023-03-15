const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name must have less than or equal to 50 characters'],
    minlength: [3, 'Name must have more than or equal to 3 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
    trim: true,
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, //This data will not be sent to the client, it is hidden
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //This only works on CREATE and SAVE(when updating user)!!!
      validator: function (el) {
        return el === this.password; //password === passwordConfirm
      },
      message: 'Passwords do not match!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false, //This data will not be sent to the client, it is hidden
  },
});

//Middleware

// Encrypt passwords between getting the data and saving it.
// The bcryp hash method is async
userSchema.pre('save', async function (next) {
  //only run if password was modified
  if (!this.isModified('password')) return next();
  //Hash the password with cost of 12 (number of times this is salted )
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; //Adding the second ensures that the token is always created after the password has been changed
  next();
});

userSchema.pre(/^find/, function (next) {
  //This regular expression '/^find/' will look for the 'find' keyword in the queries.
  // so getAllUsers has find so this middleware will run before that query is executed
  // 'this' points to the current query
  this.find({ active: { $ne: false } });
  next();
});

//User Methods
userSchema.methods.verifyPassword = async function (
  //Checking if the value of the hashed pw's match to verify
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp; // 100 < 200
  }
  //False means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 600 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
