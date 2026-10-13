import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import auth from './routes/auth.routes.js';
import product from './routes/product.routes.js';
import order from './routes/order.routes.js';
import user from './routes/user.routes.js';

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    // Si no hay origen (como Postman) o si coincide (eliminando la barra final si la hubiera)
    const allowedClient = (process.env.CLIENT_URL || '').replace(/\/$/, '');
    const incomingOrigin = (origin || '').replace(/\/$/, '');

    if (!origin || incomingOrigin === allowedClient || process.env.CLIENT_URL === 'true') {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/auth', auth);
app.use('/api/products', product);
app.use('/api/orders', order);
app.use('/api/users', user);
app.use((e, req, res, next) => res.status(e.status || 500).json({ message: e.message || 'Error del servidor' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('API lista en puerto', process.env.PORT || 5000)))
  .catch(e => { console.error('Error MongoDB:', e.message); process.exit(1); });
