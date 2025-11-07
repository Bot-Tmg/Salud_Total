const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ SERVIR ARCHIVOS ESTÁTICOS desde la carpeta 'public'
app.use(express.static('public'));

// ✅ RUTA PRINCIPAL - muestra el formulario
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'formulario.html'));
});

// ✅ RUTA AL FORMULARIO
app.get('/formulario', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'formulario.html'));
});

// ✅ HEALTH CHECK (para verificar que funciona)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Sistema de Salud Total funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ✅ RUTA PARA PROCESAR EL FORMULARIO (POST)
app.post('/api/affiliates', (req, res) => {
    try {
        const formData = req.body;
        
        console.log('📝 Datos recibidos:', formData);
        
        // Aquí va tu lógica para guardar en PostgreSQL
        // Por ahora simulamos éxito
        
        res.json({
            success: true,
            message: '✅ Afiliación registrada exitosamente',
            data: formData,
            affiliateId: 'AF-' + Date.now()
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ✅ MANEJO DE ERRORES
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        availableRoutes: [
            'GET / - Formulario de afiliación',
            'GET /formulario - Formulario de afiliación', 
            'GET /api/health - Health check',
            'POST /api/affiliates - Enviar formulario'
        ]
    });
});

app.listen(PORT, () => {
    console.log(`🎉 Servidor ejecutándose en puerto ${PORT}`);
    console.log(`📱 Formulario: http://localhost:${PORT}`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
});
