require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/Auth/authRoutes');
const addressRoutes = require('./routes/User/addressRoutes');

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
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'aesthco-auth',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', addressRoutes);
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
