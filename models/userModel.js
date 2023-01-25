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
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, //This data will not be sent to the client
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
});

//Middleware

//Encrypt passwords between getting the data and saving it.
//The bcryp hash method is async
userSchema.pre('save', async function (next) {
  //only run if password was modified
  if (!this.isModified('password')) return next();
  //Hash the password with cost of 12 (number of times this is salted )
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.verifyPassword = async function (
  //Checking if the value of the hashed pw's match to verify
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  const changedTimestamp = parseInt(
    this.passwordChangedAt.getTime() / 1000,
    10
  );
  if (this.passwordChangedAt) {
    console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp; // 100 < 200
  }
  //False means not changed
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
