import { Router } from 'express';
import { Order, Product } from '../models.js';
import { h, err, protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
const r = Router();

r.post('/', protect, h(async (req, res) => {
  const { items, address } = req.body;
  if (!Array.isArray(items) || !items.length) throw err(400, 'Carrito vacío');
  const done = [], lines = []; let total = 0;
  try {
    for (const it of items) {
      const qty = Math.max(1, parseInt(it.qty));
      const p = await Product.findOneAndUpdate({ _id: it.product, stock: { $gte: qty } }, { $inc: { stock: -qty, sold: qty } }, { new: true });
      if (!p) throw err(409, `Stock insuficiente: ${it.title || it.product}`);
      done.push({ id: p._id, qty });
      const price = p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
      total += price * qty;
      lines.push({ product: p._id, title: p.title, image: p.images[0], price, qty });
    }
  } catch (e) {                                                   // revertir stock si algo falló
    await Promise.all(done.map(d => Product.findByIdAndUpdate(d.id, { $inc: { stock: d.qty, sold: -d.qty } })));
    throw e;
  }
  res.status(201).json(await Order.create({ user: req.user._id, items: lines, total, address }));
}));
r.get('/mine', protect, h(async (req, res) => res.json(await Order.find({ user: req.user._id }).sort('-createdAt'))));
r.get('/', protect, admin, h(async (req, res) => res.json(await Order.find().sort('-createdAt').limit(100).populate('user', 'name email'))));
r.put('/:id/status', protect, admin, h(async (req, res) => res.json(await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }))));
r.get('/stats/summary', protect, admin, h(async (req, res) => {
  const [t] = await Order.aggregate([{ $match: { status: { $ne: 'cancelado' } } }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]);
  res.json({
    revenue: t?.revenue || 0, orders: t?.orders || 0,
    top: await Product.find({ sold: { $gt: 0 } }).sort('-sold').limit(5).select('title sold'),
    lowStock: await Product.find({ stock: { $lte: 5 } }).sort('stock').limit(10).select('title stock'),
  });
}));
export default r;
