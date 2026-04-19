const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User   = require('../models/user.model');

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, COOKIE_OPTS);
    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  res.clearCookie('token', COOKIE_OPTS);
  res.json({ success: true, message: 'Logged out' });
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password required' });
    }
    const existing = await User.findByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      id: uuidv4(),
      name,
      email: email.toLowerCase().trim(),
      password_hash,
      role: role === 'admin' ? 'admin' : 'supervisor',
    });
    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await User.getAll();
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

async function toggleUser(req, res, next) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    await User.updateActive(id, is_active);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout, me, createUser, listUsers, toggleUser };