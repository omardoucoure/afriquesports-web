const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicons() {
  const sourceLogo = path.join(__dirname, '../public/logo.jpg');
  const publicDir = path.join(__dirname, '../public');

  try {
    // Get source image metadata
    const metadata = await sharp(sourceLogo).metadata();
    console.log(`Source logo: ${metadata.width}x${metadata.height}`);

    // Create a square canvas by adding transparent padding
    const maxDim = Math.max(metadata.width, metadata.height);
    const paddingLeft = Math.floor((maxDim - metadata.width) / 2);
    const paddingTop = Math.floor((maxDim - metadata.height) / 2);

    console.log('Creating square base with transparent padding...');

    // Create square base image with transparent background
    const squareLogo = await sharp(sourceLogo)
      .extend({
        top: paddingTop,
        bottom: maxDim - metadata.height - paddingTop,
        left: paddingLeft,
        right: maxDim - metadata.width - paddingLeft,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toBuffer();

    // Generate favicon-16x16.png
    console.log('Generating favicon-16x16.png...');
    await sharp(squareLogo)
      .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-16x16.png'));

    // Generate favicon-32x32.png
    console.log('Generating favicon-32x32.png...');
    await sharp(squareLogo)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-32x32.png'));

    // Generate 48x48 for favicon.ico (common size)
    console.log('Generating favicon-48x48.png...');
    await sharp(squareLogo)
      .resize(48, 48, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-48x48.png'));

    console.log('\n✅ Favicons regenerated successfully!');
    console.log('\nGenerated files:');
    console.log('- favicon-16x16.png (16x16, square with padding)');
    console.log('- favicon-32x32.png (32x32, square with padding)');
    console.log('- favicon-48x48.png (48x48, square with padding)');
    console.log('\nNote: favicon.ico should be regenerated using an ICO converter tool');
    console.log('You can use: https://www.favicon-generator.org/');
    console.log('Or use: favicon-16x16.png, favicon-32x32.png, favicon-48x48.png');

  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
