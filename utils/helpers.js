// Utilidades generales para la plataforma
const { v4: uuidv4 } = require('uuid');

// Generar ID único
const generateId = () => {
    return uuidv4();
};

// Formatear fecha
const formatDate = (date = new Date()) => {
    return date.toISOString().split('T')[0];
};

// Validar email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validar contraseña (mínimo 8 caracteres, una mayúscula y un número)
const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
};

// Sanitizar entrada de texto
const sanitizeInput = (text) => {
    if (typeof text !== 'string') return text;
    return text.trim().replace(/[<>]/g, '');
};

// Generar código de verificación
const generateVerificationCode = (length = 6) => {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return code;
};

module.exports = {
    generateId,
    formatDate,
    isValidEmail,
    isValidPassword,
    sanitizeInput,
    generateVerificationCode
};