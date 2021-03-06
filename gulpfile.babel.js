// generated on 2016-12-30 using generator-chrome-extension 0.6.1
import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'
import del from 'del'
import runSequence from 'run-sequence'
import {stream as wiredep} from 'wiredep'

const plugin = gulpLoadPlugins()

gulp.task('extras', () =>
  gulp.src([
    'app/*.*',
    'app/_locales/**',
    '!app/scripts.babel',
    '!app/scripts.webpack',
    '!app/*.json',
    '!app/*.html',
  ], {
    base: 'app',
    dot: true
  }).pipe(gulp.dest('dist'))
)

function lint(files, options) {
  return () => {
    return gulp.src(files)
      .pipe(plugin.eslint(options))
      .pipe(plugin.eslint.format())
  }
}

gulp.task('lint', lint('app/scripts.babel/**/*.js', {
  env: {
    es6: true
  }
}))

gulp.task('images', () =>
  gulp.src('app/images/**/*')
    .pipe(plugin.if(plugin.if.isFile, plugin.cache(plugin.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    }))
    .on('error', function (err) {
      console.log(err)
      this.end()
    })))
    .pipe(gulp.dest('dist/images'))
)

const webpack = require('webpack-stream')
const webpackConfig = require('./webpack.config')
const named = require('vinyl-named')

const devWebpackConfig = Object.assign({}, webpackConfig, { plugins: [] })
const prodWebpackConfig = Object.assign({}, webpackConfig, { watch: false })

gulp.task('webpack', () =>
  gulp.src('app/scripts.webpack/*.js')
    .pipe( named() )
    .pipe( webpack(prodWebpackConfig) )
    .pipe( gulp.dest('app/scripts') )
)

gulp.task('webpack:watch', () =>
  gulp.src('app/scripts.webpack/*.js')
    .pipe( named() )
    .pipe( webpack(devWebpackConfig) )
    .pipe( gulp.dest('app/scripts') )
)

gulp.task('html',  () => {
  return gulp.src('app/*.html')
    .pipe(plugin.useref({searchPath: ['.tmp', 'app', '.']}))
    .pipe(plugin.sourcemaps.init())
    // .pipe(plugin.if('*.js', plugin.uglify()))
    .pipe(plugin.if('*.css', plugin.cleanCss({compatibility: '*'})))
    .pipe(plugin.sourcemaps.write())
    .pipe(plugin.if('*.html', plugin.htmlmin({removeComments: true, collapseWhitespace: true})))
    .pipe(gulp.dest('dist'))
})

gulp.task('chromeManifest', () => {
  return gulp.src('app/manifest.json')
    .pipe(plugin.chromeManifest({
      buildnumber: true,
      background: {
        target: 'scripts/background.js',
        exclude: [
          'scripts/chromereload.js'
        ]
      }
  }))
  .pipe(plugin.if('*.css', plugin.cleanCss({compatibility: '*'})))
  // .pipe(plugin.if('*.js', plugin.sourcemaps.init()))
  // .pipe(plugin.if('*.js', plugin.uglify()))
  .pipe(plugin.if('*.js', plugin.sourcemaps.write('.')))
  .pipe(gulp.dest('dist'))
})

gulp.task('babel', () => {
  return gulp.src('app/scripts.babel/**/*.js')
      .pipe(plugin.babel({
        presets: ['es2015']
      }))
      .pipe(gulp.dest('app/scripts'))
})

gulp.task('clean', del.bind(null, ['.tmp', 'dist']))

gulp.task('watch', ['lint', 'babel'], () => {
  plugin.livereload.listen()

  gulp.watch([
    'app/*.html',
    'app/scripts/**/*.js',
    'app/images/**/*',
    'app/styles/**/*',
    'app/_locales/**/*.json'
  ]).on('change', plugin.livereload.reload)

  gulp.watch('app/scripts.babel/**/*.js', ['lint', 'babel'])
  gulp.watch('app/scripts.webpack/**/*.js', ['webpack:watch'])
})

gulp.task('size', () =>
  gulp.src('dist/**/*').pipe(plugin.size({title: 'build', gzip: true}))
)

gulp.task('wiredep', () =>
  gulp.src('app/*.html')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'))
)

gulp.task('package', () => {
  const manifest = require('./dist/manifest.json')
  return gulp.src('dist/**')
      .pipe(plugin.zip('timeout extension-' + manifest.version + '.zip'))
      .pipe(gulp.dest('package'))
})

gulp.task('build', (cb) => {
  runSequence(
    'lint', 'babel', 'webpack', 'chromeManifest',
    ['html', 'images', 'extras'],
    'size', cb)
})

gulp.task('default', ['clean'], cb => {
  runSequence('build', cb)
})
