gulp = require('gulp');
dir = require('require-dir');

var knownOptions = {
        default: {
            env: 'env',
            config: 'client/src',
            server: 'http://localhost:3000'
        }
    },
    minimist = require('minimist');

options = minimist(process.argv.slice(2), knownOptions);
config = require('./' + options.config + '/config.json');

if (options['env'] === 'production') {
    config.isProduction = true;
    config.server = 'http://128.199.191.185:3000';
    console.log('Production build')
} else if (options['env'] === 'dev') {
  config.isProduction = true;
  config.server = 'http://3203.frontend.mgrnix.com:23089';
  console.log('Dev build')
}

console.log('ENV: ', options['env']);
console.log('SERVER: ', options['server']);

modules = {};

onErrors = function (error) {
    console.log(error.toString());
};

dir('./gulp');

gulp.task('default', ['build'], function () {
  gulp.start('watch');
  gulp.start('webServer');
});
