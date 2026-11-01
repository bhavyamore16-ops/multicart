import jwt from 'jsonwebtoken';

export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET || 'multicart_super_secret_jwt_key_2026_final_year_project_secure_token',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  );
};
