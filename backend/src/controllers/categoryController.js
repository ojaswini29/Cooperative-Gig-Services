const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

async function listCategories(req, res, next) {
  try {
    const result = await db.query(
      `SELECT c.*, COUNT(s.id) AS skills_count
       FROM categories c
       LEFT JOIN skills s ON c.id = s.category_id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    return successResponse(res, 200, 'Categories retrieved', result.rows);
  } catch (err) {
    next(err);
  }
}

async function getCategoryById(req, res, next) {
  try {
    const { id } = req.params;
    const catResult = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (catResult.rows.length === 0) {
      return errorResponse(res, 404, 'Category not found');
    }

    const skillsResult = await db.query(
      'SELECT * FROM skills WHERE category_id = $1 ORDER BY name ASC',
      [id]
    );

    const category = catResult.rows[0];
    category.skills = skillsResult.rows;

    return successResponse(res, 200, 'Category details retrieved', category);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;
    const result = await db.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    return successResponse(res, 201, 'Category created successfully', result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return errorResponse(res, 400, 'Category name already exists');
    }
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await db.query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [name, description, id]
    );
    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Category not found');
    }
    return successResponse(res, 200, 'Category updated successfully', result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return errorResponse(res, 400, 'Category name already exists');
    }
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Category not found');
    }
    return successResponse(res, 200, 'Category deleted successfully');
  } catch (err) {
    next(err);
  }
}

async function listSkills(req, res, next) {
  try {
    const { category_id } = req.query;
    let query = `SELECT s.*, c.name AS category_name
                 FROM skills s
                 JOIN categories c ON s.category_id = c.id`;
    const params = [];

    if (category_id) {
      query += ' WHERE s.category_id = $1';
      params.push(category_id);
    }

    query += ' ORDER BY s.name ASC';

    const result = await db.query(query, params);
    return successResponse(res, 200, 'Skills retrieved', result.rows);
  } catch (err) {
    next(err);
  }
}

async function createSkill(req, res, next) {
  try {
    const { category_id, name, description, base_hourly_rate } = req.body;

    const catCheck = await db.query('SELECT id FROM categories WHERE id = $1', [category_id]);
    if (catCheck.rows.length === 0) {
      return errorResponse(res, 404, 'Category not found');
    }

    const result = await db.query(
      `INSERT INTO skills (category_id, name, description, base_hourly_rate)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [category_id, name, description || null, base_hourly_rate || 25.00]
    );

    return successResponse(res, 201, 'Skill created successfully', result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return errorResponse(res, 400, 'Skill with this name already exists in category');
    }
    next(err);
  }
}

async function updateSkill(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, base_hourly_rate } = req.body;

    const result = await db.query(
      `UPDATE skills
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           base_hourly_rate = COALESCE($3, base_hourly_rate),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [name, description, base_hourly_rate, id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Skill not found');
    }

    return successResponse(res, 200, 'Skill updated successfully', result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteSkill(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM skills WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Skill not found');
    }
    return successResponse(res, 200, 'Skill deleted successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  listSkills,
  createSkill,
  updateSkill,
  deleteSkill,
};
