import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const { Schema, model } = mongoose;
const id = { type: Schema.Types.ObjectId };

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  blocked: { type: Boolean, default: false },
  wishlist: [{ ...id, ref: 'Product' }],
}, { timestamps: true });
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.matches = function (p) { return bcrypt.compare(p, this.password); };

const productSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: String,
  images: [String],
  price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, default: 0 },
  category: { type: String, default: 'Electrónica', index: true },
  brand: String,
  specs: { type: Map, of: String },           // atributos libres: válido para cualquier categoría
  stock: { type: Number, default: 0, min: 0 },
  sold: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
}, { timestamps: true });
productSchema.index({ title: 'text', brand: 'text', description: 'text' });

const orderSchema = new Schema({
  user: { ...id, ref: 'User', required: true },
  items: [{ product: { ...id, ref: 'Product' }, title: String, image: String, price: Number, qty: Number }],
  total: Number,
  address: String,
  status: { type: String, enum: ['pendiente', 'enviado', 'entregado', 'cancelado'], default: 'pendiente' },
}, { timestamps: true });

const reviewSchema = new Schema({
  product: { ...id, ref: 'Product', required: true },
  user: { ...id, ref: 'User', required: true },
  userName: String,
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 1000 },
}, { timestamps: true });

export const User = model('User', userSchema);
export const Product = model('Product', productSchema);
export const Order = model('Order', orderSchema);
export const Review = model('Review', reviewSchema);
