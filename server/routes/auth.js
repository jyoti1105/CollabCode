const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { signToken, signResetToken, verifyResetToken } = require('../utils/jwt');
const { sendResetEmail, buildResetUrl } = require('../utils/email');
const { createUser, findByEmail, comparePassword, updatePassword, findById } = require('../utils/userStore');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many accounts created from this IP. Please try again later.' },
});

router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required' });
    }
    const user = await createUser({ username, email, password });
    const userId = user._id?.toString() || user.id;
    const token = signToken(userId);
    return res.status(201).json({ token, user: { id: userId, username: user.username, email: user.email } });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = await findByEmail(email);
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const userId = user._id?.toString() || user.id;
    const token = signToken(userId);
    return res.json({ token, user: { id: userId, username: user.username, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/forgot-password', loginLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await findByEmail(email);
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const userId = user._id?.toString() || user.id;
    const token = signResetToken({ id: userId, email: user.email });
    const resetUrl = buildResetUrl(token);
    await sendResetEmail(user.email, resetUrl);

    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Unable to process password reset request' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    let payload;
    try {
      payload = verifyResetToken(token);
    } catch (verifyError) {
      return res.status(400).json({ error: 'Reset token is invalid or has expired' });
    }

    const userId = payload.id;
    const user = await findById(userId);
    if (!user) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    await updatePassword({ userId, password });
    return res.json({ message: 'Password has been reset successfully. Please login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Unable to reset password' });
  }
});

module.exports = router;
