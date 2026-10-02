const express = require('express');
const { z } = require('zod');
const {
  getStats,
  listUsers,
  updateUserRole,
  deleteUser,
  listAllAnalyses,
  deleteAnalysis,
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// Every admin route requires a valid token AND the admin role
router.use(authMiddleware, requireAdmin);

const roleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

router.get('/stats', getStats);
router.get('/users', listUsers);
router.patch('/users/:id/role', validate(roleSchema), updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/analyses', listAllAnalyses);
router.delete('/analyses/:id', deleteAnalysis);

module.exports = router;
