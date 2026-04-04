const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const User = require('../models/User');
const { isMongoAvailable } = require('./db');

const dataFile = path.join(__dirname, '../data/users.json');

function ensureDataFile() {
  const dataDir = path.dirname(dataFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, '[]', 'utf8');
  }
}

function readUsers() {
  ensureDataFile();
  const raw = fs.readFileSync(dataFile, 'utf8');
  return JSON.parse(raw || '[]');
}

function saveUsers(users) {
  ensureDataFile();
  fs.writeFileSync(dataFile, JSON.stringify(users, null, 2), 'utf8');
}

function scanUserRecord(user) {
  if (!user) return null;
  return {
    id: user._id?.toString() || user.id,
    username: user.username,
    email: user.email,
    password: user.password,
  };
}

function validateUserInput({ username, email, password }) {
  if (!username || !email || !password) {
    throw new Error('username, email, and password are required');
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Invalid email address');
  }
  if (typeof password !== 'string' || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  if (typeof username !== 'string' || username.trim().length < 2) {
    throw new Error('Username must be at least 2 characters');
  }
  return { normalizedEmail, username: username.trim() };
}

async function createUser({ username, email, password }) {
  const { normalizedEmail, username: cleanUsername } = validateUserInput({ username, email, password });

  if (isMongoAvailable()) {
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      throw new Error('Email already registered');
    }
    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      throw new Error('Username already taken');
    }
    return User.create({ username: cleanUsername, email: normalizedEmail, password });
  }

  const users = readUsers();
  if (users.some((item) => item.email === normalizedEmail)) {
    throw new Error('Email already registered');
  }
  if (users.some((item) => item.username === cleanUsername)) {
    throw new Error('Username already taken');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = {
    id: randomUUID(),
    username: cleanUsername,
    email: normalizedEmail,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  return user;
}

async function findByEmail(email) {
  const emailNormalized = email?.trim().toLowerCase();
  if (!emailNormalized) return null;

  if (isMongoAvailable()) {
    return User.findOne({ email: emailNormalized });
  }

  const users = readUsers();
  return scanUserRecord(users.find((item) => item.email === emailNormalized));
}

async function findById(id) {
  if (!id) return null;

  if (isMongoAvailable()) {
    const user = await User.findById(id).select('-password');
    return scanUserRecord(user);
  }

  const users = readUsers();
  return scanUserRecord(users.find((item) => item.id === id));
}

async function comparePassword(candidate, hashedPassword) {
  return bcrypt.compare(candidate, hashedPassword);
}

async function updatePassword({ userId, email, password }) {
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  if (isMongoAvailable()) {
    const query = userId ? { _id: userId } : { email: email?.trim().toLowerCase() };
    const user = await User.findOne(query);
    if (!user) {
      throw new Error('User not found');
    }
    user.password = password;
    await user.save();
    return scanUserRecord(user);
  }

  const users = readUsers();
  const normalizedEmail = email?.trim().toLowerCase();
  const index = users.findIndex((item) => {
    if (userId && item.id === userId) return true;
    if (normalizedEmail && item.email === normalizedEmail) return true;
    return false;
  });
  if (index === -1) {
    throw new Error('User not found');
  }
  users[index].password = await bcrypt.hash(password, 12);
  saveUsers(users);
  return scanUserRecord(users[index]);
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  comparePassword,
  updatePassword,
};
