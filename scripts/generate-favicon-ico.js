const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function generateFaviconIco() {
  const publicDir = path.join(__dirname, '../public');

  try {
    console.log('Generating favicon.ico from PNG files...');

    // Create ICO with multiple sizes (16x16, 32x32, 48x48)
    const buf = await pngToIco.default([
      path.join(publicDir, 'favicon-16x16.png'),
      path.join(publicDir, 'favicon-32x32.png'),
      path.join(publicDir, 'favicon-48x48.png')
    ]);

    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), buf);

    console.log('✅ favicon.ico generated successfully!');
    console.log('Contains: 16x16, 32x32, 48x48 sizes');

  } catch (error) {
    console.error('Error generating favicon.ico:', error);
    process.exit(1);
  }
}

generateFaviconIco();
