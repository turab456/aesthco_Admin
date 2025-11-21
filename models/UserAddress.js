const { DataTypes } = require('sequelize');

const BANGALORE_ALIASES = ['bengaluru', 'bangalore', 'blr'];
const DEFAULT_CITY = 'Bengaluru';
const DEFAULT_STATE = 'Karnataka';

module.exports = (sequelize) => {
  const UserAddress = sequelize.define(
    'UserAddress',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [2, 80],
            msg: 'Name must be between 2 and 80 characters'
          }
        }
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [7, 20],
            msg: 'Phone number must be between 7 and 20 characters'
          }
        }
      },
      addressLine1: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [5, 200],
            msg: 'Address line 1 must be between 5 and 200 characters'
          }
        }
      },
      addressLine2: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 200],
            msg: 'Address line 2 must be under 200 characters'
          }
        }
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: DEFAULT_CITY,
        validate: {
          isBengaluru(value) {
            const normalized = (value || '').trim().toLowerCase();
            if (!BANGALORE_ALIASES.includes(normalized)) {
              throw new Error('Currently we only support Bengaluru addresses.');
            }
          }
        }
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: DEFAULT_STATE,
        validate: {
          isKarnataka(value) {
            const normalized = (value || '').trim().toLowerCase();
            if (normalized !== 'karnataka') {
              throw new Error('Currently we only support Karnataka state.');
            }
          }
        }
      },
      postalCode: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [5, 10],
            msg: 'Postal code must be between 5 and 10 characters'
          }
        }
      },
      addressType: {
        type: DataTypes.ENUM('home', 'work', 'other'),
        allowNull: false,
        defaultValue: 'home'
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      tableName: 'UserAddresses',
      timestamps: true
    }
  );

  UserAddress.associate = (models) => {
    UserAddress.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });

    models.User.hasMany(UserAddress, {
      foreignKey: 'userId',
      as: 'addresses'
    });
  };

  UserAddress.BANGALORE_ALIASES = BANGALORE_ALIASES;
  UserAddress.DEFAULT_CITY = DEFAULT_CITY;
  UserAddress.DEFAULT_STATE = DEFAULT_STATE;

  return UserAddress;
};
