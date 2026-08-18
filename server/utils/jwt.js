const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || JWT_SECRET;

exports.signToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });

exports.verifyToken = (token) =>
  jwt.verify(token, JWT_SECRET);

exports.signResetToken = ({ id, email }) =>
  jwt.sign({ id, email }, JWT_RESET_SECRET, { expiresIn: '1h' });

exports.verifyResetToken = (token) =>
  jwt.verify(token, JWT_RESET_SECRET);
