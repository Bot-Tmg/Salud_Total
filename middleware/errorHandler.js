const jwt = require('jsonwebtoken');
const { unauthorizedResponse, errorResponse } = require('../utils/responses');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_para_desarrollo';

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json(unauthorizedResponse('Token de acceso requerido'));
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json(forbiddenResponse('Token inválido o expirado'));
        }
        
        req.user = user;
        next();
    });
};

// Middleware para verificar roles de usuario
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json(unauthorizedResponse());
        }

        const userRole = req.user.role || 'user';
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json(forbiddenResponse('Permisos insuficientes'));
        }

        next();
    };
};

// Generar token JWT
const generateToken = (payload, expiresIn = '24h') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Middleware para verificar si el usuario es el propietario del recurso
const isResourceOwner = (resourceOwnerIdPath = 'user.id') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json(unauthorizedResponse());
        }

        // Obtener el ID del propietario del recurso desde los parámetros o body
        const resourceOwnerId = eval(`req.${resourceOwnerIdPath}`);
        
        if (req.user.id !== resourceOwnerId && req.user.role !== 'admin') {
            return res.status(403).json(forbiddenResponse('No tienes permisos sobre este recurso'));
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole,
    generateToken,
    isResourceOwner,
    JWT_SECRET
};