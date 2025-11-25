const { Op } = require('sequelize');
const { Color, Size, Category, Collection } = require('../../models');

const HOME_COLLECTION_LIMIT = 2;

const ensureHomeLimit = async (requestedShowOnHome, excludeId) => {
  if (!requestedShowOnHome) return;
  const where = { showOnHome: true };
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }
  const count = await Collection.count({ where });
  if (count >= HOME_COLLECTION_LIMIT) {
    const error = new Error(`Only ${HOME_COLLECTION_LIMIT} collections can be shown on home.`);
    error.status = 400;
    throw error;
  }
};

const ensureHomeOrderUnique = async (requestedShowOnHome, homeOrder, excludeId) => {
  if (!requestedShowOnHome) return;
  if (homeOrder === null || homeOrder === undefined) return;
  const where = {
    showOnHome: true,
    homeOrder,
  };
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }
  const conflict = await Collection.findOne({ where });
  if (conflict) {
    const error = new Error(`Home order ${homeOrder} is already used by another featured collection.`);
    error.status = 400;
    throw error;
  }
};

const assertAdmin = (req, res) => {
  if (req.user?.role !== 'super-admin') {
    res.status(403).json({ success: false, message: 'Only super-admin can manage masters.' });
    return false;
  }
  return true;
};

class MasterController {
  // Categories
  static async listCategories(_req, res) {
    try {
      const categories = await Category.findAll({ order: [['name', 'ASC']] });
      return res.json({ success: true, data: categories });
    } catch (error) {
      console.error('List categories error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
    }
  }

  static async createCategory(req, res) {
    if (!assertAdmin(req, res)) return;
    try {
      const cat = await Category.create(req.body);
      return res.status(201).json({ success: true, message: 'Category created.', data: cat });
    } catch (error) {
      console.error('Create category error:', error);
      return res.status(400).json({ success: false, message: error.message || 'Failed to create category.' });
    }
  }

  static async updateCategory(req, res) {
    if (!assertAdmin(req, res)) return;
    try {
      const { id } = req.params;
      const cat = await Category.findByPk(id);
      if (!cat) {
        return res.status(404).json({ success: false, message: 'Category not found.' });
      }
      await cat.update(req.body);
      return res.json({ success: true, message: 'Category updated.', data: cat });
    } catch (error) {
      console.error('Update category error:', error);
      return res.status(400).json({ success: false, message: error.message || 'Failed to update category.' });
    }
  }

  static async deleteCategory(req, res) {
    if (!assertAdmin(req, res)) return;
    try {
      const { id } = req.params;
      const cat = await Category.findByPk(id);
      if (!cat) {
        return res.status(404).json({ success: false, message: 'Category not found.' });
      }
      await cat.destroy();
      return res.json({ success: true, message: 'Category deleted.' });
    } catch (error) {
      console.error('Delete category error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete category.' });
    }
  }

  // Collections
  static async listCollections(req, res) {
    try {
      const showOnHome = req.query.showOnHome === 'true' || req.query.showOnHome === '1';
      const limit = req.query.limit ? Number(req.query.limit) : undefined;

      const order = [
        [Collection.sequelize.literal('COALESCE("Collection"."homeOrder", 9999)'), 'ASC'],
        ['name', 'ASC'],
      ];

      const where = showOnHome ? { showOnHome: true } : undefined;

      const collections = await Collection.findAll({
        where,
        order,
        ...(showOnHome && limit ? { limit } : { limit }),
      });

      return res.json({ success: true, data: collections });
    } catch (error) {
      console.error('List collections error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch collections.' });
    }
  }

  static async createCollection(req, res) {
    if (!assertAdmin(req, res)) return;
    try {
      await ensureHomeLimit(req.body?.showOnHome, null);
      await ensureHomeOrderUnique(req.body?.showOnHome, req.body?.homeOrder, null);
      const col = await Collection.create(req.body);
      return res.status(201).json({ success: true, message: 'Collection created.', data: col });
    } catch (error) {
      console.error('Create collection error:', error);
      const status = error.status || 400;
      return res.status(status).json({ success: false, message: error.message || 'Failed to create collection.' });
    }
  }

  static async updateCollection(req, res) {
    if (!assertAdmin(req, res)) return;
    try {
      const { id } = req.params;
      const col = await Collection.findByPk(id);
      if (!col) {
        return res.status(404).json({ success: false, message: 'Collection not found.' });
      }
      const nextShowOnHome = typeof req.body?.showOnHome === 'boolean' ? req.body.showOnHome : col.showOnHome;
      const nextHomeOrder = req.body?.homeOrder !== undefined ? req.body.homeOrder : col.homeOrder;
      await ensureHomeLimit(nextShowOnHome, col.id);
      await ensureHomeOrderUnique(nextShowOnHome, nextHomeOrder, col.id);
      await col.update(req.body);
      return res.json({ success: true, message: 'Collection updated.', data: col });
    } catch (error) {
      console.error('Update collection error:', error);
      const status = error.status || 400;
      return res.status(status).json({ success: false, message: error.message || 'Failed to update collection.' });
    }
  }

  static async deleteCollection(req, res) {
    if (!assertAdmin(req, res)) return;
    try {
      const { id } = req.params;
      const col = await Collection.findByPk(id);
      if (!col) {
        return res.status(404).json({ success: false, message: 'Collection not found.' });
      }
      await col.destroy();
      return res.json({ success: true, message: 'Collection deleted.' });
    } catch (error) {
      console.error('Delete collection error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete collection.' });
    }
  }

  // Colors
  static async listColors(_req, res) {
    try {
      const colors = await Color.findAll({ order: [['name', 'ASC']] });
      return res.json({ success: true, data: colors });
    } catch (error) {
      console.error('List colors error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch colors.' });
    }
  }

  static async createColor(req, res) {
    if (!assertAdmin(req, res)) return;
    try {
      const color = await Color.create(req.body);
      return res.status(201).json({ success: true, message: 'Color created.', data: color });
    } catch (error) {
      console.error('Create color error:', error);
      return res.status(400).json({ success: false, message: error.message || 'Failed to create color.' });
    }
  }

  static async updateColor(req, res) {
    if (!assertAdmin(req, res)) return;
    try {
      const { id } = req.params;
      const color = await Color.findByPk(id);
      if (!color) {
        return res.status(404).json({ success: false, message: 'Color not found.' });
      }
      await color.update(req.body);
      return res.json({ success: true, message: 'Color updated.', data: color });
    } catch (error) {
      console.error('Update color error:', error);
      return res.status(400).json({ success: false, message: error.message || 'Failed to update color.' });
    }
  }

  static async deleteColor(req, res) {
    if (!assertAdmin(req, res)) return;
    try {
      const { id } = req.params;
      const color = await Color.findByPk(id);
      if (!color) {
        return res.status(404).json({ success: false, message: 'Color not found.' });
      }
      await color.destroy();
      return res.json({ success: true, message: 'Color deleted.' });
    } catch (error) {
      console.error('Delete color error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete color.' });
    }
  }

  // Sizes
  static async listSizes(_req, res) {
    try {
      const sizes = await Size.findAll({
        order: [
          ['sortOrder', 'ASC'],
          ['label', 'ASC'],
        ],
        attributes: { include: ['label', 'sortOrder'] },
      });
      return res.json({ success: true, data: sizes });
    } catch (error) {
      console.error('List sizes error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch sizes.' });
    }
  }

  static async createSize(req, res) {
    if (!assertAdmin(req, res)) return;
    try {
      if (req.body.sortOrder != null) {
        const existing = await Size.findOne({ where: { sortOrder: req.body.sortOrder } });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Sort order must be unique across sizes.' });
        }
      }
      const size = await Size.create(req.body);
      return res.status(201).json({ success: true, message: 'Size created.', data: size });
    } catch (error) {
      console.error('Create size error:', error);
      return res.status(400).json({ success: false, message: error.message || 'Failed to create size.' });
    }
  }

  static async updateSize(req, res) {
    if (!assertAdmin(req, res)) return;
    try {
      const { id } = req.params;
      const size = await Size.findByPk(id);
      if (!size) {
        return res.status(404).json({ success: false, message: 'Size not found.' });
      }
      if (req.body.sortOrder != null) {
        const existing = await Size.findOne({ where: { sortOrder: req.body.sortOrder } });
        if (existing && existing.id !== Number(id)) {
          return res.status(400).json({ success: false, message: 'Sort order must be unique across sizes.' });
        }
      }
      await size.update(req.body);
      return res.json({ success: true, message: 'Size updated.', data: size });
    } catch (error) {
      console.error('Update size error:', error);
      return res.status(400).json({ success: false, message: error.message || 'Failed to update size.' });
    }
  }

  static async deleteSize(req, res) {
    if (!assertAdmin(req, res)) return;
    try {
      const { id } = req.params;
      const size = await Size.findByPk(id);
      if (!size) {
        return res.status(404).json({ success: false, message: 'Size not found.' });
      }
      await size.destroy();
      return res.json({ success: true, message: 'Size deleted.' });
    } catch (error) {
      console.error('Delete size error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete size.' });
    }
  }
}

module.exports = MasterController;
