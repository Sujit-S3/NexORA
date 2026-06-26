const fs = require('fs');
const path = require('path');

// Read the PNG file
const inputPath = 'C:\\Users\\sssuj\\.gemini\\antigravity-ide\\brain\\cdf55615-761b-4aba-b07a-f32d184a23cb\\media__1782228795990.png';
const outputPath = 'C:\\NexORA\\client\\public\\logo-nexora.png';

// We'll use sharp if available, otherwise do raw PNG manipulation
try {
  const sharp = require('sharp');
  sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const avg = (r + g + b) / 3;
        if (avg > 240 && r > 220 && g > 220 && b > 220) {
          data[i+3] = 0;
        } else if (avg > 210 && r > 200 && g > 200 && b > 200) {
          data[i+3] = Math.round(255 * ((avg - 210) / 30));
        }
      }
      return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png()
        .toFile(outputPath);
    })
    .then(() => console.log('Done with sharp'))
    .catch(e => console.error(e));
} catch (e) {
  console.log('sharp not available, trying jimp...');
  try {
    const Jimp = require('jimp');
    Jimp.read(inputPath).then(img => {
      img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
        const r = this.bitmap.data[idx];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        const avg = (r + g + b) / 3;
        if (avg > 240 && r > 220 && g > 220 && b > 220) {
          this.bitmap.data[idx + 3] = 0;
        } else if (avg > 210) {
          this.bitmap.data[idx + 3] = Math.round(255 * ((avg - 210) / 30));
        }
      });
      return img.writeAsync(outputPath);
    }).then(() => console.log('Done with jimp')).catch(e => console.error(e));
  } catch(e2) {
    console.log('Neither sharp nor jimp available:', e2.message);
    // Just copy the original as fallback
    fs.copyFileSync(inputPath, outputPath);
    console.log('Copied original (white background)');
  }
}
