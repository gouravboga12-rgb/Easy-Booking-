import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.js';
import orderRoutes from './src/routes/orders.js';
import serviceRoutes from './src/routes/services.js';
import trackingRoutes from './src/routes/tracking.js';
import subscriptionRoutes from './src/routes/subscriptions.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/subscriptions', subscriptionRoutes);


// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Parrow Skills API Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
