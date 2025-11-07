const { body, validationResult } = require('express-validator');
const { validationErrorResponse } = require('../utils/responses');

// Validaciones para crear afiliado
const validateAffiliate = [
  body('document_type')
    .isIn(['CC', 'TI', 'CE', 'PA', 'RC'])
    .withMessage('Tipo de documento no válido'),
  
  body('document_number')
    .isLength({ min: 3, max: 50 })
    .withMessage('El número de documento debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Solo se permiten números y letras, sin espacios'),
  
  body('expedition_date')
    .isDate()
    .withMessage('Fecha de expedición debe ser una fecha válida')
    .custom((value) => {
      const expeditionDate = new Date(value);
      const today = new Date();
      return expeditionDate <= today;
    })
    .withMessage('La fecha de expedición no puede ser en el futuro'),
  
  body('first_name')
    .isLength({ min: 2, max: 100 })
    .withMessage('El primer nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúñÑ\s]+$/)
    .withMessage('Solo se permiten letras y espacios'),
  
  body('last_name')
    .isLength({ min: 2, max: 100 })
    .withMessage('El apellido debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúñÑ\s]+$/)
    .withMessage('Solo se permiten letras y espacios'),
  
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('phone')
    .isLength({ min: 7, max: 20 })
    .withMessage('El teléfono debe tener entre 7 y 20 caracteres')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Formato de teléfono no válido'),
  
  body('birth_date')
    .isDate()
    .withMessage('Fecha de nacimiento debe ser válida')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18;
    })
    .withMessage('Debe ser mayor de 18 años'),
  
  body('gender')
    .isIn(['masculino', 'femenino', 'otro', 'prefiero_no_decir'])
    .withMessage('Género no válido'),
  
  body('address')
    .isLength({ min: 10, max: 255 })
    .withMessage('La dirección debe tener entre 10 y 255 caracteres'),
  
  body('city')
    .isLength({ min: 2, max: 100 })
    .withMessage('La ciudad debe tener entre 2 y 100 caracteres'),
  
  // Middleware para manejar resultados de validación
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }
    next();
  }
];

// Validaciones para búsqueda y paginación
const validateSearch = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número mayor a 0'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser entre 1 y 100'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }
    next();
  }
];

// Validaciones para registro de usuario
const validateRegister = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('El usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Solo se permiten letras, números y guiones bajos'),
  
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  
  body('role')
    .optional()
    .isIn(['admin', 'moderator', 'viewer'])
    .withMessage('Rol no válido'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }
    next();
  }
];

// Validaciones para login
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }
    next();
  }
];

module.exports = {
  validateAffiliate,
  validateSearch,
  validateRegister,
  validateLogin
};