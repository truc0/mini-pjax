const gulp = require('gulp')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify')
const browserSync = require('browser-sync')

const browser = browserSync.create()
const browserOptions = {
  server: {
    baseDir: "./example"
  }
}

let buildScripts = callback => {
  const { src, dest } = gulp
  return src('./index.js')
    .pipe(rename('mini-pjax.js'))
  //.pipe(uglify())
    .pipe(dest('./dist/'))
    .pipe(dest('./example/js/'))
}

let watcher = () => {
  browser.init(browserOptions)

  gulp.watch(['./index.js'], buildScripts)
    .on('change', browser.reload)

  gulp.watch('./example/**/*.html')
    .on('change', browser.reload)
}

gulp.task('default', watcher)
gulp.task('build', buildScripts)
