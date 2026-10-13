import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from './models.js';
await mongoose.connect(process.env.MONGO_URI);
await Product.deleteMany();
const img = t => `https://placehold.co/600x600/1E3A8A/FFFFFF?text=${encodeURIComponent(t)}`;
const d = [
  ['Smartphone Nova X', 'Móviles', 8999, 7499, 25, 'Nova', { Pantalla: '6.7" AMOLED', RAM: '8 GB' }],
  ['Laptop Pro 14', 'Computación', 24999, 0, 10, 'Zenith', { CPU: '12 núcleos', RAM: '16 GB' }],
  ['Audífonos Bluetooth ANC', 'Audio', 1899, 1399, 40, 'Sonic', { Batería: '30 h' }],
  ['Smart TV 55" 4K', 'TV', 12999, 10999, 6, 'Vista', { Resolución: '4K' }],
  ['Teclado Mecánico RGB', 'Accesorios', 1299, 0, 60, 'Keyra', { Switch: 'Red' }],
  ['Smartwatch Fit 3', 'Wearables', 2599, 1999, 3, 'Pulse', { Batería: '7 días' }],
  ['Consola Portátil Go', 'Gaming', 7999, 0, 15, 'Playa', { Pantalla: '7"' }],
  ['Bocina Portátil Max', 'Audio', 1499, 0, 33, 'Sonic', { Potencia: '40 W' }],
].map(([title, category, price, salePrice, stock, brand, specs]) => ({ title, category, price, salePrice, stock, brand, specs, images: [img(title)], description: `${title}: producto de demostración.` }));
await Product.insertMany(d);
console.log('Productos de ejemplo creados'); process.exit();
