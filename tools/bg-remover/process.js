const { removeBackground } = require('@imgly/background-removal-node');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processImage(inputPath, outputPath) {
    try {
        console.log(`Processing: ${inputPath}`);
        // Read file into buffer
        const inputBuffer = fs.readFileSync(inputPath);
        
        // Remove background (returns a Blob)
        const blob = await removeBackground(inputBuffer);
        
        // Convert Blob to Buffer
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Use Sharp to save as high-quality WEBP
        await sharp(buffer)
            .webp({ quality: 95, lossless: false })
            .toFile(outputPath);
            
        console.log(`Success! Saved to ${outputPath}`);
    } catch (err) {
        console.error(`Error processing ${inputPath}:`, err);
    }
}

const inputImage = process.argv[2];
const outputImage = process.argv[3];

if (!inputImage || !outputImage) {
    console.error("Usage: node process.js <input> <output>");
    process.exit(1);
}

processImage(inputImage, outputImage);
