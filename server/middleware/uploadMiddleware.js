const multer = require('multer');

// PDF, DOCX, common images (for OCR) and plain text
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/bmp',
  'text/plain',
]);
const ALLOWED_EXT = /\.(pdf|docx|png|jpe?g|webp|bmp|txt)$/i;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter(req, file, cb) {
    const nameOk = ALLOWED_EXT.test(file.originalname || '');
    if (!ALLOWED_MIME.has(file.mimetype) && !nameOk) {
      const err = new Error('Only PDF, DOCX, image (PNG/JPG/WEBP/BMP) or TXT files are allowed');
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

module.exports = { upload, MAX_FILE_SIZE };
