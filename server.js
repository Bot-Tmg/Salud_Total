const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

// Importar configuraciones de base de datos
const { testConnection } = require('./config/database');

// Importar rutas
const affiliateRoutes = require('./routes/affiliateRoutes');
const authRoutes = require('./routes/authRoutes');
const formularioRoutes = require('./routes/formularioRoutes'); // ✅ NUEVA RUTA

// Inicializar Express
const app = express();

// ======================
// CONFIGURACIÓN DE MIDDLEWARES
// ======================

// Seguridad
app.use(helmet());

// CORS - Actualizado para el frontend
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://127.0.0.1:5500', '*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compresión
app.use(compression());

// Logging
app.use(morgan('combined'));

// Parsing de JSON
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({
        success: false,
        error: 'JSON malformado'
      });
      throw new Error('JSON inválido');
    }
  }
}));

// Parsing de URL encoded
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// ======================
// RUTAS DE LA API
// ======================

// Rutas públicas
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Bienvenido al Sistema de Afiliaciones',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile'
      },
      affiliates: {
        create: 'POST /api/affiliates',
        list: 'GET /api/affiliates',
        stats: 'GET /api/affiliates/stats',
        get_by_id: 'GET /api/affiliates/:id'
      },
      formulario: { // ✅ NUEVO ENDPOINT
        solicitud: 'POST /api/formulario/solicitud'
      }
    },
    documentation: 'Consulte la documentación para más detalles'
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    
    res.status(200).json({
      success: true,
      status: 'OK',
      message: 'Servidor funcionando correctamente',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus ? 'CONNECTED' : 'DISCONNECTED',
      uptime: `${process.uptime().toFixed(2)}s`
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'ERROR',
      message: 'Problemas de conectividad',
      database: 'DISCONNECTED',
      error: error.message
    });
  }
});

// Rutas de la API
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/formulario', formularioRoutes); // ✅ NUEVA RUTA

// ======================
// MANEJO DE ERRORES
// ======================

// Ruta no encontrada (404)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    suggestion: 'Verifique la URL y el método HTTP'
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('💥 Error global:', error);

  // Errores de validación
  if (error.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      error: 'Error de validación',
      details: error.errors
    });
  }

  // Errores de base de datos
  if (error.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      error: 'Error de base de datos',
      message: 'Problema con la operación en la base de datos'
    });
  }

  // Error de CORS
  if (error.name === 'CorsError') {
    return res.status(403).json({
      success: false,
      error: 'Acceso CORS no permitido'
    });
  }

  // Error general
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Contacte al administrador del sistema',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// ======================
// INICIALIZACIÓN DEL SERVIDOR
// ======================

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos. Saliendo...');
      process.exit(1);
    }

    // Sincronizar modelos (opcional, según necesidad)
    console.log('🔄 Sincronizando tabla formulario_afiliaciones...');
    const FormularioAfiliacion = require('./models/FormularioAfiliacion');
    await FormularioAfiliacion.sync({ force: false });
    console.log('✅ Tabla formulario_afiliaciones sincronizada');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 SISTEMA DE AFILIACIONES - BACKEND');
      console.log('='.repeat(60));
      console.log(`📍 Servidor corriendo en: http://localhost:${PORT}`);
      console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Base de datos: ${dbConnected ? 'CONECTADA' : 'DESCONECTADA'}`);
      console.log(`⏰ Iniciado: ${new Date().toLocaleString()}`);
      console.log('='.repeat(60));
      console.log('\n📋 Endpoints disponibles:');
      console.log(`   🔍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`   🔐 Auth: http://localhost:${PORT}/api/auth`);
      console.log(`   👥 Afiliados: http://localhost:${PORT}/api/affiliates`);
      console.log(`   📝 Formulario: http://localhost:${PORT}/api/formulario`); // ✅ NUEVO ENDPOINT
      console.log('='.repeat(60));
      console.log('\n🎯 Formulario Frontend listo para conectar con:');
      console.log(`   📧 POST http://localhost:${PORT}/api/formulario/solicitud`);
      console.log('='.repeat(60) + '\n');
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo graceful de cierre
process.on('SIGTERM', () => {
  console.log('🛑 Recibido SIGTERM. Cerrando servidor gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recibido SIGINT. Cerrando servidor gracefully...');
  process.exit(0);
});

// Iniciar la aplicación
startServer();

module.exports = app;