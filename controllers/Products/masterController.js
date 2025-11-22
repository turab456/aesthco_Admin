const { Color, Size, Category, Collection } = require('../../models');

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
  static async listCollections(_req, res) {
    try {
      const collections = await Collection.findAll({ order: [['name', 'ASC']] });
      return res.json({ success: true, data: collections });
    } catch (error) {
      console.error('List collections error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch collections.' });
    }
  }

  static async createCollection(req, res) {
    if (!assertAdmin(req, res)) return;
    try {
      const col = await Collection.create(req.body);
      return res.status(201).json({ success: true, message: 'Collection created.', data: col });
    } catch (error) {
      console.error('Create collection error:', error);
      return res.status(400).json({ success: false, message: error.message || 'Failed to create collection.' });
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
      await col.update(req.body);
      return res.json({ success: true, message: 'Collection updated.', data: col });
    } catch (error) {
      console.error('Update collection error:', error);
      return res.status(400).json({ success: false, message: error.message || 'Failed to update collection.' });
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
      const sizes = await Size.findAll({ order: [['sortOrder', 'ASC']], attributes: { include: ['label'] } });
      return res.json({ success: true, data: sizes });
    } catch (error) {
      console.error('List sizes error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch sizes.' });
    }
  }

  static async createSize(req, res) {
    if (!assertAdmin(req, res)) return;
    try {
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
