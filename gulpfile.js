const gulp = require('gulp')
const rename = require('gulp-rename')
const browserSync = require('browser-sync')

const browser = browserSync.create()
const browserOptions = {
  server: {
    baseDir: "./example"
  }
}

let buildDevScripts = callback => {
  const { src, dest } = gulp

  src('./index.js')
    .pipe(rename('mini-pjax.js'))
    .pipe(dest('./dist/'))
    .pipe(dest('./example/js/'))
    .on('end', callback)
}

let buildScripts = callback => {
  const { src, dest } = gulp

  src('./index.js')
    .pipe(rename('mini-pjax.js'))
    .pipe(dest('./dist/'))
    .on('end', callback)
}

let watcher = () => {
  browser.init(browserOptions)

  gulp.watch(['./index.js'], buildDevScripts)
    .on('change', browser.reload)

  gulp.watch('./example/**/*.html')
    .on('change', browser.reload)
}

gulp.task('development', watcher)
gulp.task('build', buildScripts)
