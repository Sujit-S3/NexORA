const sharp = require('sharp');
const path = require('path');

async function processImage(inputPath, outputPath) {
  try {
    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Target background color is roughly (201, 186, 167)
    // We'll use a tolerance
    const targetR = 201;
    const targetG = 186;
    const targetB = 167;
    const tolerance = 60; // wide tolerance for JPEG artifacts

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const diff = Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB);
      if (diff < tolerance) {
        data[i + 3] = 0; // Set alpha to 0
      } else if (r > 230 && g > 230 && b > 230) {
        data[i + 3] = 0; // Remove white too just in case
      }
    }

    await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4,
      },
    })
      .webp({ quality: 90 })
      .toFile(outputPath);

    console.log(`Processed: ${outputPath}`);
  } catch (err) {
    console.error(`Error processing ${inputPath}:`, err.message);
  }
}

const input = 'C:/Users/sssuj/.gemini/antigravity-ide/brain/423cbddb-dccc-4cb1-b865-63d1d961385e/luxury_dark_bag_1782319960504.png';
const output = path.join(__dirname, '../public/assets/luxury/bags/handbag_light_transparent.webp');

processImage(input, output);
