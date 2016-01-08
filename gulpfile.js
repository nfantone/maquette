'use strict'; // eslint-disable-line

var $ = require('gulp-load-plugins')();
var config = require('./build.json');
var gulp = require('gulp');

/**
 * Runs eslint linter on source code
 * and prints a report.
 *
 * `gulp eslint`
 */
gulp.task('eslint', function() {
  return gulp.src(config.paths.src)
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.if(config.eslint.failOnError, $.eslint.failOnError()));
});

/**
 * Runs unit tests and writes out
 * a report.
 *
 * `gulp test`
 */
gulp.task('test', function(cb) {
  gulp.src(config.paths.src)
    // Covering files
    .pipe($.istanbul())
    // Force `require` to return covered files
    .pipe($.istanbul.hookRequire())
    .on('finish', function() {
      gulp.src(config.paths.test)
        .pipe($.mocha())
        // Creating the reports after tests ran
        .pipe($.istanbul.writeReports())
        // Enforce a coverage of at least 80%
        .pipe($.istanbul.enforceThresholds({
          thresholds: {
            global: 80
          }
        }))
        .on('end', cb);
    });
});

/**
 * Lints source code and runs test suite.
 * Used as a pre-commit hook.
 *
 * `gulp validate`
 */
gulp.task('validate', ['eslint', 'test']);

gulp.task('default', ['validate']);
