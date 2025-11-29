
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
const orderRoutes = require('./routes/Orders/orderRoutes');
const couponRoutes = require('./routes/Coupons/couponRoutes');
const reviewRoutes = require('./routes/Products/reviewRoutes');
const dashboardRoutes = require('./routes/Dashboard/dashboardRoutes');

const app = express();

/**
 * IMPORTANT:
 * We're behind nginx (reverse proxy), which sets X-Forwarded-For.
 * express-rate-limit and other middleware rely on req.ip, so we must
 * tell Express to trust the proxy. Using `1` trusts exactly one hop
 * (the nginx in front of the app). If your infra changes, update this.
 */
app.set('trust proxy', 1);

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
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
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





// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const swaggerUi = require('swagger-ui-express');
// const swaggerSpec = require('./config/swagger');
// const authRoutes = require('./routes/Auth/authRoutes');
// const addressRoutes = require('./routes/User/addressRoutes');
// const cartRoutes = require('./routes/User/cartRoutes');
// const wishlistRoutes = require('./routes/User/wishlistRoutes');
// const productRoutes = require('./routes/Products/productRoutes');
// const masterRoutes = require('./routes/Products/masterRoutes');
// const orderRoutes = require('./routes/Orders/orderRoutes');
// const couponRoutes = require('./routes/Coupons/couponRoutes');
// const reviewRoutes = require('./routes/Products/reviewRoutes');

// const app = express();

// const parseOrigins = () => {
//   if (!process.env.CORS_ORIGINS) {
//     return [];
//   }
//   return process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
// };

// const allowedOrigins = parseOrigins();
// const corsOptions = allowedOrigins.length === 0 || allowedOrigins.includes('*')
//   ? { origin: true, credentials: true }
//   : { origin: allowedOrigins, credentials: true };

// app.use(cors(corsOptions));
// app.use(express.json());

// app.get('/', (_req, res) => {
//   res.json({
//     service: 'aesthco-backend-api',
//     status: 'ok',
//     version: process.env.npm_package_version || 'dev'
//   });
// });


// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/user', addressRoutes);
// app.use('/api/v1/user', cartRoutes);
// app.use('/api/v1/user', wishlistRoutes);
// app.use('/api/v1/products', productRoutes);
// app.use('/api/v1/masters', masterRoutes);
// app.use('/api/v1/orders', orderRoutes);
// app.use('/api/v1/coupons', couponRoutes);
// app.use('/api/v1/reviews', reviewRoutes);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route ${req.path} not found`
//   });
// });

// app.use((err, _req, res, _next) => {
//   console.error(err);
//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || 'Internal server error'
//   });
// });

// module.exports = app;

