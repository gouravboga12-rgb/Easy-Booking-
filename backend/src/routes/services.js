import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Ensure services.image column is LONGTEXT to support large base64 uploads without truncation
const ensureImageLongText = async () => {
  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM services');
    const imageCol = cols.find(c => c.Field === 'image');
    if (imageCol && imageCol.Type.toLowerCase() !== 'longtext') {
      await pool.query('ALTER TABLE services MODIFY COLUMN image LONGTEXT');
      console.log("Column 'image' in services altered to LONGTEXT.");
    }
  } catch (err) {
    console.warn("Altering services image column failed/skipped:", err.message);
  }
};
ensureImageLongText().catch(err => console.error('ensureImageLongText error:', err));

// Ensure services.available column exists
const ensureAvailableColumn = async () => {
  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM services');
    const hasAvail = cols.some(c => c.Field === 'available');
    if (!hasAvail) {
      await pool.query('ALTER TABLE services ADD COLUMN available TINYINT(1) DEFAULT 1');
      console.log("Column 'available' added to services table.");
    }
  } catch (err) {
    console.warn("Adding services available column failed/skipped:", err.message);
  }
};
ensureAvailableColumn().catch(err => console.error('ensureAvailableColumn error:', err));

// GET /api/services — Public: fetch all services
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM services ORDER BY category, sort_order ASC');
    rows.forEach(r => {
      if (typeof r.custom_fields === 'string') {
        try {
          r.custom_fields = JSON.parse(r.custom_fields);
        } catch (e) {
          r.custom_fields = [];
        }
      }
      r.custom_fields = r.custom_fields || [];

      if (typeof r.pricing_rules === 'string') {
        try {
          r.pricing_rules = JSON.parse(r.pricing_rules);
        } catch (e) {
          r.pricing_rules = null;
        }
      }
      r.pricing_type = r.pricing_type || 'direct';
      r.pricing_rules = r.pricing_rules || null;
    });
    res.json(rows);
  } catch (err) {
    console.error('Fetch services error:', err);
    res.status(500).json({ message: 'Server error fetching services' });
  }
});

// POST /api/services — Admin only: add a new service
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id, name, desc, category, categoryLabel, rate, unit, image, custom_fields, pricing_type, pricing_rules, available } = req.body;
  if (!id || !name || !category || !rate || !unit) {
    return res.status(400).json({ message: 'Missing required fields: id, name, category, rate, unit' });
  }

  try {
    const customFieldsJson = custom_fields ? JSON.stringify(custom_fields) : '[]';
    const pricingRulesJson = pricing_rules ? JSON.stringify(pricing_rules) : null;
    const finalPricingType = pricing_type || 'direct';
    const finalAvailable = available !== undefined ? (available ? 1 : 0) : 1;

    await pool.query(
      `INSERT INTO services (id, name, \`desc\`, category, category_label, rate, unit, image, custom_fields, pricing_type, pricing_rules, available, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 99)`,
      [id, name, desc || '', category, categoryLabel || category, Number(rate), unit, image || '', customFieldsJson, finalPricingType, pricingRulesJson, finalAvailable]
    );
    const [created] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    const service = created[0];
    if (typeof service.custom_fields === 'string') {
      try { service.custom_fields = JSON.parse(service.custom_fields); } catch (e) { service.custom_fields = []; }
    }
    if (typeof service.pricing_rules === 'string') {
      try { service.pricing_rules = JSON.parse(service.pricing_rules); } catch (e) { service.pricing_rules = null; }
    }
    res.status(201).json(service);
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ message: 'Server error creating service' });
  }
});

// PUT /api/services/:id — Admin only: update a service
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id } = req.params;
  const { name, desc, category, categoryLabel, rate, unit, image, custom_fields, pricing_type, pricing_rules, available } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const currentService = existing[0];

    const finalName = name !== undefined ? name : currentService.name;
    const finalDesc = desc !== undefined ? desc : currentService.desc;
    const finalCategory = category !== undefined ? category : currentService.category;
    const finalCategoryLabel = categoryLabel !== undefined ? categoryLabel : (currentService.category_label || finalCategory);
    const finalRate = rate !== undefined ? Number(rate) : Number(currentService.rate);
    const finalUnit = unit !== undefined ? unit : currentService.unit;
    const finalImage = image !== undefined ? image : currentService.image;
    const finalAvailable = available !== undefined ? (available ? 1 : 0) : (currentService.available !== 0 ? 1 : 0);

    let finalCustomFields = custom_fields !== undefined ? custom_fields : currentService.custom_fields;
    if (typeof finalCustomFields === 'string') {
      try {
        finalCustomFields = JSON.parse(finalCustomFields);
      } catch (e) {
        finalCustomFields = [];
      }
    }
    const customFieldsJson = JSON.stringify(finalCustomFields || []);

    const finalPricingType = pricing_type !== undefined ? pricing_type : currentService.pricing_type;
    let finalPricingRules = pricing_rules !== undefined ? pricing_rules : currentService.pricing_rules;
    if (typeof finalPricingRules === 'string') {
      try {
        finalPricingRules = JSON.parse(finalPricingRules);
      } catch (e) {
        finalPricingRules = null;
      }
    }
    const pricingRulesJson = finalPricingRules ? JSON.stringify(finalPricingRules) : null;

    await pool.query(
      `UPDATE services SET 
        name = ?, 
        \`desc\` = ?, 
        category = ?, 
        category_label = ?, 
        rate = ?, 
        unit = ?, 
        image = ?,
        custom_fields = ?,
        pricing_type = ?,
        pricing_rules = ?,
        available = ?
       WHERE id = ?`,
      [finalName, finalDesc, finalCategory, finalCategoryLabel, finalRate, finalUnit, finalImage, customFieldsJson, finalPricingType, pricingRulesJson, finalAvailable, id]
    );

    const [updated] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    const service = updated[0];
    if (typeof service.custom_fields === 'string') {
      try { service.custom_fields = JSON.parse(service.custom_fields); } catch (e) { service.custom_fields = []; }
    }
    if (typeof service.pricing_rules === 'string') {
      try { service.pricing_rules = JSON.parse(service.pricing_rules); } catch (e) { service.pricing_rules = null; }
    }
    res.json(service);
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ message: 'Server error updating service' });
  }
});

// DELETE /api/services/:id — Admin only: delete a service
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id } = req.params;
  try {
    const [existing] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    await pool.query('DELETE FROM services WHERE id = ?', [id]);
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ message: 'Server error deleting service' });
  }
});

export default router;
