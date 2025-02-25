const fs = require('fs').promises;
const path = require('path');
const deepmerge = require('deepmerge');
const env = require('gulp-environment');
const { importDirectory, cleanupSVG, parseColors, isEmptyColor, runSVGO } = require('@iconify/tools');
const { getIcons, stringToIcon, getIconsCSS } = require('@iconify/utils');

// Set environment variable
process.env.NODE_ENV = env.current.name;

let serverPath;
let templatePath;
let buildPath;

// Load configuration
const conf = (() => {
  const _conf = require('../../build-config');
  serverPath = _conf.base.serverPath;
  templatePath = _conf.base.buildTemplatePath;
  buildPath = _conf.base.buildPath;
  return deepmerge.all([{}, _conf.base || {}, _conf[process.env.NODE_ENV] || {}]);
})();

// Icon sources
const sources = {
  json: [
    require.resolve('@iconify/json/json/bx.json'),
    require.resolve('@iconify/json/json/bxl.json'),
    require.resolve('@iconify/json/json/bxs.json')
  ]
};

// CSS target path for generated icons
const cssTarget = path.resolve(__dirname, '../../' + conf.distPath.replace(/^\.\//, '') + '/fonts/iconify-icons.css');

// Main function to generate CSS
(async function () {
  try {
    const allIcons = [];

    // Process JSON sources
    if (sources.json) {
      for (let i = 0; i < sources.json.length; i++) {
        const item = sources.json[i];
        const filename = typeof item === 'string' ? item : item.filename;
        const content = JSON.parse(await fs.readFile(filename, 'utf8'));

        // Filter icons if specific icons are provided
        if (typeof item !== 'string' && item.icons?.length) {
          const filteredContent = getIcons(content, item.icons);

          if (!filteredContent) {
            throw new Error(`Cannot find required icons in ${filename}`);
          }

          allIcons.push(filteredContent);
        } else {
          allIcons.push(content);
        }
      }
    }

    // Process SVG sources if provided
    if (sources.svg) {
      for (let i = 0; i < sources.svg.length; i++) {
        const source = sources.svg[i];
        const iconSet = await importDirectory(source.dir, {
          prefix: source.prefix
        });

        // Iterate over icons and process each SVG
        await iconSet.forEach(async (name, type) => {
          if (type !== 'icon') {
            return;
          }

          const svg = iconSet.toSVG(name);

          if (!svg) {
            iconSet.remove(name);
            return;
          }

          try {
            // Clean up and optimize SVG
            await cleanupSVG(svg);

            if (source.monotone) {
              await parseColors(svg, {
                defaultColor: 'currentColor',
                callback: (attr, colorStr, color) => {
                  return !color || isEmptyColor(color) ? colorStr : 'currentColor';
                }
              });
            }

            await runSVGO(svg);
          } catch (err) {
            console.error(`Error parsing ${name} from ${source.dir}:`, err);
            iconSet.remove(name);
            return;
          }

          iconSet.fromSVG(name, svg);
          allIcons.push(iconSet.export());
        });
      }
    }

    // Generate the CSS content from all collected icons
    const cssContent = allIcons
      .map(iconSet =>
        getIconsCSS(iconSet, Object.keys(iconSet.icons), {
          iconSelector: '.{prefix}-{name}',
          commonSelector: '.bx',
          format: conf.minify ? 'compressed' : 'expanded'
        })
      )
      .join('\n');

    // Write the generated CSS to the target file
    await fs.writeFile(cssTarget, cssContent, 'utf8');
    console.log(`Saved CSS to ${cssTarget}`);
  } catch (err) {
    console.error('Error during icon CSS generation:', err);
  }
})();

/**
 * Organizes a list of icons by prefix.
 * @param {Array} icons - Array of icon names
 * @returns {Object} - Sorted icons grouped by prefix
 */
function organizeIconsList(icons) {
  const sorted = {};

  icons.forEach(icon => {
    const item = stringToIcon(icon);

    if (!item) {
      return;
    }

    const prefix = item.prefix;
    const prefixList = sorted[prefix] ? sorted[prefix] : (sorted[prefix] = []);

    const name = item.name;

    if (prefixList.indexOf(name) === -1) {
      prefixList.push(name);
    }
  });

  return sorted;
}
