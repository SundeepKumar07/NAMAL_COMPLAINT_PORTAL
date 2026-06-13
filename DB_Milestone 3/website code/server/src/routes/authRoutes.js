const express = require('express');
const { body } = require('express-validator');
const { login, me, loginValidation } = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', loginValidation, validate, login);
router.get('/me', authMiddleware, me);

module.exports = router;
