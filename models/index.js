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
const UserAddress = require('./UserAddress')(sequelize);
const Category = require('./Products/Category')(sequelize);
const Collection = require('./Products/Collection')(sequelize);
const Product = require('./Products/Product')(sequelize);
const Color = require('./Products/Color')(sequelize);
const Size = require('./Products/Size')(sequelize);
const ProductVariant = require('./Products/ProductVariant')(sequelize);
const ProductImage = require('./Products/ProductImage')(sequelize);
const Cart = require('./Customer/Cart')(sequelize);
const Wishlist = require('./Customer/Wishlist')(sequelize);
const Order = require('./Orders/Order')(sequelize);
const OrderItem = require('./Orders/OrderItem')(sequelize);
const ShippingSetting = require('./Orders/ShippingSetting')(sequelize);
const Coupon = require('./Coupons/Coupon')(sequelize);
const CouponRedemption = require('./Coupons/CouponRedemption')(sequelize);

// Initialize associations
const models = {
  User,
  RefreshToken,
  EmailOTP,
  UserAddress,
  Category,
  Collection,
  Product,
  Color,
  Size,
  ProductVariant,
  ProductImage,
  Cart,
  Wishlist,
  Order,
  OrderItem,
  ShippingSetting,
  Coupon,
  CouponRedemption
};

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
};
