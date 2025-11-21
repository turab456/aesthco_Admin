const { Op } = require('sequelize');
const { UserAddress } = require('../../models');

const normalize = (value = '') => value.trim();
const normalizeCity = (value = '') => value.trim() || UserAddress.DEFAULT_CITY;
const normalizeState = (value = '') => value.trim() || UserAddress.DEFAULT_STATE;

const ensureBengaluru = (city, state) => {
  const cityNorm = normalizeCity(city).toLowerCase();
  const stateNorm = normalizeState(state).toLowerCase();

  if (!UserAddress.BANGALORE_ALIASES.includes(cityNorm)) {
    throw new Error('We currently deliver only within Bengaluru.');
  }

  if (stateNorm !== 'karnataka') {
    throw new Error('We currently deliver only within Karnataka.');
  }

  return {
    city: cityNorm === 'bangalore' ? 'Bengaluru' : normalizeCity(city),
    state: 'Karnataka'
  };
};

const sanitizePayload = (body, user) => {
  const { city, state } = ensureBengaluru(body.city, body.state);
  const allowedTypes = ['home', 'work', 'other'];
  const addressType = allowedTypes.includes(body.addressType)
    ? body.addressType
    : 'home';

  return {
    name: normalize(body.name) || user.fullName,
    phoneNumber: normalize(body.phoneNumber || '') || user.phoneNumber || null,
    addressLine1: normalize(body.addressLine1),
    addressLine2: normalize(body.addressLine2 || '') || null,
    city,
    state,
    postalCode: normalize(body.postalCode || '') || null,
    addressType,
    isDefault: Boolean(body.isDefault)
  };
};

class AddressController {
  static async list(req, res) {
    try {
      const addresses = await UserAddress.findAll({
        where: { userId: req.user.id },
        order: [
          ['isDefault', 'DESC'],
          ['createdAt', 'DESC']
        ]
      });

      return res.json({
        success: true,
        data: addresses
      });
    } catch (error) {
      console.error('List addresses error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch addresses.'
      });
    }
  }

  static async create(req, res) {
    try {
      if (!req.body.addressLine1) {
        return res.status(400).json({
          success: false,
          message: 'Address line 1 is required.'
        });
      }

      const payload = sanitizePayload(req.body, req.user);
      const existingDefault = await UserAddress.findOne({
        where: { userId: req.user.id, isDefault: true }
      });

      const address = await UserAddress.create({
        ...payload,
        userId: req.user.id,
        isDefault: payload.isDefault || !existingDefault
      });

      if (address.isDefault && existingDefault) {
        await UserAddress.update(
          { isDefault: false },
          { where: { userId: req.user.id, id: { [Op.ne]: address.id } } }
        );
      }

      return res.status(201).json({
        success: true,
        message: 'Address added successfully.',
        data: address
      });
    } catch (error) {
      console.error('Create address error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to add address.'
      });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const address = await UserAddress.findOne({
        where: { id, userId: req.user.id }
      });

      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found.'
        });
      }

      const payload = sanitizePayload(req.body, req.user);
      await address.update(payload);

      if (payload.isDefault) {
        await UserAddress.update(
          { isDefault: false },
          { where: { userId: req.user.id, id: { [Op.ne]: address.id } } }
        );
      }

      return res.json({
        success: true,
        message: 'Address updated successfully.',
        data: address
      });
    } catch (error) {
      console.error('Update address error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update address.'
      });
    }
  }

  static async setDefault(req, res) {
    try {
      const { id } = req.params;
      const address = await UserAddress.findOne({
        where: { id, userId: req.user.id }
      });

      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found.'
        });
      }

      await UserAddress.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
      await address.update({ isDefault: true });

      return res.json({
        success: true,
        message: 'Default address updated.',
        data: address
      });
    } catch (error) {
      console.error('Set default address error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to set default address.'
      });
    }
  }

  static async remove(req, res) {
    try {
      const { id } = req.params;
      const address = await UserAddress.findOne({
        where: { id, userId: req.user.id }
      });

      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found.'
        });
      }

      await address.destroy();

      return res.json({
        success: true,
        message: 'Address removed successfully.'
      });
    } catch (error) {
      console.error('Delete address error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove address.'
      });
    }
  }
}

module.exports = AddressController;
