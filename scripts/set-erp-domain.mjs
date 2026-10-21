import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const input = process.argv[2];
if (!input) {
  console.error('Usage: npm run set-domain -- https://erp.example.edu');
  process.exit(2);
}
let url;
try { url = new URL(input); } catch { console.error('Invalid URL.'); process.exit(2); }
if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || input.includes('*')) {
  console.error('Provide one exact HTTPS origin only, e.g. https://erp.example.edu (no path, credentials, wildcard, query, or fragment).');
  process.exit(2);
}
const origin = url.origin;
const manifestPath = path.join(root, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.content_scripts = manifest.content_scripts.map((item) => ({ ...item, matches: [`${origin}/*`] }));
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(path.join(root, 'src/shared/config.js'), `export const SUPPORTED_ERP_ORIGIN = ${JSON.stringify(origin)};\n`);
fs.writeFileSync(path.join(root, 'src/content/config.js'), `(function attachKluErpConfig(root) {\n  'use strict';\n  root.KluErpExtensionConfig = Object.freeze({ supportedOrigin: ${JSON.stringify(origin)} });\n})(globalThis);\n`);
console.log(`Configured exact origin ${origin}. Reload the unpacked extension and the ERP tab in Chrome.`);
