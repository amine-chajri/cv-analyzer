const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isValidTemplateSlug } = require('../config/templates');
const { ApiError } = require('../middleware/errorHandler');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

const authPayload = (user) => ({
  token: signToken(user),
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    preferredTemplate: user.preferredTemplate ?? null,
  },
});

/** POST /api/auth/register */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: authPayload(user),
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/auth/login */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: authPayload(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns the full profile for the current token. Used by the client to
 * resync state (including preferredTemplate) after a stale localStorage read.
 */
const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, 'Account no longer exists.');
    }
    res.json({
      success: true,
      message: 'Profile retrieved',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredTemplate: user.preferredTemplate ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/preference
 * Stores the CV template the user selected from the template gallery.
 * Pass `templateSlug: null` to clear the preference.
 */
const updatePreference = async (req, res, next) => {
  try {
    const { templateSlug } = req.body;

    if (templateSlug !== null && !isValidTemplateSlug(templateSlug)) {
      throw new ApiError(400, 'Unknown template. Please pick one from the template gallery.');
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { preferredTemplate: templateSlug ?? null } },
      { new: true, runValidators: true }
    );
    if (!user) {
      throw new ApiError(404, 'Account no longer exists.');
    }

    res.json({
      success: true,
      message: 'Template preference saved',
      data: { preferredTemplate: user.preferredTemplate ?? null },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me, updatePreference };
