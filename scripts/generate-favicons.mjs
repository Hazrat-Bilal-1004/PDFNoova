import fs from 'fs';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const src = 'public/pdfnoova-logo.jpeg';
const icoPath = 'public/favicon.ico';
const svgPath = 'public/favicon.svg';

async function generate() {
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = await Promise.all(
    sizes.map(async (size) => {
      return sharp(src).resize(size, size, { fit: 'cover' }).png().toBuffer();
    }),
  );

  const ico = await pngToIco(pngBuffers);
  await fs.promises.writeFile(icoPath, ico);

  const jpegData = await fs.promises.readFile(src);
  const base64 = jpegData.toString('base64');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">\n  <image href="data:image/jpeg;base64,${base64}" x="0" y="0" width="64" height="64" preserveAspectRatio="xMidYMid slice"/>\n</svg>`;
  await fs.promises.writeFile(svgPath, svg, 'utf8');

  console.log('favicon.ico and favicon.svg generated successfully.');
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});