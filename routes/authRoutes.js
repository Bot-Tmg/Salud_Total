const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Rutas protegidas
router.get('/profile', authenticateToken, getProfile);

module.exports = router;