// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require('gulp');
// Importing all the Gulp-related packages we want to use
const fileinclude = require('gulp-file-include');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const tailwindcss = require('tailwindcss');
const browserSync = require('browser-sync').create();
const autoprefixer = require('autoprefixer');
const htmlreplace = require('gulp-html-replace');

//  File paths
const files = { 
  scssPath: 'staging/styles/scss/**/*.scss',
  tailwindPath: 'staging/styles/tailwind/**/*.scss',
  jsPath: 'staging/scripts/**/*.js',
  htmlPath: 'staging/**/index.html',
  htmlAll: 'staging/**/*.html'
}

// HTML paths
const paths = {
  scripts: {
    src: './',
    dest: './dist/'
  }
};

// NTS - Running functions with the same source and destination causes compile issues.

function styleProduction() {
    return src (files.htmlPath)
    .pipe(htmlreplace({
      'css' : 'styles/global.css',
    }))
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file',
    }))
    .pipe(dest(paths.scripts.dest));
}

function styleTailwind() {
  return src(files.tailwindPath)
          .pipe(sourcemaps.init()) // initialize sourcemaps first
          .pipe(sass().on('error', sass.logError))
          .pipe(postcss([tailwindcss('./tailwind.config.js'), autoprefixer()])) // PostCSS plugins
          .pipe(sourcemaps.write('.')) // write sourcemaps file in current directory
          .pipe(dest('dist/styles'))
          .pipe(browserSync.stream());
}

function styleReg() {
  return src(files.scssPath)
      .pipe(sourcemaps.init()) // initialize sourcemaps first
      .pipe(sass().on('error', sass.logError))
      .pipe(sass()) // compile SCSS to CSS
      .pipe(postcss([ autoprefixer()])) // PostCSS plugins
      .pipe(sourcemaps.write('.')) // write sourcemaps file in current directory
      .pipe(dest('dist/styles'))
      .pipe(browserSync.stream());
}

function watchTask() {
  browserSync.init({
    server: {
    baseDir: paths.scripts.dest
    }
  });

  watch([files.scssPath, files.jsPath, files.htmlPath, files.tailwindPath, files.htmlAll],

  series(
  parallel(styleTailwind, styleReg, styleProduction) 

        )
    ).on('change', browserSync.reload);    
}

exports.default = series(
  styleProduction,
  parallel(styleTailwind, styleReg, styleProduction),
  watchTask
);