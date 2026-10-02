const express = require('express');
const rateLimit = require('express-rate-limit');
const { scan, getHistory, getAnalysisById } = require('../controllers/analysisController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

// AI scans are expensive - limit to 10 per 15 minutes per IP
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many scans. Please wait a few minutes and try again.' },
});

// All analysis routes are protected
router.use(authMiddleware);

router.post('/scan', scanLimiter, upload.single('cv'), scan);
router.get('/history', getHistory);
router.get('/:id', getAnalysisById);

module.exports = router;
