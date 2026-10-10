import fs from 'fs';
import zlib from 'zlib';

// Helper to write a uncompressed / deflate PNG file using pure Node.js
function createPng(width, height, getPixel) {
  // getPixel(x, y) returns [r, g, b, a]
  const rawBytes = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      rawBytes[offset++] = r;
      rawBytes[offset++] = g;
      rawBytes[offset++] = b;
      rawBytes[offset++] = a;
    }
  }

  const deflated = zlib.deflateSync(rawBytes);

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);

    // CRC32 calculation
    let crc = 0xffffffff;
    const crcBuf = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    for (let i = 0; i < crcBuf.length; i++) {
      crc ^= crcBuf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    buf.writeInt32BE(crc ^ 0xffffffff, 8 + len);
    return buf;
  }

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Generate Cecilian Alumni Emblem PNG
function generateCecilianIcon(size, isMaskable = false) {
  const center = size / 2;
  const radius = size * 0.44;
  const innerRadius = size * 0.38;

  return createPng(size, size, (x, y) => {
    const dx = x - center;
    const dy = y - center;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Background for maskable is full bleed crimson #8B181B
    if (isMaskable) {
      if (dist <= innerRadius) {
        // Inner gold emblem
        const goldDist = Math.sqrt(dx * dx + (dy + size * 0.05) * (dy + size * 0.05));
        if (goldDist < size * 0.22) {
          return [217, 119, 6, 255]; // Amber #D97706
        }
        return [139, 24, 27, 255]; // St. Cecilia Crimson
      } else if (dist <= radius) {
        return [245, 158, 11, 255]; // Gold ring #F59E0B
      } else {
        return [114, 19, 22, 255]; // Dark Crimson backdrop #721316
      }
    }

    // Standard Icon with rounded border
    if (dist <= innerRadius) {
      // Lyre / Star gold core
      if (Math.abs(dx) < size * 0.08 && Math.abs(dy) < size * 0.18) {
        return [254, 243, 199, 255]; // Soft cream gold
      }
      return [139, 24, 27, 255]; // Crimson #8B181B
    } else if (dist <= radius) {
      return [217, 119, 6, 255]; // Gold border #D97706
    } else {
      return [0, 0, 0, 0]; // Transparent
    }
  });
}

// Generate assets
fs.writeFileSync('public/pwa-192x192.png', generateCecilianIcon(192, false));
fs.writeFileSync('public/pwa-512x512.png', generateCecilianIcon(512, false));
fs.writeFileSync('public/pwa-maskable-512x512.png', generateCecilianIcon(512, true));
fs.writeFileSync('public/apple-touch-icon.png', generateCecilianIcon(180, true));

// Create SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="128" fill="#8B181B"/>
  <circle cx="256" cy="256" r="210" fill="none" stroke="#D97706" stroke-width="14"/>
  <circle cx="256" cy="256" r="192" fill="#721316"/>
  <!-- Lyre / Harp & Laurel Motif for St. Cecilia (Patron Saint of Musicians & Academics) -->
  <path d="M256 120 L280 180 L345 185 L295 225 L312 290 L256 250 L200 290 L217 225 L167 185 L232 180 Z" fill="#F59E0B"/>
  <circle cx="256" cy="350" r="32" fill="#D97706"/>
  <text x="256" y="430" font-family="serif" font-size="44" font-weight="bold" text-anchor="middle" fill="#FAF9F6" letter-spacing="4">ST. CECILIA'S</text>
  <text x="256" y="468" font-family="sans-serif" font-size="24" font-weight="600" text-anchor="middle" fill="#FCD34D" letter-spacing="6">ALUMNI</text>
</svg>`;

fs.writeFileSync('public/icon.svg', svgContent);
console.log('PWA icons successfully generated.');
