const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { validateBody } = require('../middleware/validate');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { categorySchemas } = require('../validators/schemas');

// Public or Authenticated Category Routes
router.get('/categories', categoryController.listCategories);
router.get('/categories/:id', categoryController.getCategoryById);

// Admin Category Management
router.post('/categories', authenticateJWT, authorizeRoles('cooperative_admin'), validateBody(categorySchemas.createCategory), categoryController.createCategory);
router.put('/categories/:id', authenticateJWT, authorizeRoles('cooperative_admin'), validateBody(categorySchemas.updateCategory), categoryController.updateCategory);
router.delete('/categories/:id', authenticateJWT, authorizeRoles('cooperative_admin'), categoryController.deleteCategory);

// Public or Authenticated Skill Routes
router.get('/skills', categoryController.listSkills);

// Admin Skill Management
router.post('/skills', authenticateJWT, authorizeRoles('cooperative_admin'), validateBody(categorySchemas.createSkill), categoryController.createSkill);
router.put('/skills/:id', authenticateJWT, authorizeRoles('cooperative_admin'), validateBody(categorySchemas.updateSkill), categoryController.updateSkill);
router.delete('/skills/:id', authenticateJWT, authorizeRoles('cooperative_admin'), categoryController.deleteSkill);

module.exports = router;
