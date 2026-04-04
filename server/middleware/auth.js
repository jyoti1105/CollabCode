const { verifyToken } = require('../utils/jwt');
const { findById } = require('../utils/userStore');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = {
      id: user._id?.toString() || user.id,
      username: user.username,
      email: user.email,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};