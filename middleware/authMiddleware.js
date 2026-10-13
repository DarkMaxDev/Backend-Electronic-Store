import jwt from 'jsonwebtoken';
import { User } from '../models.js';
export const h = fn => (req, res, next) => fn(req, res, next).catch(next);
export const err = (status, message) => Object.assign(new Error(message), { status });
export const sign = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
export const protect = h(async (req, res, next) => {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  if (!t) throw err(401, 'No autenticado');
  let d; try { d = jwt.verify(t, process.env.JWT_SECRET); } catch { throw err(401, 'Token inválido'); }
  const u = await User.findById(d.id);
  if (!u) throw err(401, 'Usuario no existe');
  if (u.blocked) throw err(403, 'Cuenta bloqueada');
  req.user = u; next();
});
