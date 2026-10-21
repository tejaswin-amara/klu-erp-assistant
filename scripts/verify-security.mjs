import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const problems = [];
const runtimeFiles = [
  'src/content/config.js', 'src/content/page-assistance.js', 'src/content/content-script.js',
  'src/popup/popup.js', 'src/shared/config.js', 'src/shared/constants.js',
  'src/shared/url-validator.js', 'src/shared/messages.js', 'src/shared/preferences.js'
];
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

if (manifest.manifest_version !== 3) problems.push('Manifest is not version 3.');
if (manifest.permissions.some((p) => ['cookies', 'webRequest', 'debugger', 'scripting', 'nativeMessaging'].includes(p))) problems.push('Unjustified high-risk permission present.');
if (JSON.stringify(manifest).includes('<all_urls>') || (manifest.host_permissions || []).some((p) => p.includes('*'))) problems.push('Broad host permission present.');
if (manifest.background?.service_worker) problems.push('Unexpected background service worker.');
if (!manifest.content_scripts?.length || manifest.content_scripts.some((s) => s.matches.some((m) => !/^https:\/\/[^/*]+\/\*$/.test(m)))) problems.push('Content script URL match is not an exact HTTPS host pattern.');

const all = runtimeFiles.map((file) => [file, read(file)]);
const forbiddenRuntime = [
  ['ONNX/OCR inference assets', /onnxruntime|ort-wasm|crnn\.onnx|\bonnx\b/i],
  ['Network-capable request APIs', /\bfetch\s*\(|\bXMLHttpRequest\b|\bsendBeacon\s*\(/],
  ['Dynamic execution', /\beval\s*\(|new\s+Function\s*\(/],
  ['HTML string injection', /\.(?:innerHTML|outerHTML)\s*=|document\.write\s*\(/],
  ['Automatic form submission', /\.(?:submit|requestSubmit)\s*\(/]
];
for (const [file, source] of all) {
  for (const [name, pattern] of forbiddenRuntime) if (pattern.test(source)) problems.push(`${name} pattern found in ${file}.`);
}
const content = read('src/content/content-script.js') + '\n' + read('src/content/page-assistance.js');
if (/\b(?:captchaInput|captchaField|verifyCode|captchaElement)\s*\.\s*value\s*=|\.\s*value\s*=\s*[^=]/i.test(content)) problems.push('Input value assignment found in content-side code.');
const allManifestPaths = [manifest.action.default_popup, ...Object.values(manifest.icons || {}), ...Object.values(manifest.action.default_icon || {}), ...manifest.content_scripts.flatMap((s) => s.js)];
for (const item of allManifestPaths) if (!fs.existsSync(path.join(root, item))) problems.push(`Manifest references missing file: ${item}`);
for (const rel of runtimeFiles) {
  if (!fs.existsSync(path.join(root, rel))) problems.push(`Missing runtime source ${rel}`);
  const source = read(rel);
  if (/-----BEGIN (?:RSA|EC|OPENSSH|PRIVATE) KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{30,}/.test(source)) problems.push(`Possible hard-coded secret in ${rel}`);
}
for (const rel of ['lib/ort-wasm-simd.wasm','lib/ort-wasm.wasm','lib/ort.min.js','model/crnn.onnx']) {
  if (fs.existsSync(path.join(root, rel))) problems.push(`Prohibited legacy asset remains: ${rel}`);
}
if (problems.length) {
  console.error('SECURITY VERIFICATION FAILED');
  for (const p of problems) console.error(`- ${p}`);
  process.exit(1);
}
console.log(`SECURITY PASS: validated MV3 manifest, ${runtimeFiles.length} runtime source files, narrow HTTPS matching, no detected network/remote-code/auto-submit/OCR patterns, and no referenced legacy model files.`);
