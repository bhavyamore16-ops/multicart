import jwt from 'jsonwebtoken';
import { getUserModel } from '../models/dataAccess.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'multicart_super_secret_jwt_key_2026_final_year_project_secure_token'
      );

      const UserModel = getUserModel();
      const user = await UserModel.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'The user belonging to this token no longer exists.'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated by the platform administrator.'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('[Auth Error]', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token. Please log in again.'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided in request headers.'
    });
  }
};

export const optionalProtect = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer')) return next();
  try {
    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'multicart_super_secret_jwt_key_2026_final_year_project_secure_token');
    const user = await getUserModel().findById(decoded.id);
    if (!user || !user.isActive) return next();
    req.user = user;
    next();
  } catch (error) {
    return next();
  }
};
