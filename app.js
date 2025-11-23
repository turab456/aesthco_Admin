require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/Auth/authRoutes');
const addressRoutes = require('./routes/User/addressRoutes');
const cartRoutes = require('./routes/User/cartRoutes');
const wishlistRoutes = require('./routes/User/wishlistRoutes');
const productRoutes = require('./routes/Products/productRoutes');
const masterRoutes = require('./routes/Products/masterRoutes');

const app = express();

const parseOrigins = () => {
  if (!process.env.CORS_ORIGINS) {
    return [];
  }
  return process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const allowedOrigins = parseOrigins();
const corsOptions = allowedOrigins.length === 0 || allowedOrigins.includes('*')
  ? { origin: true, credentials: true }
  : { origin: allowedOrigins, credentials: true };

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    service: 'aesthco-backend-api',
    status: 'ok',
    version: process.env.npm_package_version || 'dev'
  });
});


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', addressRoutes);
app.use('/api/v1/user', cartRoutes);
app.use('/api/v1/user', wishlistRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/masters', masterRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.path} not found`
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

module.exports = app;
