import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const root = process.cwd();
const dist = path.join(root, 'dist');
const zipPath = path.join(dist, 'klu-erp-assistant-v2.0.0.zip');
const checksumPath = path.join(dist, 'klu-erp-assistant-v2.0.0.sha256');
const fixedDate = new Date('2024-01-01T00:00:00Z');
const dosTime = 0;
const dosDate = ((fixedDate.getUTCFullYear() - 1980) << 9) | ((fixedDate.getUTCMonth() + 1) << 5) | fixedDate.getUTCDate();

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function u16(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; }
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; }
function filesUnder(relDir) {
  const out = [];
  const absDir = path.join(root, relDir);
  for (const item of fs.readdirSync(absDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = `${relDir}/${item.name}`;
    if (item.isDirectory()) out.push(...filesUnder(rel));
    else if (item.isFile()) out.push(rel.replaceAll('\\', '/'));
  }
  return out;
}
const included = [
  'manifest.json', 'README.md', 'CHANGELOG.md', 'LICENSE-NOTICE.txt',
  ...filesUnder('src'), ...filesUnder('assets'), ...filesUnder('docs')
].sort();
if (included.some((name) => name.startsWith('/') || name.split('/').includes('..'))) throw new Error('Unsafe package path detected.');
const localRecords = [];
const centralRecords = [];
let offset = 0;
for (const name of included) {
  const nameBytes = Buffer.from(name, 'utf8');
  const data = fs.readFileSync(path.join(root, name));
  const compressed = zlib.deflateRawSync(data, { level: 9 });
  const crc = crc32(data);
  const local = Buffer.concat([
    u32(0x04034b50), u16(20), u16(0x0800), u16(8), u16(dosTime), u16(dosDate),
    u32(crc), u32(compressed.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes, compressed
  ]);
  localRecords.push(local);
  const central = Buffer.concat([
    u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(8), u16(dosTime), u16(dosDate),
    u32(crc), u32(compressed.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0),
    u16(0), u16(0), u32(0), u32(offset), nameBytes
  ]);
  centralRecords.push(central);
  offset += local.length;
}
const centralBuffer = Buffer.concat(centralRecords);
const eocd = Buffer.concat([
  u32(0x06054b50), u16(0), u16(0), u16(included.length), u16(included.length),
  u32(centralBuffer.length), u32(offset), u16(0)
]);
fs.mkdirSync(dist, { recursive: true });
const zip = Buffer.concat([...localRecords, centralBuffer, eocd]);
fs.writeFileSync(zipPath, zip);
const hash = crypto.createHash('sha256').update(zip).digest('hex');
fs.writeFileSync(checksumPath, `${hash}  ${path.basename(zipPath)}\n`);
console.log(`Packaged ${included.length} allowlisted files: ${path.relative(root, zipPath)}`);
console.log(`ZIP bytes: ${zip.length}`);
console.log(`SHA-256: ${hash}`);
