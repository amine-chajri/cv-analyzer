const User = require('../models/User');
const Analysis = require('../models/Analysis');
const { ApiError } = require('../middleware/errorHandler');

/** GET /api/admin/stats - platform overview */
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalAnalyses, avgScoreAgg, recentAnalyses] = await Promise.all([
      User.countDocuments(),
      Analysis.countDocuments(),
      Analysis.aggregate([{ $group: { _id: null, avg: { $avg: '$overallScore' } } }]),
      Analysis.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAnalyses,
        analysesLast7Days: recentAnalyses,
        averageMatchScore: avgScoreAgg.length ? Math.round(avgScoreAgg[0].avg) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/admin/users - list all users with their analysis counts */
const listUsers = async (req, res, next) => {
  try {
    const users = await User.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'analyses',
          localField: '_id',
          foreignField: 'userId',
          as: 'analyses',
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          analysisCount: { $size: '$analyses' },
          avgScore: { $round: [{ $avg: '$analyses.overallScore' }, 0] },
        },
      },
    ]);

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/admin/users/:id/role - promote/demote a user */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      throw new ApiError(400, 'Role must be either "user" or "admin"');
    }
    if (req.params.id === String(req.user.id) && role !== 'admin') {
      throw new ApiError(400, 'You cannot remove your own admin role');
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('name email role');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({ success: true, message: `Role updated to ${role}`, data: user });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/admin/users/:id - delete a user and their analyses */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === String(req.user.id)) {
      throw new ApiError(400, 'You cannot delete your own account');
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    await Analysis.deleteMany({ userId: req.params.id });

    res.json({ success: true, message: 'User and their analyses deleted' });
  } catch (err) {
    next(err);
  }
};

/** GET /api/admin/analyses - all analyses across all users */
const listAllAnalyses = async (req, res, next) => {
  try {
    const analyses = await Analysis.find()
      .select('originalFileName overallScore userId createdAt')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json({ success: true, data: analyses });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/admin/analyses/:id - delete any analysis */
const deleteAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findByIdAndDelete(req.params.id);
    if (!analysis) {
      throw new ApiError(404, 'Analysis not found');
    }
    res.json({ success: true, message: 'Analysis deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  listUsers,
  updateUserRole,
  deleteUser,
  listAllAnalyses,
  deleteAnalysis,
};
