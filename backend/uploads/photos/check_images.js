const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = __dirname;

fs.readdir(dir, async (err, files) => {
  if (err) throw err;
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.lstatSync(filePath).isFile()) {
      try {
        const metadata = await sharp(filePath).metadata();
        console.log(`${file} : OK (${metadata.format}, ${metadata.width}x${metadata.height})`);
      } catch (e) {
        console.log(`${file} : NON VALIDE ou non image (${e.message})`);
      }
    }
  }
}); 