const fs = require('fs');
const path = require('path');

/**
 * Save a base64 image string to disk under the uploads folder and return public path.
 * @param {string} base64string - base64 data (with or without data:prefix)
 * @param {string} relativeUploadDir - relative path under project root 'uploads/...'
 * @param {string} [fileName] - optional filename to use
 * @returns {string} publicPath - e.g. 'uploads/agency/prof/123.png'
 */
function saveBase64Image(base64string, relativeUploadDir, fileName) {
  if (!base64string) return null;
  try {
    const base64 = base64string.includes(',') ? base64string.split(',')[1] : base64string;
    const buffer = Buffer.from(base64, 'base64');

    const uploadDir = path.resolve(__dirname, '../../../', relativeUploadDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = 'png';
    const name = fileName || `img_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, name);

    fs.writeFileSync(filePath, buffer);

    // return web-accessible path
    return `${relativeUploadDir.replace(/\\/g, '/')}/${name}`;
  } catch (err) {
    console.error('saveBase64Image error', err);
    return null;
  }
}

module.exports = saveBase64Image;
