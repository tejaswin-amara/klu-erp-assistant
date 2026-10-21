import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const check = Buffer.alloc(4); check.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, check]);
}
function png(size) {
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4);
  header[8] = 8; header[9] = 6;
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4); row[0] = 0;
    for (let x = 0; x < size; x++) {
      const p = 1 + x * 4;
      const edge = x < Math.max(1, Math.round(size / 24)) || y < Math.max(1, Math.round(size / 24)) || x >= size - Math.max(1, Math.round(size / 24)) || y >= size - Math.max(1, Math.round(size / 24));
      row[p] = edge ? 255 : 29; row[p + 1] = edge ? 255 : 78; row[p + 2] = edge ? 255 : 216; row[p + 3] = 255;
    }
    rows.push(row);
  }
  const image = zlib.deflateSync(Buffer.concat(rows), { level: 9 });
  return Buffer.concat([signature, chunk('IHDR', header), chunk('IDAT', image), chunk('IEND', Buffer.alloc(0))]);
}
fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
for (const size of [16, 48, 128]) fs.writeFileSync(path.join(root, `assets/icon${size}.png`), png(size));
console.log('Generated deterministic extension icons (16, 48, 128 px).');
