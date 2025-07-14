const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middleware/auth');
const User = require('../models/User');

router.get('/me', verifyAccessToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshTokens');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;