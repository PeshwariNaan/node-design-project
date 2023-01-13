class AppError extends Error {
  //THis is for operational errors
  constructor(message, statusCode) {
    super(message); //we use super in order to call the parent constructor  -here we set the message propery to the incomming message

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
