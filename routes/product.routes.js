import { Router } from 'express';
import { Product, Review } from '../models.js';
import { h, err, protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
const r = Router();

const recalc = async pid => {
  const [a] = await Review.aggregate([{ $match: { product: pid } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]);
  await Product.findByIdAndUpdate(pid, { ratingAvg: a ? +a.avg.toFixed(1) : 0, ratingCount: a ? a.n : 0 });
};

r.get('/', h(async (req, res) => {
  const { q, category, min, max, sort, onSale, page = 1, limit = 20 } = req.query;
  const f = {};
  if (q) f.$text = { $search: q };
  if (category) f.category = category;
  if (min || max) f.price = { ...(min && { $gte: +min }), ...(max && { $lte: +max }) };
  if (onSale) f.salePrice = { $gt: 0 };
  const sorts = { new: { createdAt: -1 }, 'price-asc': { price: 1 }, 'price-desc': { price: -1 }, top: { ratingAvg: -1 }, sold: { sold: -1 } };
  const items = await Product.find(f).sort(sorts[sort] || { createdAt: -1 }).skip((page - 1) * limit).limit(+limit);
  res.json({ items, total: await Product.countDocuments(f) });
}));
r.get('/categories', h(async (req, res) => res.json(await Product.distinct('category'))));
r.get('/reviews/all', protect, admin, h(async (req, res) => res.json(await Review.find().sort('-createdAt').limit(200).populate('product', 'title'))));
r.delete('/reviews/:rid', protect, admin, h(async (req, res) => {
  const rv = await Review.findByIdAndDelete(req.params.rid);
  if (rv) await recalc(rv.product);
  res.json({ ok: true });
}));
r.get('/:id', h(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw err(404, 'Producto no encontrado');
  res.json(p);
}));
r.post('/', protect, admin, h(async (req, res) => res.status(201).json(await Product.create(req.body))));
r.put('/:id', protect, admin, h(async (req, res) => {
  const { sold, likes, ratingAvg, ratingCount, ...data } = req.body;
  res.json(await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }));
}));
r.delete('/:id', protect, admin, h(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  await Review.deleteMany({ product: req.params.id });
  res.json({ ok: true });
}));
r.get('/:id/reviews', h(async (req, res) => res.json(await Review.find({ product: req.params.id }).sort('-createdAt'))));
r.post('/:id/reviews', protect, h(async (req, res) => {
  const rating = +req.body.rating;
  if (!(rating >= 1 && rating <= 5)) throw err(400, 'Puntuación 1-5');
  const rv = await Review.findOneAndUpdate({ product: req.params.id, user: req.user._id },
    { rating, comment: req.body.comment, userName: req.user.name }, { upsert: true, new: true });
  await recalc(rv.product);
  res.status(201).json(rv);
}));
export default r;
