const express = require('express');
const { z } = require('zod');
const { register, login, me, updatePreference } = require('../controllers/authController');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Please provide a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email'),
  password: z.string().min(1, 'Password is required'),
});

// A slug of any length is shape-checked here; membership is enforced in the
// controller against the canonical registry.
const preferenceSchema = z.object({
  templateSlug: z.string().trim().min(1, 'templateSlug is required').nullable(),
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

router.get('/me', authMiddleware, me);
router.patch('/preference', authMiddleware, validate(preferenceSchema), updatePreference);

module.exports = router;
