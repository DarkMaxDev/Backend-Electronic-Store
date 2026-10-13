import { err } from './authMiddleware.js';
export const admin = (req, res, next) => req.user?.role === 'admin' ? next() : next(err(403, 'Solo administradores'));
