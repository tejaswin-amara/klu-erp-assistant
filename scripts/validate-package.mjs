import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const root = process.cwd();
const dist = path.join(root, 'dist');
const zipPath = path.join(dist, 'klu-erp-assistant-v2.0.0.zip');
const checksumPath = path.join(dist, 'klu-erp-assistant-v2.0.0.sha256');
const extractPath = path.join(dist, 'unpacked-verify');
function readU16(b, o) { return b.readUInt16LE(o); }
function readU32(b, o) { return b.readUInt32LE(o); }
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function safePath(name) {
  const posix = name.replaceAll('\\', '/');
  return !posix.startsWith('/') && !posix.split('/').includes('..') && !/^[A-Za-z]:/.test(posix);
}
if (!fs.existsSync(zipPath) || !fs.existsSync(checksumPath)) throw new Error('Release ZIP or checksum file is missing. Run npm run package first.');
const zip = fs.readFileSync(zipPath);
const checksumLine = fs.readFileSync(checksumPath, 'utf8').trim().split(/\s+/)[0];
const actualHash = crypto.createHash('sha256').update(zip).digest('hex');
if (checksumLine !== actualHash) throw new Error('SHA-256 checksum mismatch.');
fs.rmSync(extractPath, { recursive: true, force: true });
fs.mkdirSync(extractPath, { recursive: true });
const names = [];
let cursor = 0;
while (cursor + 4 <= zip.length) {
  const signature = readU32(zip, cursor);
  if (signature !== 0x04034b50) break;
  const method = readU16(zip, cursor + 8);
  const crc = readU32(zip, cursor + 14);
  const compressedSize = readU32(zip, cursor + 18);
  const rawSize = readU32(zip, cursor + 22);
  const nameLength = readU16(zip, cursor + 26);
  const extraLength = readU16(zip, cursor + 28);
  const nameStart = cursor + 30;
  const name = zip.subarray(nameStart, nameStart + nameLength).toString('utf8');
  if (!safePath(name)) throw new Error(`Unsafe archive path: ${name}`);
  const dataStart = nameStart + nameLength + extraLength;
  const compressed = zip.subarray(dataStart, dataStart + compressedSize);
  let data;
  if (method === 8) data = zlib.inflateRawSync(compressed);
  else if (method === 0) data = Buffer.from(compressed);
  else throw new Error(`Unsupported ZIP compression method ${method} for ${name}`);
  if (data.length !== rawSize || crc32(data) !== crc) throw new Error(`CRC/size mismatch for ${name}`);
  const target = path.join(extractPath, ...name.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
  names.push(name);
  cursor = dataStart + compressedSize;
}
if (!names.includes('manifest.json') || !names.includes('src/content/content-script.js') || !names.includes('src/popup/popup.html')) throw new Error('Required runtime files missing from archive.');
if (names.some((name) => /(?:ort-wasm|ort\.min\.js|crnn\.onnx|model\/)/i.test(name))) throw new Error('Forbidden OCR/model runtime assets found in archive.');
const manifest = JSON.parse(fs.readFileSync(path.join(extractPath, 'manifest.json'), 'utf8'));
if (manifest.manifest_version !== 3) throw new Error('Packaged manifest is not Manifest V3.');
const paths = [manifest.action?.default_popup, ...Object.values(manifest.icons || {}), ...Object.values(manifest.action?.default_icon || {}), ...manifest.content_scripts.flatMap((item) => item.js)];
for (const rel of paths) if (!rel || !fs.existsSync(path.join(extractPath, rel))) throw new Error(`Manifest path not present in freshly extracted archive: ${rel}`);
if (manifest.permissions.some((item) => !['storage', 'activeTab'].includes(item))) throw new Error('Unexpected extension permission in packaged manifest.');
if (manifest.host_permissions?.some((item) => item === '<all_urls>' || item.includes('*'))) throw new Error('Broad host permission in packaged manifest.');
console.log(`PACKAGE VALIDATION PASS: ${names.length} files extracted; every CRC and size matches; manifest references exist; SHA-256 verified.`);
console.log(`Fresh extraction: ${path.relative(root, extractPath)}`);
console.log(`SHA-256: ${actualHash}`);
