var gulp = require('gulp'),
  postcss = require('gulp-postcss'),
  browserSync = require('browser-sync').create(),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  processors = [
    require('cssnext'),
    require('gulp-cssnano'),
    require('precss'),
    require('autoprefixer-core')({ browsers: ['last 2 versions', '> 2%'] }),
  ];

gulp.task('css', function() {
  return gulp.src('src/css/*.css')
    .pipe(postcss(processors))
    .pipe(concat('style.css'))
    .pipe(gulp.dest('build/css/'))
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('build/css/'))
    .pipe(browserSync.stream());
});

gulp.task('js', function() {
  return gulp.src('src/js/*.js')
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('build/js/'))
    .pipe(uglify())
    .pipe(rename('vendor.min.js'))
    .pipe(gulp.dest('build/js'))
    .on("error", console.log)
    .pipe(browserSync.stream());
});

gulp.task('watch', function() {
  browserSync.init({
    server: "./"
  });
  gulp.watch('src/css/*', ['css']);
  gulp.watch('src/js/*', ['js']);
  gulp.watch("*.html").on('change', browserSync.reload);
});

gulp.task('default', ['css']);
