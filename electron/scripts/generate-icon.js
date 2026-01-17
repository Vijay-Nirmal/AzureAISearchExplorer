const { app, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'build', 'icon.svg');
const pngPath = path.join(__dirname, '..', 'build', 'icon.png');

async function generateIcon() {
  try {
    const image = nativeImage.createFromPath(svgPath);
    if (image.isEmpty()) {
      console.error(`Failed to load SVG icon at ${svgPath}`);
      process.exitCode = 1;
      return;
    }

    const png = image.resize({ width: 256, height: 256 }).toPNG();
    await fs.promises.writeFile(pngPath, png);
    console.log(`Generated icon: ${pngPath}`);
  } catch (error) {
    console.error('Failed to generate icon:', error);
    process.exitCode = 1;
  }
}

app.whenReady().then(async () => {
  await generateIcon();
  app.quit();
});
