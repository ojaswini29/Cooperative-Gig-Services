const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateBody } = require('../middleware/validate');
const { authenticateJWT } = require('../middleware/auth');
const { authSchemas } = require('../validators/schemas');

router.post('/register', validateBody(authSchemas.register), authController.register);
router.post('/login', validateBody(authSchemas.login), authController.login);
router.get('/me', authenticateJWT, authController.getMe);
router.put('/profile', authenticateJWT, validateBody(authSchemas.updateProfile), authController.updateProfile);

module.exports = router;
