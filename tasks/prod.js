const path = require('path');
const { src, dest, series } = require('gulp');
const purgecss = require('gulp-purgecss');
const replace = require('gulp-replace');
const useref = require('gulp-useref');
var uglify = require('gulp-uglify');

module.exports = conf => {
  // Copy templatePath html files and assets to buildPath
  // -------------------------------------------------------------------------------
  const prodCopyHTMLTask = function () {
    return src(`${templatePath}/*.html`).pipe(dest(`${buildPath}/`));
  };

  const prodCopyAssetsTask = function () {
    return src('assets/**/*').pipe(dest(`${buildPath}/assets/`));
  };

  // Rename assets path
  // -------------------------------------------------------------------------------
  const prodRenameTasks = function () {
    return src(`${buildPath}/**/*`)
      .pipe(replace('../../assets', 'assets'))
      .pipe(dest(`${buildPath}`));
  };

  // Combine js vendor assets in single core.js file using UseRef
  // -------------------------------------------------------------------------------
  const prodUseRefTasks = function () {
    return src(`${buildPath}/*.html`).pipe(useref()).pipe(dest(buildPath));
  };

  // Uglify assets/js files
  //--------------------------------------------------------------------------------
  const prodMinifyJSTasks = function () {
    return src(`${buildPath}/assets/js/**/*.js`)
      .pipe(uglify())
      .pipe(dest(`${buildPath}/assets/js/`));
  };

  // Suppress DeprecationWarning for useref()
  process.removeAllListeners('warning');

  process.on('warning', warning => {
    if (warning.name === 'DeprecationWarning' && warning.code === 'DEP0180') {
      return;
    }
    console.warn(warning.name, warning.message);
  });

  const prodPurgecssTasks = function () {
    return src(`${buildPath}/**/*.css`)
      .pipe(
        purgecss({
          content: [
            `${buildPath}/*.html`, // Search all HTML files recursively
            `${buildPath}/**/*.js` // Also include JS files that might contain class names
          ],
          safelist: {
            standard: [/^(is-|has-)/] // Optional: safelist common utility classes
          }
        })
      )
      .pipe(dest(`${buildPath}`)); // Destination is the assets folder to overwrite in-place
  };

  const prodAllTask = series(
    prodCopyHTMLTask,
    prodCopyAssetsTask,
    prodRenameTasks,
    prodMinifyJSTasks,
    prodPurgecssTasks,
    prodUseRefTasks
  );

  // Exports
  // ---------------------------------------------------------------------------

  return {
    copy: prodCopyHTMLTask,
    copyAssests: prodCopyAssetsTask,
    rename: prodRenameTasks,
    useref: prodUseRefTasks,
    minifyJS: prodMinifyJSTasks,
    purgecss: prodPurgecssTasks,
    all: prodAllTask
  };
};
