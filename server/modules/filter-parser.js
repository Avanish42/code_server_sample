module.exports = function (requestString) {

  requestString = requestString.replace(/["'’]/g, '');
  var paramsObj = {},
      paramsArr = requestString.split(' '),
      loopBackFilterObj = {};

  paramsArr.forEach(function(param, index) {
    if (param === 'lt' || param === 'gt') {
      var obj = {};
      obj[param] = parseInt(paramsArr[index + 1]);
      paramsObj[paramsArr[index - 1]] = obj;
    } else if (param === 'eq') {
      var sArr = paramsArr[index + 1].split(',');
      if (sArr.length <= 1) {
        paramsObj[paramsArr[index - 1]] = paramsArr[index + 1].replace('_', ' ');
      } else {
        paramsObj[paramsArr[index - 1]] = {inq: sArr};
      }
    } else if (param === 'neq') {
      if (paramsArr[index - 1] && paramsArr[index + 1]) {
        var nc = {};
        nc[param] = paramsArr[index + 1].replace('_', ' ');
        loopBackFilterObj[paramsArr[index - 1]] = nc;
      }
    } else if (param === 'lk') {
      paramsObj[paramsArr[index - 1]] = new RegExp(paramsArr[index + 1], 'i');
    } else if (param === '|') {
      paramsObj.and = {};
      loopBackFilterObj.and = []
    }
  });


  if (paramsObj.hasOwnProperty('and')) {
    // Has AND
    if (Object.keys(paramsObj).length > 1) {
      // Not only AND
      for (var pName in paramsObj) {
        if (paramsObj.hasOwnProperty(pName) && pName !== 'and') {
          var obj = {};
          obj[pName] = paramsObj[pName];
          loopBackFilterObj.and.push(obj);
        }
      }
    }
  } else {
    // Not AND
    for (var xName in paramsObj) {
      if (paramsObj.hasOwnProperty(xName)) {
        loopBackFilterObj[xName] = paramsObj[xName];
      }
    }
  }

  return loopBackFilterObj;
};
