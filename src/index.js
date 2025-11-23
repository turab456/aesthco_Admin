require('dotenv').config();
const app = require('../app');
const { sequelize } = require('../models');

const PORT = process.env.PORT || 4000;
const SHUTDOWN_DELAY_MS = 500;

async function startServer() {
  try {
    await sequelize.authenticate();
    // Ensure custom schemas for product masters and catalog
    await sequelize.createSchema('masters', { logging: false }).catch(() => {});
    await sequelize.createSchema('catalog', { logging: false }).catch(() => {});
    await sequelize.sync({ alter: true });

    const server = app.listen(PORT, () => {
      console.log(`Aesthco Auth API listening on http://localhost:${PORT}`);
    });

    const gracefulShutdown = () => {
      console.log('Shutting down server...');
      server.close(() => {
        sequelize.close().finally(() => process.exit(0));
      });

      setTimeout(() => process.exit(1), SHUTDOWN_DELAY_MS).unref();
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
