const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(express.json());

// ✅ SERVIR ARCHIVOS ESTÁTICOS desde la carpeta 'front'
app.use(express.static(path.join(__dirname, 'front')));

// ✅ RUTA PRINCIPAL - Sirve index.html desde la carpeta front
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'front', 'index.html'));
});

// ✅ RUTA PARA PROCESAR EL FORMULARIO
app.post('/api/formulario/solicitud', (req, res) => {
    try {
        const formData = req.body;
        
        console.log('📝 Datos recibidos del formulario:', formData);
        
        // Aquí va tu lógica para guardar en PostgreSQL
        // Por ahora simulamos éxito
        
        res.json({
            success: true,
            message: '✅ Afiliación registrada exitosamente en Salud Total EPS',
            data: formData,
            affiliateId: 'ST-' + Date.now(),
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ✅ HEALTH CHECK
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '🏥 Salud Total EPS - Sistema funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        status: 'operational',
        frontend: 'Carpeta front/'
    });
});

// ✅ MANEJO DE ERRORES PARA RUTAS NO ENCONTRADAS
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        availableRoutes: [
            'GET / - Formulario de afiliación',
            'POST /api/formulario/solicitud - Enviar formulario',
            'GET /api/health - Health check'
        ]
    });
});

app.listen(PORT, () => {
    console.log(`🎉 Servidor Salud Total EPS ejecutándose en puerto ${PORT}`);
    console.log(`📱 Formulario: http://localhost:${PORT}`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📁 Sirviendo desde: ${path.join(__dirname, 'front')}`);
});

// Manejo graceful de shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Recibido SIGTERM. Cerrando servidor gracefully...');
    process.exit(0);
});
