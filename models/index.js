const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// Import models
const User = require('./Auth/User')(sequelize);
const RefreshToken = require('./Auth/RefreshToken')(sequelize);
const EmailOTP = require('./Auth/EmailOtp')(sequelize);

// Initialize associations
const models = { User, RefreshToken, EmailOTP };

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
};
