const fs = require('fs');
const zlib = require('zlib');

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return ~crc;
}

function createPNG(width, height, r, g, b) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  
  const ihdrChunk = Buffer.concat([Buffer.from('IHDR'), ihdr]);
  const ihdrCrc = crc32(ihdrChunk);
  
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0);
    for (let x = 0; x < width; x++) {
      rawData.push(r, g, b, 255);
    }
  }
  
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idatChunk = Buffer.concat([Buffer.from('IDAT'), compressed]);
  const idatCrc = crc32(idatChunk);
  
  const iendChunk = Buffer.from('IEND');
  const iendCrc = crc32(iendChunk);
  
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(13, 0);
  const ihdrCrcBuf = Buffer.alloc(4);
  ihdrCrcBuf.writeUInt32BE(ihdrCrc >>> 0, 0);
  
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(compressed.length, 0);
  const idatCrcBuf = Buffer.alloc(4);
  idatCrcBuf.writeUInt32BE(idatCrc >>> 0, 0);
  
  const iendLength = Buffer.alloc(4);
  iendLength.writeUInt32BE(0, 0);
  const iendCrcBuf = Buffer.alloc(4);
  iendCrcBuf.writeUInt32BE(iendCrc >>> 0, 0);
  
  return Buffer.concat([
    signature,
    ihdrLength, ihdrChunk, ihdrCrcBuf,
    idatLength, idatChunk, idatCrcBuf,
    iendLength, iendChunk, iendCrcBuf
  ]);
}

if (!fs.existsSync('public/icons')) {
  fs.mkdirSync('public/icons', { recursive: true });
}

fs.writeFileSync('public/icons/icon-192x192.png', createPNG(192, 192, 24, 144, 255));
fs.writeFileSync('public/icons/icon-512x512.png', createPNG(512, 512, 24, 144, 255));

console.log('Icons created successfully');
