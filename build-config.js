module.exports = {
  base: {
    // Excludes folders relative to `root` directory.
    exclude: [
      'html',
      'html-starter',
      'html-demo',
      'dist',
      'build',
      'assets',
      'tasks',
      'node_modules',
      '_temp',
      'node-script'
    ],

    // Base Path to Serve from using Browser Sync, Currently set to root of the project
    // You can also point to specific folder like 'build/'
    serverPath: './',

    // Template/Folder to build for production
    buildTemplatePath: 'html',

    // Folder for production build
    buildPath: './build'
  },
  development: {
    // Build path can be both relative or absolute.
    // Current dist path is `./assets/vendor` which will be used by templates from `html\` directory. Set distPath: './dist' to generate assets in dist folder.
    distPath: './assets/vendor',

    // Minify assets.
    minify: false,

    // Generate sourcemaps.
    sourcemaps: false,

    // https://webpack.js.org/configuration/devtool/#development
    devtool: 'eval-source-map',

    // Use this option with caution because it will remove entire output directory.
    // Will affect only and `build` command
    cleanDist: true,
    fastDev: true
  },
  production: {
    // Build path can be both relative or absolute.
    // Current dist path is `./assets/vendor` which will be used by templates from `html\` directory. Set distPath: './dist' to generate assets in dist folder.
    distPath: './assets/vendor',

    // Minify assets.
    // Note: Webpack will minify js sources in production mode regardless to this option
    minify: true,

    // Generate sourcemaps.

    sourcemaps: false,
    // https://webpack.js.org/configuration/devtool/#production
    devtool: '#source-map',

    // Use this option with caution because it will remove entire output directory.
    // Will affect only `build:prod` command
    cleanDist: true,
    fastDev: false
  }
};
