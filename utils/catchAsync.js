//Async error handler function
/*eslint-disable */
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); //This line makes it so any errors go to the global error handling middleware
  };
};
