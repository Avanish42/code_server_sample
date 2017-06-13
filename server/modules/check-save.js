module.exports = function(err, res) {
  if (err) {
    var errMsg = '',
        code = '000-' + (err.statusCode || 500),
        errorsArr = [];

    if (err.details && err.details.messages && Object.keys(err.details.messages).length) {
      for (var pName in err.details.messages) {
        if (err.details.messages.hasOwnProperty(pName)) {
          if (errMsg) {
            errMsg += '. \n'
          }
          errMsg += err.details.messages[pName].join('. ');
          errorsArr = errorsArr.concat({ errorCode: code, errorMessage: err.details.messages[pName].join('. '), errorField: pName });
        }
      }
    }

    if (!errMsg) errMsg = err.message || 'Saving process is failed';

    res.status(err.statusCode || 500);
    res.json({
      code: code,
      message: errMsg,
      errors: errorsArr
    });
    return false;
  } else {
    return true;
  }
};
