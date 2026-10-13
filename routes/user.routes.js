import { Router } from 'express';
import { User, Product, Review } from '../models.js';
import { h, err, protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
const r = Router();

r.get('/wishlist', protect, h(async (req, res) => res.json(await Product.find({ _id: { $in: req.user.wishlist } }))));
r.post('/wishlist/:pid', protect, h(async (req, res) => {
  const has = req.user.wishlist.some(x => String(x) === req.params.pid);
  await User.findByIdAndUpdate(req.user._id, has ? { $pull: { wishlist: req.params.pid } } : { $addToSet: { wishlist: req.params.pid } });
  await Product.findByIdAndUpdate(req.params.pid, { $inc: { likes: has ? -1 : 1 } });
  res.json({ liked: !has });
}));
r.get('/', protect, admin, h(async (req, res) => res.json(await User.find().sort('-createdAt'))));
r.put('/:id', protect, admin, h(async (req, res) => {
  if (req.params.id === String(req.user._id)) throw err(400, 'No puedes modificarte a ti mismo');
  const { role, blocked } = req.body;
  res.json(await User.findByIdAndUpdate(req.params.id, { ...(role && { role }), ...(blocked !== undefined && { blocked }) }, { new: true }));
}));
r.delete('/:id', protect, admin, h(async (req, res) => {
  if (req.params.id === String(req.user._id)) throw err(400, 'No puedes eliminarte a ti mismo');
  await Review.deleteMany({ user: req.params.id });
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));
export default r;
