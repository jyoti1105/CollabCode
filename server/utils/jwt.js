const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || JWT_SECRET;

exports.signToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });

exports.verifyToken = (token) =>
  jwt.verify(token, JWT_SECRET);

exports.signResetToken = ({ id, email }) =>
  jwt.sign({ id, email }, JWT_RESET_SECRET, { expiresIn: '1h' });

exports.verifyResetToken = (token) =>
  jwt.verify(token, JWT_RESET_SECRET);
