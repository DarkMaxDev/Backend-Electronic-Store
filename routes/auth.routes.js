import { Router } from 'express';
import { User, Review } from '../models.js';
import { h, err, sign, protect } from '../middleware/authMiddleware.js';
const r = Router();
const pub = u => ({ _id: u._id, name: u.name, email: u.email, role: u.role, wishlist: u.wishlist });

r.post('/register', h(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 6) throw err(400, 'Datos inválidos (contraseña mínimo 6)');
  if (await User.findOne({ email })) throw err(409, 'El correo ya está registrado');
  const first = (await User.countDocuments()) === 0;           // el primer usuario es admin
  const u = await User.create({ name, email, password, role: first ? 'admin' : 'user' });
  res.status(201).json({ token: sign(u), user: pub(u) });
}));
r.post('/login', h(async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() }).select('+password');
  if (!u || !(await u.matches(req.body.password || ''))) throw err(401, 'Credenciales incorrectas');
  if (u.blocked) throw err(403, 'Cuenta bloqueada');
  res.json({ token: sign(u), user: pub(u) });
}));
r.get('/me', protect, (req, res) => res.json(pub(req.user)));
r.delete('/me', protect, h(async (req, res) => {
  await Review.deleteMany({ user: req.user._id });
  await req.user.deleteOne();
  res.json({ ok: true });
}));
export default r;
