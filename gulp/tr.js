gulp.task('tr', function () {
    return gulp.src(config['tr']['src'])
        .pipe(gulp.dest(config['public'] + config['tr']['dst']))
});