const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processImage(inputPath, outputPath, isDark) {
  try {
    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // isDark means the image has a black background we want to remove
    // !isDark means the image has a white background we want to remove
    const threshold = isDark ? 20 : 235;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (isDark) {
        if (r < threshold && g < threshold && b < threshold) {
          data[i + 3] = 0; // Set alpha to 0
        }
      } else {
        if (r > threshold && g > threshold && b > threshold) {
          data[i + 3] = 0; // Set alpha to 0
        }
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

const run = async () => {
  const watchInput = path.join(__dirname, '../public/assets/luxury/watches/rolex_daytona.png');
  const watchOutput = path.join(__dirname, '../public/assets/luxury/watches/watch_dark_transparent.webp');
  
  const bagInput = path.join(__dirname, '../public/assets/luxury/bags/bag_white_bg.png');
  const bagOutput = path.join(__dirname, '../public/assets/luxury/bags/handbag_light_transparent.webp');

  await processImage(watchInput, watchOutput, true);
  await processImage(bagInput, bagOutput, false);
};

run();
