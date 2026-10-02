const path = require('path');
const os = require('os');
const fs = require('fs');
const { extractText, getDocumentProxy } = require('unpdf');
const mammoth = require('mammoth');
const { recognize } = require('tesseract.js');
const { ApiError } = require('../middleware/errorHandler');

const MAX_TEXT_LENGTH = 60000; // cap extracted text sent to the AI

// OCR settings (used for image uploads)
const OCR_LANGS = process.env.OCR_LANGS || 'eng';
const OCR_TIMEOUT_MS = Number(process.env.OCR_TIMEOUT_MS || 60000);
const OCR_CACHE_DIR = path.join(os.tmpdir(), 'cvlens-ocr');

const isImage = (name) => /\.(png|jpe?g|webp|bmp)$/i.test(name);
const isPdf = (name) => /\.pdf$/i.test(name);
const isDocx = (name) => /\.docx$/i.test(name);
const isTxt = (name) => /\.txt$/i.test(name);

/** Runs tesseract.js OCR on an image buffer with a timeout. */
const ocrImage = async (buffer) => {
  fs.mkdirSync(OCR_CACHE_DIR, { recursive: true }); // persist traineddata downloads
  const { data } = await Promise.race([
    recognize(buffer, OCR_LANGS, { cachePath: OCR_CACHE_DIR }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('OCR_TIMED_OUT')), OCR_TIMEOUT_MS)
    ),
  ]);
  return data?.text || '';
};

/**
 * Extracts plain text from an uploaded CV buffer.
 * Supported: PDF, DOCX, images (PNG/JPG/WEBP/BMP via OCR), TXT.
 * @param {Buffer} buffer
 * @param {string} originalName - used to detect type and for error messages
 * @returns {Promise<string>} extracted text
 */
const extractCvText = async (buffer, originalName) => {
  const name = (originalName || '').toLowerCase();

  let text = '';
  try {
    if (isPdf(name)) {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text: pdfText } = await extractText(pdf, { mergePages: true });
      text = Array.isArray(pdfText) ? pdfText.join('\n') : String(pdfText || '');
    } else if (isDocx(name)) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || '';
    } else if (isImage(name)) {
      text = await ocrImage(buffer);
    } else if (isTxt(name)) {
      text = buffer.toString('utf8').replace(/^\uFEFF/, ''); // strip BOM
    } else {
      throw new ApiError(
        400,
        'Unsupported file type. Please upload a PDF, DOCX, PNG/JPG image, or TXT file.'
      );
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.message === 'OCR_TIMED_OUT') {
      throw new ApiError(504, 'Reading text from the image took too long. Please try a smaller or clearer image.');
    }
    if (isImage(name)) {
      throw new ApiError(422, 'Could not read the image. It may be corrupted or in an unsupported format.');
    }
    throw new ApiError(422, 'Could not read text from the file. It may be corrupted, password-protected, or unsupported.');
  }

  const cleaned = String(text)
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .trim();

  if (!cleaned || cleaned.length < 30) {
    if (isImage(name)) {
      throw new ApiError(422, 'No readable text found in the image. Blurry, low-resolution or handwritten images may fail — try a clearer photo or a PDF.');
    }
    throw new ApiError(422, 'The file appears to contain no readable text. Scanned/image-based PDFs are only supported via image upload (PNG/JPG).');
  }

  if (cleaned.length > MAX_TEXT_LENGTH) {
    return cleaned.slice(0, MAX_TEXT_LENGTH);
  }
  return cleaned;
};

module.exports = { extractCvText };
