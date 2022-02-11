const path = require('path');
const { src, dest, series } = require('gulp');
const replace = require('gulp-replace');
const useref = require('gulp-useref');

module.exports = conf => {
  // Copy templatePath html files and assets to buildPath
  // -------------------------------------------------------------------------------
  const prodCopyTask = function () {
    return src(`${templatePath}/**/*.html`)
      .pipe(dest(buildPath))
      .pipe(src('assets/**/*'))
      .pipe(dest(`${buildPath}/assets/`));
  };

  // Rename assets path
  // -------------------------------------------------------------------------------
  const prodRenameTasks = function () {
    return src(`${buildPath}/*.html`)
      .pipe(replace('../../assets', 'assets'))
      .pipe(dest(buildPath))
      .pipe(src(`${buildPath}/assets/**/*`))
      .pipe(replace('../../assets', 'assets'))
      .pipe(dest(`${buildPath}/assets/`));
  };

  // Combine js vendor assets in single core.js file using UseRef
  // -------------------------------------------------------------------------------
  const prodUseRefTasks = function () {
    return src(`${buildPath}/*.html`).pipe(useref()).pipe(dest(buildPath));
  };

  const prodAllTask = series(prodCopyTask, prodRenameTasks, prodUseRefTasks);

  // Exports
  // ---------------------------------------------------------------------------

  return {
    copy: prodCopyTask,
    rename: prodRenameTasks,
    useref: prodUseRefTasks,
    all: prodAllTask
  };
};
