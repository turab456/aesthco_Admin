const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Seller = sequelize.define('Seller', {

        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false
        },

        phone: {
            type: DataTypes.STRING,
            allowNull: false
        },

        email: {
            type: DataTypes.STRING,
            allowNull: true
        },

        instagram: {
            type: DataTypes.STRING,
            allowNull: true
        },

        status: {
            type: DataTypes.ENUM('pending', 'approved', 'disabled'),
            defaultValue: 'pending'
        },

        // 🔥 FUTURE READY (keep optional)
        userId: {
            type: DataTypes.UUID,
            allowNull: true
        }

    }, {
        tableName: 'Sellers',
        schema: 'catalog',
        timestamps: true
    });

    Seller.associate = (models) => {

        // Seller → Products
        Seller.hasMany(models.Product, {
            foreignKey: 'sellerId',
            as: 'products'
        });

        // Seller → Orders
        Seller.hasMany(models.Order, {
            foreignKey: 'sellerId',
            as: 'orders'
        });

        // 🔥 Future (login)
        Seller.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });

    };

    return Seller;
};