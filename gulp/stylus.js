var stylus = require('gulp-stylus'),
    gIf = require('gulp-if'),
    minify = require('gulp-minify-css'),
    concat = require('gulp-concat');

gulp.task('stylus', function () {

    return gulp.src(config['stylus']['src'])

        .pipe(stylus())
        .on('error', onErrors)

        .pipe(gIf(config.isProduction, minify()))
        .on('error', onErrors)

        .pipe(concat(config['stylus']['dst']))
        .on('error', onErrors)

        .pipe(gulp.dest(config['public']));
});