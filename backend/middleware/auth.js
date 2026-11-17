const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'online_exam_super_secret_jwt_key_2026';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized: No authentication token provided',
      code: 'AUTH_REQUIRED',
      dfaState: 'NOT_LOGGED_IN'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User belonging to this token no longer exists',
        code: 'USER_NOT_FOUND',
        dfaState: 'NOT_LOGGED_IN'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Your account is currently blocked by an administrator. Contact support.',
        code: 'USER_BLOCKED',
        dfaState: 'BLOCKED'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token',
      code: 'INVALID_TOKEN',
      dfaState: 'NOT_LOGGED_IN'
    });
  }
};

module.exports = { protect, JWT_SECRET };
