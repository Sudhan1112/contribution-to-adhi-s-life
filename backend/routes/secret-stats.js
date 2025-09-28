// SECRET ENDPOINT - Part of the assessment puzzle
// This endpoint should be discovered by reading the hints

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

async function getRegistrationStats() {
    try {
        // MongoDB aggregation pipeline to get registration stats by month
        const monthlyStats = await User.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: {
                        $concat: [
                            { $toString: "$_id.year" },
                            "-",
                            {
                                $cond: {
                                    if: { $lt: ["$_id.month", 10] },
                                    then: { $concat: ["0", { $toString: "$_id.month" }] },
                                    else: { $toString: "$_id.month" }
                                }
                            }
                        ]
                    },
                    count: 1
                }
            },
            { $sort: { month: 1 } }
        ]);

        // Convert to object format
        const stats = {};
        monthlyStats.forEach(stat => {
            stats[stat.month] = stat.count;
        });
        return stats;
    } catch (error) {
        console.error('Error in getRegistrationStats:', error);
        return {};
    }
}

// Encoded secret message (Base64)
const SECRET_MESSAGE = 'Q29uZ3JhdHVsYXRpb25zISBZb3UgZm91bmQgdGhlIHNlY3JldCBlbmRwb2ludC4gVGhlIGZpbmFsIGNsdWUgaXM6IFNIQ19IZWFkZXJfUHV6emxlXzIwMjQ=';

// Secret stats endpoint
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Check for secret header (set by server middleware)
    const secretHeader = req.get('x-secret-challenge');
    const querySecret = req.query.secret;
    
    // PUZZLE: Multiple ways to access this endpoint
    const hasSecretAccess = (
      secretHeader === 'find_me_if_you_can_2024' || 
      querySecret === 'admin_override'
    );

    // Admin-only access for full stats
    if (req.user.role !== 'admin' && !hasSecretAccess) {
      return res.status(403).json({ 
        error: 'Access denied',
        hint: 'Check the network headers or try a query parameter'
      });
    }

    // Calculate real-time stats using MongoDB aggregation
    const [
        userCounts,
        registrationStats
    ] = await Promise.all([
        User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    adminUsers: {
                        $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] }
                    },
                    regularUsers: {
                        $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] }
                    },
                    activeUsers: {
                        $sum: { $cond: ["$isActive", 1, 0] }
                    },
                    pendingActivation: {
                        $sum: { $cond: ["$isActive", 0, 1] }
                    }
                }
            }
        ]),
        getRegistrationStats()
    ]);

    const stats = {
        ...(userCounts[0] || {
            totalUsers: 0,
            adminUsers: 0,
            regularUsers: 0,
            activeUsers: 0,
            pendingActivation: 0
        }),
        systemInfo: {
            nodeVersion: process.version,
            platform: process.platform,
            uptime: process.uptime()
        },
        registrationsByMonth: registrationStats,
        timestamp: new Date().toISOString()
    };

    if (hasSecretAccess) {
      stats.secretMessage = Buffer.from(SECRET_MESSAGE, 'base64').toString('utf-8');
    }

    res.set({
      'X-Puzzle-Complete': 'true',
      'X-Next-Challenge': 'Find all the bugs in the authentication system',
      'Cache-Control': 'no-cache'
    });

    res.json(stats);
  } catch (error) {
    console.error('Error in GET /secret-stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
