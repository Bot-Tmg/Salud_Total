const { User } = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responses');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(
        res,
        'Error de validación',
        422,
        errors.array()
      );
    }

    const { username, email, password, role = 'viewer' } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      where: { 
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      return errorResponse(
        res,
        'Ya existe un usuario con ese email o nombre de usuario',
        409
      );
    }

    // Crear usuario
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      role
    });

    // Generar token
    const token = user.generateAuthToken();

    return successResponse(
      res,
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          is_active: user.is_active
        },
        token
      },
      'Usuario registrado exitosamente',
      201
    );

  } catch (error) {
    console.error('Error en registro:', error);
    return errorResponse(res, 'Error interno del servidor', 500);
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(
        res,
        'Error de validación',
        422,
        errors.array()
      );
    }

    const { email, password } = req.body;

    // Buscar usuario
    const user = await User.findOne({
      where: { 
        email: email.toLowerCase(),
        is_active: true
      }
    });

    if (!user) {
      return errorResponse(res, 'Credenciales inválidas', 401);
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponse(res, 'Credenciales inválidas', 401);
    }

    // Actualizar último login
    await user.update({ last_login: new Date() });

    // Generar token
    const token = user.generateAuthToken();

    return successResponse(
      res,
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          last_login: user.last_login
        },
        token
      },
      'Login exitoso'
    );

  } catch (error) {
    console.error('Error en login:', error);
    return errorResponse(res, 'Error interno del servidor', 500);
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    return successResponse(
      res,
      { user },
      'Perfil obtenido exitosamente'
    );

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return errorResponse(res, 'Error interno del servidor', 500);
  }
};

module.exports = {
  register,
  login,
  getProfile
};