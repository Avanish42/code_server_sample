var fs = require('fs');
var path = require('path');

var apnsCertData;
var apnsKeyData;
var gcmServerApiKey;

if (process.env.NODE_ENV === 'production') {
  apnsCertData = './ios/production_cert.pem';
  apnsKeyData = './ios/production_key.pem';
  gcmServerApiKey = 'AIzaSyCMzmyO7Kf__6TxH0A0rTQJQjt-vmWyM0s';
} else {
  apnsCertData = './ios/sandbox_cert.pem';
  apnsKeyData = './ios/sandbox_key.pem';
  gcmServerApiKey = 'AIzaSyAAtrT7jl-POTPA7ShK5GBHNgwfajms1AQ';
}

exports.appName = 'loopback-component-push-app';
exports.apnsCertData = readCredentialsFile(apnsCertData);
exports.apnsKeyData = readCredentialsFile(apnsKeyData);
exports.gcmServerApiKey = gcmServerApiKey;

exports.badge = 0;
//--- Helper functions ---
function readCredentialsFile(name) {
  return fs.readFileSync(
    path.resolve(__dirname, 'credentials', name),
    'UTF-8'
  );
}
