const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// Access Token Generation (short-lived, e.g., 15 minutes)
function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, userType: user.userType },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
}

// Refresh Token Generation (long-lived, e.g., 7 days)
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
}

// Save Refresh Token to User
async function saveRefreshToken(userId, refreshToken) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (!user.refreshTokens) {
    user.refreshTokens = [];
  }

  user.refreshTokens.push(refreshToken);
  await user.save();
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
