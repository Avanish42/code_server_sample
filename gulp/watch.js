var watch = require('gulp-watch');

gulp.task('watch', function () {

    for (var key in config['build']) {
        if (config['build'].hasOwnProperty(key)) {
            var task = config['build'][key];

            (function (task) {
                watch(config[task]['src'], function () {
                    gulp.start(task);
                });

                if (config[task]['watch'] !== undefined) {
                    watch(config[task]['watch'], function () {
                        gulp.start(task);
                    });
                }

            })(task);

        }
    }

});