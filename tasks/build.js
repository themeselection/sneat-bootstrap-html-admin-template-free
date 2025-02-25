const path = require('path');
const { src, dest, series, parallel } = require('gulp');
const sass = require('gulp-dart-sass');
const localSass = require('sass');
const autoprefixer = require('gulp-autoprefixer');
const exec = require('gulp-exec');
const gulpIf = require('gulp-if');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const useref = require('gulp-useref');
const webpack = require('webpack');
const log = require('fancy-log');
const colors = require('ansi-colors');
const rename = require('gulp-rename');

module.exports = (conf, srcGlob) => {
  // Build CSS
  // -------------------------------------------------------------------------------
  const buildCssTask = function (cb) {
    const sassCommand = `sass --load-path=node_modules/ scss:${conf.distPath}/css fonts:${conf.distPath}/fonts libs:${conf.distPath}/libs`;
    const sassCommandWithMinify = `${sassCommand} --style compressed --no-source-map`;
    const sassCommandWithoutSourceMap = `${sassCommand} --no-source-map`;

    return src(srcGlob('**/*.scss', '!**/_*.scss'))
      .pipe(gulpIf(conf.sourcemaps, sourcemaps.init()))
      .pipe(
        gulpIf(
          localSass,
          exec(
            // If conf.minify == true, generate compressed style without sourcemap
            gulpIf(
              conf.minify,
              `sass --load-path=node_modules/ scss:${conf.distPath}/css fonts:${conf.distPath}/fonts libs:${conf.distPath}/libs --style compressed --no-source-map`,
              `sass --load-path=node_modules/ scss:${conf.distPath}/css fonts:${conf.distPath}/fonts libs:${conf.distPath}/libs --no-source-map`
            ),
            function (err) {
              cb(err);
            }
          ),
          sass
            .sync({
              includePaths: ['node_modules'],
              outputStyle: conf.minify ? 'compressed' : 'expanded'
            })
            .on('error', sass.logError)
        )
      )
      .pipe(gulpIf(conf.sourcemaps, sourcemaps.write()))
      .pipe(
        rename(function (path) {
          path.dirname = path.dirname.replace('scss', 'css');
        })
      )
      .pipe(dest(conf.distPath))
      .pipe(browserSync.stream());
  };
  // Autoprefix css
  const buildAutoprefixCssTask = function (cb) {
    return src(conf.distPath + '/css/**/*.css')
      .pipe(
        gulpIf(
          conf.sourcemaps,
          sourcemaps.init({
            loadMaps: true
          })
        )
      )
      .pipe(autoprefixer())
      .pipe(gulpIf(conf.sourcemaps, sourcemaps.write()))
      .pipe(dest(conf.distPath + '/css'))
      .pipe(browserSync.stream());
  };

  // Build JS
  // -------------------------------------------------------------------------------
  const buildJsTask = function (cb) {
    setTimeout(function () {
      webpack(require('../webpack.config'), (err, stats) => {
        if (err) {
          log(colors.gray('Webpack error:'), colors.red(err.stack || err));
          if (err.details) log(colors.gray('Webpack error details:'), err.details);
          return cb();
        }

        const info = stats.toJson();

        if (stats.hasErrors()) {
          info.errors.forEach(e => log(colors.gray('Webpack compilation error:'), colors.red(e)));
        }

        if (stats.hasWarnings()) {
          info.warnings.forEach(w => log(colors.gray('Webpack compilation warning:'), colors.yellow(w)));
        }

        // Print log
        log(
          stats.toString({
            colors: colors.enabled,
            hash: false,
            timings: false,
            chunks: false,
            chunkModules: false,
            modules: false,
            children: true,
            version: true,
            cached: false,
            cachedAssets: false,
            reasons: false,
            source: false,
            errorDetails: false
          })
        );

        cb();
        browserSync.reload();
      });
    }, 1);
  };

  // Copy
  // -------------------------------------------------------------------------------

  const buildCopyTask = function () {
    return src(
      srcGlob(
        '**/*.png',
        '**/*.gif',
        '**/*.jpg',
        '**/*.jpeg',
        '**/*.svg',
        '**/*.swf',
        '**/*.eot',
        '**/*.ttf',
        '**/*.woff',
        '**/*.woff2'
      )
    ).pipe(dest(conf.distPath));
  };

  // Iconify task
  // -------------------------------------------------------------------------------
  const buildIconifyTask = function (cb) {
    // Create required directories without copying files
    const fs = require('fs');
    const directories = ['./fonts/iconify', './assets/vendor/fonts', './dist/fonts'];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    const iconify = require('child_process').spawn('node', ['./fonts/iconify/iconify.js']);

    iconify.stdout.on('data', data => {
      console.log(data.toString());
    });

    iconify.stderr.on('data', data => {
      console.error(data.toString());
    });

    iconify.on('close', code => {
      cb();
    });
  };

  const buildAllTask = series(buildCssTask, buildJsTask, buildCopyTask, buildIconifyTask);

  // Exports
  // ---------------------------------------------------------------------------

  return {
    css: series(buildCssTask, buildAutoprefixCssTask),
    js: buildJsTask,
    copy: buildCopyTask,
    iconify: buildIconifyTask,
    all: buildAllTask
  };
};
