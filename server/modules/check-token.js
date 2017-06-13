module.exports = function(req, res) {
  if (!req.accessToken) {
    res.status(400);
    res.json({
      code: '001-004',
      message: 'Access token is expired',
      errors: []
    });

    return false;
  } else {
    return true;
  }
};
