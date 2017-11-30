/*
This file is to bundle jsx files and to transplie es6 js to es5 js
*/
var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var babel = require('gulp-babel');

var packageJson = require('./package.json');
var dependencies = Object.keys(packageJson && packageJson.dependencies || {});

var index = dependencies.indexOf('jquery.json-viewer'); //causes issues while creation of libs bundle
delete dependencies[index];
index = dependencies.indexOf('react-icons'); //causes issues while creation of libs bundle
delete dependencies[index];

/**
 * We should keep an eye on the js exceptions to see whether not including jquery.json-viewer and react-icons causes any issues or not
 * We should also minify and uglify our libs.js eventually even if we wanna keep bundle.js not minified.
 */

gulp.task('init', function() {
    gutil.log("Generating libs.js including: " + dependencies.join(','));
    return browserify()
        .require(dependencies)
        .transform('babelify', {
            presets: ['es2015', 'react']
        })
        .bundle()
        .pipe(source('libs.js'))
        .pipe(gulp.dest('server/public/dist'));
});

gulp.task('build', function() {
    return browserify({
            entries: './server/es5/bcv-app.jsx',
            extensions: ['.jsx'],
            debug: true
        }).transform('browserify-css', {global: true})
        .external(dependencies)
        .transform('babelify', {
            presets: ['es2015', 'react'],
            plugins: ['transform-decorators-legacy', 'transform-class-properties']
        })
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('server/public/dist'));
});

gulp.task('watch', ['build'], function() {
    gulp.watch('*.jsx', ['build']);
});

gulp.task('default', ['watch']);

gulp.task('transpile', function() {
    return gulp.src('./server/es6/**/*').
    pipe(babel({
            presets: ["es2015"],
            ignore: ['./server/es6/**/', '*.jsx', '*.txt', '*.json']
        }))
        .pipe(gulp.dest('./server/es5'));
});