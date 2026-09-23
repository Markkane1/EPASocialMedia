/**
 * EPA Punjab Social Media Dashboard — Frontend Asset Bundler
 * Addresses Audit.md L-01 (unrestricted /src exposure) and L-07 (frontend build pipeline).
 * Native Node.js micro-bundler: compiles ES modules into a single self-contained bundle
 * with zero external build dependencies, eliminating the need to expose raw /src over HTTP.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '../..');
const srcJsDir = path.join(rootDir, 'frontend/src/js');
const srcCssFile = path.join(rootDir, 'frontend/src/css/style.css');
const distDir = path.join(rootDir, 'frontend/public/dist');

const jsFiles = [
  'utils/formatters.js',
  'state/dashboardState.js',
  'api/apiClient.js',
  'utils/animations.js',
  'router/viewRouter.js',
  'components/Header.js',
  'components/KpiCards.js',
  'components/OverviewCharts.js',
  'components/PlatformColumns.js',
  'components/OperationalWidgets.js',
  'components/PlatformDetailView.js',
  'components/AdminSettingsView.js',
  'components/LoginView.js',
  'main.js'
];

function build() {
  if (!fs.existsSync(srcJsDir)) {
    console.log('[BUILD] No frontend source directory found, skipping frontend build.');
    return;
  }
  console.log('[BUILD] Starting frontend production asset build...');

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // 1. Build CSS
  console.log('[BUILD] Compiling stylesheet...');
  const rawCss = fs.readFileSync(srcCssFile, 'utf8');
  // Minify CSS: remove comments, collapse whitespace
  const minCss = rawCss
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .trim();

  const outCssPath = path.join(distDir, 'style.css');
  fs.writeFileSync(outCssPath, minCss, 'utf8');
  console.log(`[BUILD] CSS compiled: ${outCssPath} (${minCss.length} bytes)`);

  // 2. Build JavaScript Bundle
  console.log('[BUILD] Packaging JavaScript modules into single bundle...');
  let bundle = '(function() {\n';
  bundle += '  "use strict";\n';
  bundle += '  const __modules = {};\n';
  bundle += '  const __cache = {};\n\n';
  bundle += '  function __register(id, fn) {\n';
  bundle += '    __modules[id] = fn;\n';
  bundle += '  }\n\n';
  bundle += '  function __resolve(base, rel) {\n';
  bundle += '    const parts = base.split("/");\n';
  bundle += '    parts.pop();\n';
  bundle += '    for (const seg of rel.split("/")) {\n';
  bundle += '      if (seg === ".") continue;\n';
  bundle += '      if (seg === "..") parts.pop();\n';
  bundle += '      else parts.push(seg);\n';
  bundle += '    }\n';
  bundle += '    return parts.join("/");\n';
  bundle += '  }\n\n';
  bundle += '  function __require(id) {\n';
  bundle += '    if (__cache[id]) return __cache[id];\n';
  bundle += '    if (!__modules[id]) throw new Error("Module not found: " + id);\n';
  bundle += '    const mod = { exports: {} };\n';
  bundle += '    __cache[id] = mod.exports;\n';
  bundle += '    __modules[id](function(dep) {\n';
  bundle += '      return __require(__resolve(id, dep));\n';
  bundle += '    }, mod.exports, mod);\n';
  bundle += '    return mod.exports;\n';
  bundle += '  }\n\n';

  for (const relFile of jsFiles) {
    const fullPath = path.join(srcJsDir, relFile);
    let code = fs.readFileSync(fullPath, 'utf8');

    // Transform ES imports: import { a, b } from './path.js'; -> const { a, b } = require('./path.js');
    code = code.replace(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?/g, (_match, names, depPath) => {
      return `const { ${names.trim()} } = require("${depPath}");`;
    });

    // Transform ES exports
    // export function name(...) { -> exports.name = name; function name(...) {
    code = code.replace(/export\s+function\s+([a-zA-Z0-9_$]+)/g, (_match, fnName) => {
      return `exports.${fnName} = ${fnName};\n  function ${fnName}`;
    });

    // export class Name { -> class Name { ... exports.Name = Name;
    code = code.replace(/export\s+class\s+([a-zA-Z0-9_$]+)/g, (_match, clsName) => {
      return `exports.${clsName} = class ${clsName}`;
    });

    // export const name = ... -> const name = exports.name = ...
    code = code.replace(/export\s+const\s+([a-zA-Z0-9_$]+)\s*=/g, (_match, varName) => {
      return `const ${varName} = exports.${varName} =`;
    });

    const modKey = './' + relFile.replace(/\\/g, '/');
    bundle += `  // Module: ${modKey}\n`;
    bundle += `  __register("${modKey}", function(require, exports, module) {\n`;
    bundle += code.split('\n').map(line => '    ' + line).join('\n') + '\n';
    bundle += '  });\n\n';
  }

  bundle += '  // Boot application\n';
  bundle += '  __require("./main.js");\n';
  bundle += '})();\n';

  const outJsPath = path.join(distDir, 'bundle.js');
  fs.writeFileSync(outJsPath, bundle, 'utf8');
  console.log(`[BUILD] JS bundle created: ${outJsPath} (${bundle.length} bytes)`);

  // 3. Generate Build Manifest with SHA-256 Hashes (SRI & Integrity)
  const cssHash = crypto.createHash('sha256').update(minCss).digest('hex');
  const jsHash = crypto.createHash('sha256').update(bundle).digest('hex');

  const manifest = {
    buildDate: new Date().toISOString(),
    assets: {
      'style.css': {
        path: '/dist/style.css',
        bytes: minCss.length,
        sha256: cssHash
      },
      'bundle.js': {
        path: '/dist/bundle.js',
        bytes: bundle.length,
        sha256: jsHash
      }
    }
  };

  const manifestPath = path.join(distDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`[BUILD] Build manifest generated: ${manifestPath}`);
  console.log('[BUILD] Frontend build complete!');
}

if (require.main === module) {
  build();
}

module.exports = { build };
