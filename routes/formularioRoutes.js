const express = require('express');
const router = express.Router();
const { crearSolicitud } = require('../controllers/formularioController');

// Ruta específica para el formulario web
router.post('/solicitud', crearSolicitud);

module.exports = router;