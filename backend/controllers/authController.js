const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { DFA_STATES } = require('../dfa/states');
const { JWT_SECRET } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @desc Register a new user
// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    // Default role is student unless admin explicitly registers
    const userRole = role === 'admin' ? 'admin' : 'student';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
      currentGlobalDfaState: DFA_STATES.S1 // Immediately authenticated upon successful registration
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered and authenticated (DFA: S0 -> S1)',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        currentState: DFA_STATES.S1
      },
      dfa: {
        previousState: DFA_STATES.S0,
        currentState: DFA_STATES.S1,
        transition: 'S0 -> S1 (LOGIN / REGISTER)'
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Registration failed: ${err.message}`
    });
  }
};

// @desc Login user & establish DFA S1
// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Your account is currently blocked by an administrator (DFA State: S6 BLOCKED)',
        dfaState: DFA_STATES.S6
      });
    }

    // Successful transition S0 -> S1
    user.currentGlobalDfaState = DFA_STATES.S1;
    await user.save();

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Authentication successful (DFA: S0 -> S1)',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        currentState: DFA_STATES.S1
      },
      dfa: {
        previousState: DFA_STATES.S0,
        currentState: DFA_STATES.S1,
        transition: 'S0 -> S1 (LOGIN)'
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Login failed: ${err.message}`
    });
  }
};

// @desc Logout user & transition S1 -> S0
// @route POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      req.user.currentGlobalDfaState = DFA_STATES.S0;
      await req.user.save();
    }

    return res.json({
      success: true,
      message: 'Successfully logged out (DFA: S1 -> S0)',
      dfa: {
        previousState: DFA_STATES.S1,
        currentState: DFA_STATES.S0,
        transition: 'S1 -> S0 (LOGOUT)'
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Logout error: ${err.message}`
    });
  }
};

// @desc Get current authenticated user
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isBlocked: req.user.isBlocked,
      currentState: req.user.currentGlobalDfaState || DFA_STATES.S1
    }
  });
};
