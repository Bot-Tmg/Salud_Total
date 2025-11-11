const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// ==============================================
// 🔐 CONFIGURACIÓN DE SEGURIDAD Y AUTENTICACIÓN
// ==============================================

// Middleware de sesión
app.use(session({
    secret: process.env.SESSION_SECRET || 'salud-total-indreima-session-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 2 * 60 * 60 * 1000 // 2 horas
    }
}));

// ==============================================
// 🗄️ CONFIGURACIÓN DE BASE DE DATOS
// ==============================================

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ FUNCIÓN PARA CREAR LA TABLA SI NO EXISTE
async function createTableIfNotExists() {
    try {
        console.log('🔍 Verificando si existe la tabla affiliates...');
        
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'affiliates'
            );
        `);
        
        if (!tableExists.rows[0].exists) {
            await pool.query(`
                CREATE TABLE affiliates (
                    id SERIAL PRIMARY KEY,
                    affiliate_id VARCHAR(50) UNIQUE NOT NULL,
                    nombre VARCHAR(100) NOT NULL,
                    apellido VARCHAR(100) NOT NULL,
                    edad INTEGER NOT NULL,
                    tipo_documento VARCHAR(10) NOT NULL,
                    numero_documento VARCHAR(20) UNIQUE NOT NULL,
                    fecha_nacimiento DATE NOT NULL,
                    lugar_nacimiento VARCHAR(200) NOT NULL,
                    correo VARCHAR(150) UNIQUE NOT NULL,
                    tratamiento_datos BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Tabla affiliates creada exitosamente');
        } else {
            console.log('✅ Tabla affiliates ya existe');
        }
        
    } catch (error) {
        console.error('❌ Error al verificar/crear la tabla:', error);
    }
}

// ==============================================
// 🛡️ MIDDLEWARE DE AUTENTICACIÓN
// ==============================================

function requireAuth(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    } else {
        return res.redirect('/admin/login');
    }
}

function redirectIfAuthenticated(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return res.redirect('/admin/afiliados');
    }
    next();
}

// ==============================================
// ⚙️ MIDDLEWARES
// ==============================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================================
// 🎨 FUNCIÓN PARA GENERAR HEADER CON LOGO
// ==============================================

function generateHeader(title) {
    return `
    <header class="main-header">
        <div class="header-container">
            <div class="logo-section">
                <div class="logo">Indreima</div>
                <div class="logo-subtitle">seguros</div>
            </div>
            <h1 class="page-title">${title}</h1>
        </div>
    </header>`;
}

// ==============================================
// 🚀 RUTAS DE LA APLICACIÓN
// ==============================================

// ✅ RUTA PRINCIPAL - FORMULARIO DE AFILIACIÓN SALUD TOTAL EPS
app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Salud Total EPS - Sistema de Afiliación</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary-blue: #0055A4;
                --primary-green: #00A859;
                --primary-gold: #d4af37;
                --primary-dark: #1a1a1a;
                --light-bg: #f0f7ff;
                --white: #ffffff;
                --gray-light: #f1f5f9;
                --gray: #64748b;
                --dark: #1e293b;
                --border-radius: 12px;
                --border-radius-lg: 20px;
                --shadow: 0 8px 30px rgba(0, 85, 164, 0.08);
                --shadow-lg: 0 20px 40px rgba(0, 85, 164, 0.12);
                --transition: all 0.3s ease;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Inter', sans-serif;
                background: linear-gradient(135deg, var(--light-bg) 0%, var(--white) 100%);
                min-height: 100vh;
                color: var(--dark);
                line-height: 1.6;
            }

            .main-header {
                background: var(--white);
                border-bottom: 3px solid var(--primary-gold);
                box-shadow: var(--shadow);
                position: sticky;
                top: 0;
                z-index: 1000;
            }

            .header-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 1rem 2rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .logo-section {
                display: flex;
                align-items: baseline;
                gap: 8px;
            }

            .logo {
                font-size: 2rem;
                font-weight: 800;
                color: var(--primary-dark);
                letter-spacing: -1px;
            }

            .logo-subtitle {
                font-size: 0.9rem;
                font-weight: 500;
                color: var(--primary-gold);
                text-transform: uppercase;
                letter-spacing: 2px;
            }

            .page-title {
                font-size: 1.5rem;
                font-weight: 600;
                color: var(--primary-blue);
            }

            .main-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem;
            }

            .hero-section {
                text-align: center;
                margin-bottom: 3rem;
                padding: 3rem 2rem;
                background: linear-gradient(135deg, var(--white) 0%, var(--light-bg) 100%);
                border-radius: var(--border-radius-lg);
                box-shadow: var(--shadow);
                border-left: 4px solid var(--primary-green);
            }

            .hero-title {
                font-size: 2.5rem;
                font-weight: 700;
                color: var(--primary-blue);
                margin-bottom: 1rem;
            }

            .hero-subtitle {
                font-size: 1.1rem;
                color: var(--gray);
                max-width: 600px;
                margin: 0 auto;
            }

            .eps-badge {
                display: inline-block;
                background: var(--primary-green);
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.9rem;
                font-weight: 600;
                margin-top: 1rem;
            }

            .form-container {
                background: var(--white);
                border-radius: var(--border-radius-lg);
                box-shadow: var(--shadow-lg);
                padding: 3rem;
                margin-bottom: 2rem;
                border-top: 4px solid var(--primary-blue);
            }

            .form-header {
                text-align: center;
                margin-bottom: 2rem;
            }

            .form-icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, var(--primary-blue), var(--primary-green));
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1rem;
                color: var(--white);
                font-size: 2rem;
            }

            .form-title {
                font-size: 1.8rem;
                font-weight: 700;
                color: var(--primary-blue);
                margin-bottom: 0.5rem;
            }

            .form-subtitle {
                color: var(--gray);
                font-size: 1rem;
            }

            .form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
                margin-bottom: 2rem;
            }

            .form-group {
                position: relative;
            }

            .form-group.full-width {
                grid-column: 1 / -1;
            }

            .form-label {
                display: block;
                margin-bottom: 0.5rem;
                color: var(--dark);
                font-weight: 600;
                font-size: 0.9rem;
            }

            .required::after {
                content: '*';
                color: #ef4444;
                margin-left: 4px;
            }

            .input-container {
                position: relative;
            }

            .input-icon {
                position: absolute;
                left: 1rem;
                top: 50%;
                transform: translateY(-50%);
                color: var(--gray);
                z-index: 2;
                transition: var(--transition);
            }

            .form-input {
                width: 100%;
                padding: 1rem 1rem 1rem 3rem;
                background: var(--gray-light);
                border: 2px solid #e2e8f0;
                border-radius: var(--border-radius);
                font-size: 1rem;
                transition: var(--transition);
                color: var(--dark);
                font-family: 'Inter', sans-serif;
            }

            .form-input:focus {
                outline: none;
                border-color: var(--primary-blue);
                background: var(--white);
                box-shadow: 0 0 0 3px rgba(0, 85, 164, 0.1);
            }

            .form-input:focus + .input-icon {
                color: var(--primary-blue);
            }

            .checkbox-group {
                background: var(--light-bg);
                padding: 1.5rem;
                border-radius: var(--border-radius);
                border: 2px solid #e2e8f0;
                margin: 2rem 0;
            }

            .checkbox-item {
                display: flex;
                align-items: flex-start;
                margin-bottom: 1rem;
                cursor: pointer;
            }

            .checkbox-input {
                margin-right: 0.75rem;
                margin-top: 0.2rem;
                accent-color: var(--primary-blue);
                transform: scale(1.2);
            }

            .checkbox-label {
                font-size: 0.85rem;
                line-height: 1.5;
                color: var(--dark);
            }

            .checkbox-label a {
                color: var(--primary-blue);
                text-decoration: none;
                font-weight: 600;
            }

            .checkbox-label a:hover {
                text-decoration: underline;
            }

            .required-checkbox {
                color: #ef4444;
                font-weight: bold;
            }

            .submit-btn {
                width: 100%;
                padding: 1.2rem;
                background: linear-gradient(135deg, var(--primary-blue), var(--primary-green));
                color: var(--white);
                border: none;
                border-radius: var(--border-radius);
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: var(--transition);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            }

            .submit-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(0, 85, 164, 0.3);
            }

            .submit-btn:disabled {
                background: var(--gray);
                cursor: not-allowed;
                transform: none !important;
            }

            .message-box {
                margin-top: 1rem;
                padding: 1rem;
                border-radius: var(--border-radius);
                text-align: center;
                display: none;
                font-weight: 600;
            }

            .success {
                background: #dcfce7;
                color: #166534;
                border: 1px solid #bbf7d0;
            }

            .error {
                background: #fee2e2;
                color: #991b1b;
                border: 1px solid #fecaca;
            }

            .loading {
                background: #dbeafe;
                color: #1e40af;
                border: 1px solid #bfdbfe;
            }

            .main-footer {
                background: var(--primary-blue);
                color: var(--white);
                text-align: center;
                padding: 2rem;
                margin-top: 3rem;
            }

            .footer-content {
                max-width: 1200px;
                margin: 0 auto;
            }

            .partner-info {
                background: rgba(255, 255, 255, 0.1);
                padding: 1rem;
                border-radius: var(--border-radius);
                margin: 1rem 0;
            }

            .admin-link {
                color: var(--primary-gold);
                text-decoration: none;
                font-weight: 600;
                margin-top: 1rem;
                display: inline-block;
            }

            .admin-link:hover {
                text-decoration: underline;
            }

            @media (max-width: 768px) {
                .header-container {
                    padding: 1rem;
                    flex-direction: column;
                    gap: 1rem;
                    text-align: center;
                }

                .form-grid {
                    grid-template-columns: 1fr;
                }

                .main-container {
                    padding: 1rem;
                }

                .form-container {
                    padding: 1.5rem;
                }

                .hero-title {
                    font-size: 2rem;
                }
            }
        </style>
    </head>
    <body>
        ${generateHeader('Sistema de Afiliación')}

        <div class="main-container">
            <div class="hero-section">
                <h1 class="hero-title">Salud Total EPS</h1>
                <p class="hero-subtitle">Más de 25 años cuidando la salud de los colombianos. Afíliate a la EPS con cobertura nacional y servicios de calidad.</p>
                <div class="eps-badge">
                    <i class="fas fa-shield-alt"></i>
                    EPS Oficial - Régimen Contributivo
                </div>
            </div>

            <div class="form-container">
                <div class="form-header">
                    <div class="form-icon">
                        <i class="fas fa-file-medical"></i>
                    </div>
                    <h2 class="form-title">Formulario de Afiliación</h2>
                    <p class="form-subtitle">Registro oficial en el Sistema General de Seguridad Social en Salud</p>
                </div>

                <form id="affiliate-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label required">Nombre</label>
                            <div class="input-container">
                                <i class="fas fa-user input-icon"></i>
                                <input type="text" class="form-input" id="nombre" name="nombre" placeholder="Nombres completos" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label required">Apellido</label>
                            <div class="input-container">
                                <i class="fas fa-user input-icon"></i>
                                <input type="text" class="form-input" id="apellido" name="apellido" placeholder="Apellidos completos" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label required">Edad</label>
                            <div class="input-container">
                                <i class="fas fa-birthday-cake input-icon"></i>
                                <input type="number" class="form-input" id="edad" name="edad" min="0" max="120" placeholder="Edad actual" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label required">Fecha Nacimiento</label>
                            <div class="input-container">
                                <i class="fas fa-calendar input-icon"></i>
                                <input type="date" class="form-input" id="fecha_nacimiento" name="fecha_nacimiento" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label required">Tipo Documento</label>
                            <div class="input-container">
                                <i class="fas fa-id-card input-icon"></i>
                                <select class="form-input" id="tipo_documento" name="tipo_documento" required>
                                    <option value="">Seleccione tipo...</option>
                                    <option value="CC">Cédula de Ciudadanía</option>
                                    <option value="CE">Cédula de Extranjería</option>
                                    <option value="TI">Tarjeta de Identidad</option>
                                    <option value="RC">Registro Civil</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label required">Número Documento</label>
                            <div class="input-container">
                                <i class="fas fa-hashtag input-icon"></i>
                                <input type="text" class="form-input" id="numero_documento" name="numero_documento" placeholder="Número de documento" required>
                            </div>
                        </div>

                        <div class="form-group full-width">
                            <label class="form-label required">Lugar de Nacimiento</label>
                            <div class="input-container">
                                <i class="fas fa-map-marker-alt input-icon"></i>
                                <input type="text" class="form-input" id="lugar_nacimiento" name="lugar_nacimiento" placeholder="Municipio, Departamento" required>
                            </div>
                        </div>

                        <div class="form-group full-width">
                            <label class="form-label required">Correo Electrónico</label>
                            <div class="input-container">
                                <i class="fas fa-envelope input-icon"></i>
                                <input type="email" class="form-input" id="correo" name="correo" placeholder="correo@ejemplo.com" required>
                            </div>
                        </div>
                    </div>

                    <div class="checkbox-group">
                        <div class="checkbox-item">
                            <input type="checkbox" class="checkbox-input" id="tratamiento_datos" name="tratamiento_datos" required>
                            <label for="tratamiento_datos" class="checkbox-label">
                                <span class="required-checkbox">*</span> 
                                <strong>AUTORIZO OBLIGATORIAMENTE</strong> el tratamiento de mis datos personales conforme a la 
                                <a href="#" id="openPrivacyPolicy">Política de Tratamiento de Datos</a> 
                                y la Ley 1581 de 2012. Entiendo que esta autorización es <strong>requisito indispensable</strong> 
                                para el proceso de afiliación al Sistema General de Seguridad Social en Salud.
                            </label>
                        </div>
                    </div>

                    <button type="submit" class="submit-btn" id="submitBtn">
                        <i class="fas fa-user-plus"></i>
                        SOLICITAR AFILIACIÓN
                    </button>
                </form>

                <div id="message-box" class="message-box"></div>
            </div>
        </div>

        <footer class="main-footer">
            <div class="footer-content">
                <p>&copy; 2024 Salud Total EPS. Todos los derechos reservados.</p>
                <div class="partner-info">
                    <p><strong>Aliado estratégico:</strong> Indreima Seguros</p>
                    <p>Protegiendo tu salud con el respaldo de Indreima Seguros</p>
                </div>
                <a href="/admin/login" class="admin-link">
                    <i class="fas fa-lock"></i>
                    Acceso Administrativo
                </a>
            </div>
        </footer>

        <script>
            const API_URL = '/api/formulario/solicitud';

            document.getElementById('openPrivacyPolicy')?.addEventListener('click', function(e) {
                e.preventDefault();
                alert('Política de Tratamiento de Datos: Sus datos serán utilizados exclusivamente para el proceso de afiliación al Sistema de Salud y protegidos conforme a la Ley 1581 de 2012.');
            });

            function validateForm(formData) {
                const errors = [];
                
                if (formData.edad < 0 || formData.edad > 120) {
                    errors.push('La edad debe estar entre 0 y 120 años');
                }
                
                const birthDate = new Date(formData.fecha_nacimiento);
                const today = new Date();
                if (birthDate >= today) {
                    errors.push('La fecha de nacimiento debe ser anterior a la fecha actual');
                }
                
                const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
                if (!emailRegex.test(formData.correo)) {
                    errors.push('El formato del correo electrónico no es válido');
                }
                
                if (!formData.tratamiento_datos) {
                    errors.push('Debe autorizar OBLIGATORIAMENTE el tratamiento de datos personales para continuar con la afiliación al Sistema de Salud');
                }
                
                return errors;
            }

            document.getElementById('affiliate-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const submitBtn = document.getElementById('submitBtn');
                const messageBox = document.getElementById('message-box');
                const originalText = submitBtn.innerHTML;
                
                const formData = {
                    nombre: document.getElementById('nombre').value.trim(),
                    apellido: document.getElementById('apellido').value.trim(),
                    edad: parseInt(document.getElementById('edad').value),
                    tipo_documento: document.getElementById('tipo_documento').value,
                    numero_documento: document.getElementById('numero_documento').value.trim(),
                    fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
                    lugar_nacimiento: document.getElementById('lugar_nacimiento').value.trim(),
                    correo: document.getElementById('correo').value.trim().toLowerCase(),
                    tratamiento_datos: document.getElementById('tratamiento_datos').checked
                };

                const validationErrors = validateForm(formData);
                if (validationErrors.length > 0) {
                    showMessage('❌ ' + validationErrors.join('<br>'), 'error');
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESANDO SOLICITUD...';
                showMessage('⏳ Enviando solicitud de afiliación...', 'loading');

                try {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(formData)
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.message || 'Error ' + response.status + ': ' + response.statusText);
                    }

                    if (result.success) {
                        showMessage('✅ ' + result.message + '<br>ID de afiliado: ' + result.affiliateId, 'success');
                        setTimeout(() => {
                            document.getElementById('affiliate-form').reset();
                            messageBox.style.display = 'none';
                        }, 8000);
                    } else {
                        throw new Error(result.message || 'Error al procesar la solicitud');
                    }

                } catch (error) {
                    let errorMessage = error.message;
                    if (error.message.includes('Failed to fetch')) {
                        errorMessage = 'Error de conexión con el servidor. Por favor, intenta nuevamente.';
                    } else if (error.message.includes('NetworkError')) {
                        errorMessage = 'Error de red. Verifica tu conexión a internet.';
                    }
                    showMessage('❌ ' + errorMessage, 'error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            });

            function showMessage(text, type) {
                const messageBox = document.getElementById('message-box');
                messageBox.innerHTML = text;
                messageBox.className = 'message-box ' + type;
                messageBox.style.display = 'block';
                if (type === 'success') {
                    setTimeout(() => {
                        messageBox.style.display = 'none';
                    }, 8000);
                }
            }

            document.getElementById('edad').addEventListener('input', function() {
                if (this.value < 0) this.value = 0;
                if (this.value > 120) this.value = 120;
            });

            document.getElementById('numero_documento').addEventListener('input', function(e) {
                this.value = this.value.replace(/[^0-9]/g, '');
            });

            document.getElementById('fecha_nacimiento').max = new Date().toISOString().split('T')[0];

            console.log('🏥 Salud Total EPS - Sistema de Afiliaciones');
            console.log('🛡️  Aliado estratégico: Indreima Seguros');
        </script>
    </body>
    </html>`;
    
    res.send(html);
});

// ✅ RUTA DE LOGIN
app.get('/admin/login', redirectIfAuthenticated, (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acceso Administrativo - Salud Total EPS</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Inter', sans-serif;
            }
            
            body {
                background: linear-gradient(135deg, #0055A4 0%, #003366 100%);
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                color: #fff;
            }

            .main-header {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-bottom: 3px solid #d4af37;
                width: 100%;
                position: fixed;
                top: 0;
                z-index: 1000;
            }

            .header-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 1rem 2rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .logo-section {
                display: flex;
                align-items: baseline;
                gap: 8px;
            }

            .logo {
                font-size: 2rem;
                font-weight: 800;
                color: #ffffff;
                letter-spacing: -1px;
            }

            .logo-subtitle {
                font-size: 0.9rem;
                font-weight: 500;
                color: #d4af37;
                text-transform: uppercase;
                letter-spacing: 2px;
            }

            .login-container {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                width: 100%;
                max-width: 450px;
                margin-top: 2rem;
                color: #1a1a1a;
            }
            
            .login-header {
                background: linear-gradient(135deg, #0055A4, #003366);
                color: white;
                padding: 3rem 2rem;
                text-align: center;
            }
            
            .login-header h1 {
                font-size: 1.8rem;
                margin-bottom: 0.5rem;
            }
            
            .login-header p {
                opacity: 0.9;
                font-size: 0.9rem;
            }
            
            .login-body {
                padding: 3rem 2rem;
            }
            
            .security-notice {
                background: #f0f7ff;
                border: 1px solid #0055A4;
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 2rem;
                text-align: center;
            }
            
            .security-notice i {
                color: #0055A4;
                font-size: 1.5rem;
                margin-bottom: 0.5rem;
                display: block;
            }
            
            .security-notice p {
                color: #0055A4;
                font-size: 0.9rem;
                font-weight: 600;
            }
            
            .form-group {
                margin-bottom: 1.5rem;
            }
            
            .form-label {
                display: block;
                margin-bottom: 0.5rem;
                color: #374151;
                font-weight: 600;
                font-size: 0.9rem;
            }
            
            .input-container {
                position: relative;
            }
            
            .input-icon {
                position: absolute;
                left: 1rem;
                top: 50%;
                transform: translateY(-50%);
                color: #6b7280;
            }
            
            .form-input {
                width: 100%;
                padding: 1rem 1rem 1rem 3rem;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                font-size: 1rem;
                transition: all 0.3s ease;
                background: #f8fafc;
            }
            
            .form-input:focus {
                outline: none;
                border-color: #0055A4;
                background: white;
                box-shadow: 0 0 0 3px rgba(0, 85, 164, 0.1);
            }
            
            .login-btn {
                width: 100%;
                padding: 1.2rem;
                background: linear-gradient(135deg, #0055A4, #003366);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            }
            
            .login-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(0, 85, 164, 0.3);
            }
            
            .login-btn:active {
                transform: translateY(0);
            }
            
            .error-message {
                background: #fee2e2;
                color: #dc2626;
                padding: 1rem;
                border-radius: 12px;
                margin-bottom: 1.5rem;
                text-align: center;
                display: none;
                border: 1px solid #fecaca;
            }
            
            .error-message.show {
                display: block;
                animation: shake 0.5s ease;
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            
            .footer-info {
                text-align: center;
                margin-top: 2rem;
                padding-top: 2rem;
                border-top: 1px solid #e5e7eb;
            }
            
            .footer-info p {
                color: #6b7280;
                font-size: 0.8rem;
                margin-bottom: 0.5rem;
            }
            
            .back-link {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                color: #0055A4;
                text-decoration: none;
                font-weight: 600;
                margin-top: 1rem;
                font-size: 0.9rem;
            }
            
            .back-link:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        ${generateHeader('Acceso Administrativo')}

        <div class="login-container">
            <div class="login-header">
                <h1><i class="fas fa-shield-alt"></i> Acceso Administrativo</h1>
                <p>Salud Total EPS - Sistema de Afiliaciones</p>
            </div>
            
            <div class="login-body">
                <div class="security-notice">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>🔒 Zona restringida - Manejo de datos sensibles</p>
                </div>
                
                <div id="errorMessage" class="error-message"></div>
                
                <form id="loginForm">
                    <div class="form-group">
                        <label class="form-label">Usuario Administrativo</label>
                        <div class="input-container">
                            <i class="fas fa-user input-icon"></i>
                            <input type="text" class="form-input" id="username" name="username" placeholder="Ingresa tu usuario" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Contraseña</label>
                        <div class="input-container">
                            <i class="fas fa-lock input-icon"></i>
                            <input type="password" class="form-input" id="password" name="password" placeholder="Ingresa tu contraseña" required>
                        </div>
                    </div>
                    
                    <button type="submit" class="login-btn" id="loginBtn">
                        <i class="fas fa-sign-in-alt"></i>
                        INGRESAR AL SISTEMA
                    </button>
                </form>
                
                <div class="footer-info">
                    <p>⏳ Sesión válida por 2 horas</p>
                    <p>🛡️ Sistema protegido por Indreima Seguros</p>
                    <a href="/" class="back-link">
                        <i class="fas fa-arrow-left"></i>
                        Volver al formulario de afiliación
                    </a>
                </div>
            </div>
        </div>
        
        <script>
            document.getElementById('loginForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const loginBtn = document.getElementById('loginBtn');
                const errorMessage = document.getElementById('errorMessage');
                const originalText = loginBtn.innerHTML;
                
                const formData = {
                    username: document.getElementById('username').value.trim(),
                    password: document.getElementById('password').value
                };
                
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> VERIFICANDO...';
                errorMessage.classList.remove('show');
                
                try {
                    const response = await fetch('/admin/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        window.location.href = '/admin/afiliados';
                    } else {
                        throw new Error(result.message);
                    }
                    
                } catch (error) {
                    errorMessage.textContent = error.message;
                    errorMessage.classList.add('show');
                    document.querySelector('.login-container').style.animation = 'shake 0.5s ease';
                    setTimeout(() => {
                        document.querySelector('.login-container').style.animation = '';
                    }, 500);
                } finally {
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = originalText;
                }
            });
            
            document.getElementById('username').addEventListener('input', function() {
                document.getElementById('errorMessage').classList.remove('show');
            });
            
            document.getElementById('password').addEventListener('input', function() {
                document.getElementById('errorMessage').classList.remove('show');
            });
        </script>
    </body>
    </html>`;
    
    res.send(html);
});

// ✅ RUTA PARA PROCESAR LOGIN
app.post('/admin/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin_saludtotal';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SaludTotal2024!';
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAuthenticated = true;
        req.session.user = {
            username: username,
            loginTime: new Date(),
            userAgent: req.get('User-Agent')
        };
        
        console.log("🔐 Login exitoso: " + username + " desde " + req.ip);
        
        res.json({
            success: true,
            message: '✅ Autenticación exitosa'
        });
    } else {
        console.log("❌ Intento de login fallido: " + username + " desde " + req.ip);
        res.status(401).json({
            success: false,
            message: '❌ Credenciales incorrectas'
        });
    }
});

// ✅ RUTA PARA LOGOUT
app.post('/admin/auth/logout', requireAuth, (req, res) => {
    console.log("🚪 Logout: " + req.session.user.username);
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
        }
        res.json({ success: true, message: '✅ Sesión cerrada correctamente' });
    });
});

// ✅ RUTA PARA PROCESAR EL FORMULARIO (pública)
app.post('/api/formulario/solicitud', async (req, res) => {
    try {
        await createTableIfNotExists();
        
        const formData = req.body;
        
        console.log('📝 Datos recibidos del formulario:', formData);
        
        if (!formData.tratamiento_datos) {
            return res.status(400).json({
                success: false,
                message: '❌ Debe autorizar OBLIGATORIAMENTE el tratamiento de datos personales para continuar con la afiliación al Sistema de Salud'
            });
        }
        
        const result = await pool.query(
            'INSERT INTO affiliates (nombre, apellido, edad, tipo_documento, numero_documento, fecha_nacimiento, lugar_nacimiento, correo, tratamiento_datos, affiliate_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [
                formData.nombre,
                formData.apellido,
                formData.edad,
                formData.tipo_documento,
                formData.numero_documento,
                formData.fecha_nacimiento,
                formData.lugar_nacimiento,
                formData.correo,
                formData.tratamiento_datos,
                'ST-' + Date.now()
            ]
        );

        console.log('✅ Datos guardados en PostgreSQL:', result.rows[0]);
        
        res.json({
            success: true,
            message: '✅ Afiliación registrada exitosamente en Salud Total EPS',
            data: result.rows[0],
            affiliateId: result.rows[0].affiliate_id,
            tratamientoDatos: result.rows[0].tratamiento_datos,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error al guardar en PostgreSQL:', error);
        
        if (error.code === '23505') {
            if (error.constraint === 'affiliates_correo_key') {
                return res.status(400).json({
                    success: false,
                    message: '❌ Este correo electrónico ya está registrado'
                });
            }
            if (error.constraint === 'affiliates_numero_documento_key') {
                return res.status(400).json({
                    success: false,
                    message: '❌ Este número de documento ya está registrado'
                });
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Error al guardar en la base de datos: ' + error.message
        });
    }
});

// ✅ RUTA PARA ELIMINAR UN AFILIADO (protegida)
app.delete('/api/afiliados/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('🗑️ Eliminando afiliado ID: ' + id);
        
        const result = await pool.query(
            'DELETE FROM affiliates WHERE affiliate_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '❌ Afiliado no encontrado'
            });
        }

        console.log('✅ Afiliado eliminado:', result.rows[0]);
        
        res.json({
            success: true,
            message: '✅ Afiliado eliminado exitosamente',
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Error al eliminar afiliado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar afiliado: ' + error.message
        });
    }
});

// ✅ RUTA PARA DESCARGAR DATOS EN EXCEL (protegida)
app.get('/admin/descargar-excel', requireAuth, async (req, res) => {
    try {
        await createTableIfNotExists();
        
        const result = await pool.query('SELECT * FROM affiliates ORDER BY created_at DESC');
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hay datos para exportar'
            });
        }

        const XLSX = require('xlsx');

        const excelData = result.rows.map(afiliado => ({
            'ID Afiliado': afiliado.affiliate_id,
            'Nombre': afiliado.nombre,
            'Apellido': afiliado.apellido,
            'Edad': afiliado.edad,
            'Tipo Documento': afiliado.tipo_documento,
            'Número Documento': afiliado.numero_documento,
            'Fecha Nacimiento': new Date(afiliado.fecha_nacimiento).toLocaleDateString('es-CO'),
            'Lugar Nacimiento': afiliado.lugar_nacimiento,
            'Correo Electrónico': afiliado.correo,
            'Tratamiento Datos Autorizado': afiliado.tratamiento_datos ? 'SÍ' : 'NO',
            'Fecha Registro': new Date(afiliado.created_at).toLocaleString('es-CO'),
            'Estado': 'Activo'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, 'Afiliados');

        const fileName = 'afiliados_salud_total_' + new Date().toISOString().split('T')[0] + '.xlsx';
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '"');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);

        console.log('✅ Archivo Excel descargado: ' + fileName + ' con ' + result.rows.length + ' registros');

    } catch (error) {
        console.error('❌ Error al generar Excel:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar archivo Excel: ' + error.message
        });
    }
});

// ✅ RUTA DEL PANEL DE ADMINISTRACIÓN (protegida)
app.get('/admin/afiliados', requireAuth, async (req, res) => {
    try {
        await createTableIfNotExists();
        
        const result = await pool.query('SELECT * FROM affiliates ORDER BY created_at DESC');
        
        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Panel de Administración - Salud Total EPS</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Inter', sans-serif;
                }
                
                body {
                    background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
                    min-height: 100vh;
                    padding: 0;
                    color: #1a1a1a;
                }

                .main-header {
                    background: #ffffff;
                    border-bottom: 3px solid #d4af37;
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }

                .header-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 1rem 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .logo-section {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                }

                .logo {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #1a1a1a;
                    letter-spacing: -1px;
                }

                .logo-subtitle {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #d4af37;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }

                .session-info {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    font-size: 0.9rem;
                }
                
                .logout-btn {
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s ease;
                }
                
                .logout-btn:hover {
                    background: #b91c1c;
                    transform: translateY(-2px);
                }
                
                .security-badge {
                    background: #f0f7ff;
                    color: #0055A4;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    border: 1px solid #bfdbfe;
                }

                .admin-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 2rem;
                }
                
                .admin-header {
                    background: linear-gradient(135deg, #0055A4 0%, #003366 100%);
                    color: white;
                    padding: 3rem 2rem;
                    text-align: center;
                    border-radius: 20px;
                    margin-bottom: 2rem;
                }
                
                .admin-header h1 {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                }
                
                .admin-header p {
                    opacity: 0.9;
                    font-size: 1.1rem;
                }
                
                .partner-notice {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 1rem;
                    border-radius: 8px;
                    margin-top: 1rem;
                    font-size: 0.9rem;
                }
                
                .stats-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                    padding: 2rem;
                    background: #ffffff;
                    border-radius: 20px;
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
                    margin-bottom: 2rem;
                }
                
                .stat-card {
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                    padding: 2rem;
                    border-radius: 16px;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                    border-left: 4px solid #0055A4;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    cursor: pointer;
                }
                
                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                }
                
                .stat-card.excel {
                    background: linear-gradient(135deg, #00A859, #008046);
                    color: white;
                    border-left: 4px solid #00A859;
                }
                
                .stat-number {
                    font-size: 2.5rem;
                    font-weight: bold;
                    color: #0055A4;
                    margin-bottom: 0.5rem;
                }
                
                .stat-card.excel .stat-number {
                    color: white;
                }
                
                .stat-label {
                    color: #64748b;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .stat-card.excel .stat-label {
                    color: rgba(255, 255, 255, 0.9);
                }
                
                .data-table {
                    padding: 0 0 2rem 0;
                    overflow-x: auto;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                    min-width: 1000px;
                }
                
                th {
                    background: #0055A4;
                    color: white;
                    padding: 1.2rem;
                    text-align: left;
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                
                td {
                    padding: 1rem 1.2rem;
                    border-bottom: 1px solid #e2e8f0;
                    font-size: 0.85rem;
                }
                
                tr:hover {
                    background: #f0f7ff;
                }
                
                .badge {
                    padding: 0.4rem 0.8rem;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                
                .badge-success {
                    background: #dcfce7;
                    color: #166534;
                }
                
                .badge-warning {
                    background: #fef3c7;
                    color: #92400E;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                }
                
                .btn {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.75rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                }
                
                .btn-delete {
                    background: #ef4444;
                    color: white;
                }
                
                .btn-delete:hover {
                    background: #dc2626;
                    transform: translateY(-2px);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    color: #64748b;
                }
                
                .empty-state i {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    color: #0055A4;
                }
                
                .download-section {
                    text-align: center;
                    padding: 2rem;
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
                    margin-top: 2rem;
                }
                
                .download-btn {
                    background: linear-gradient(135deg, #00A859, #008046);
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    text-decoration: none;
                }
                
                .download-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 168, 89, 0.3);
                }
                
                .download-info {
                    margin-top: 1rem;
                    color: #64748b;
                    font-size: 0.9rem;
                }
                
                .notification {
                    position: fixed;
                    top: 2rem;
                    right: 2rem;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    z-index: 1001;
                    animation: slideInRight 0.3s ease;
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                .notification.success {
                    background: #00A859;
                }
                
                .notification.error {
                    background: #dc2626;
                }
                
                @media (max-width: 768px) {
                    .stats-container {
                        grid-template-columns: 1fr;
                    }
                    
                    .admin-container {
                        padding: 1rem;
                    }
                    
                    .download-btn {
                        width: 100%;
                        justify-content: center;
                    }
                    
                    .header-container {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }
                }
            </style>
        </head>
        <body>
            <div id="notification" class="notification" style="display: none;"></div>

            ${generateHeader('Panel de Administración')}

            <div class="admin-container">
                <div class="session-info">
                    <div class="security-badge">
                        <i class="fas fa-shield-alt"></i>
                        Sesión activa: ${req.session.user.username}
                    </div>
                    <div>Conectado desde: ${new Date(req.session.user.loginTime).toLocaleString('es-CO')}</div>
                    <button class="logout-btn" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        Cerrar Sesión
                    </button>
                </div>
                
                <div class="admin-header">
                    <h1>🏥 Panel de Administración</h1>
                    <p>Salud Total EPS - Sistema de Afiliaciones</p>
                    <div class="partner-notice">
                        <i class="fas fa-handshake"></i>
                        Aliado estratégico: <strong>Indreima Seguros</strong>
                    </div>
                </div>
                
                <div class="stats-container">
                    <div class="stat-card">
                        <div class="stat-number">${result.rows.length}</div>
                        <div class="stat-label">Total Afiliados</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${result.rows.filter(a => a.tratamiento_datos).length}</div>
                        <div class="stat-label">Tratamiento Autorizado</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${new Date().getFullYear()}</div>
                        <div class="stat-label">Año Actual</div>
                    </div>
                    <div class="stat-card excel" onclick="window.location.href='/admin/descargar-excel'">
                        <div class="stat-number"><i class="fas fa-file-excel"></i></div>
                        <div class="stat-label">Descargar Excel</div>
                    </div>
                </div>`;
        
        if (result.rows.length === 0) {
            html += `
                    <div class="empty-state">
                        <i class="fas fa-database"></i>
                        <h2>No hay afiliados registrados</h2>
                        <p>Los datos aparecerán aquí cuando los usuarios se afilien</p>
                        <p style="margin-top: 20px; font-size: 0.9rem; color: #0055A4;">
                            <i class="fas fa-info-circle"></i>
                            ¡El sistema está listo! Los afiliados aparecerán aquí.
                        </p>
                    </div>`;
        } else {
            html += `
                    <div class="data-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID Afiliado</th>
                                    <th>Nombre Completo</th>
                                    <th>Documento</th>
                                    <th>Email</th>
                                    <th>Edad</th>
                                    <th>Tratamiento Datos</th>
                                    <th>Lugar Nacimiento</th>
                                    <th>Fecha Registro</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>`;
            
            result.rows.forEach(afiliado => {
                html += `
                                <tr>
                                    <td><strong>${afiliado.affiliate_id}</strong></td>
                                    <td>${afiliado.nombre} ${afiliado.apellido}</td>
                                    <td>${afiliado.tipo_documento}: ${afiliado.numero_documento}</td>
                                    <td>${afiliado.correo}</td>
                                    <td>${afiliado.edad} años</td>
                                    <td>
                                        <span class="badge ${afiliado.tratamiento_datos ? 'badge-success' : 'badge-warning'}">
                                            ${afiliado.tratamiento_datos ? 'AUTORIZADO' : 'NO AUTORIZADO'}
                                        </span>
                                    </td>
                                    <td>${afiliado.lugar_nacimiento}</td>
                                    <td>${new Date(afiliado.created_at).toLocaleString('es-CO')}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-delete" onclick="deleteAffiliate('${afiliado.affiliate_id}', '${afiliado.nombre} ${afiliado.apellido}')">
                                                <i class="fas fa-trash"></i> Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>`;
            });
            
            html += `
                            </tbody>
                        </table>
                    </div>`;
        }
        
        html += `
                </div>
                
                <div class="download-section">
                    <a href="/admin/descargar-excel" class="download-btn">
                        <i class="fas fa-file-excel"></i>
                        DESCARGAR REPORTE COMPLETO EN EXCEL
                    </a>
                    <div class="download-info">
                        ${result.rows.length} registros disponibles | 
                        Tratamiento de datos autorizado: ${result.rows.filter(a => a.tratamiento_datos).length} afiliados
                    </div>
                </div>
            </div>
            
            <script>
                function showNotification(message, type) {
                    const notification = document.getElementById('notification');
                    notification.textContent = message;
                    notification.className = 'notification ' + type;
                    notification.style.display = 'block';
                    
                    setTimeout(() => {
                        notification.style.display = 'none';
                    }, 4000);
                }
                
                async function deleteAffiliate(affiliateId, fullName) {
                    if (confirm('¿Estás seguro de que deseas eliminar al afiliado: ' + fullName + '?\\\\n\\\\nEsta acción no se puede deshacer.')) {
                        try {
                            const response = await fetch('/api/afiliados/' + affiliateId, {
                                method: 'DELETE'
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                showNotification('✅ ' + result.message, 'success');
                                setTimeout(() => {
                                    location.reload();
                                }, 1500);
                            } else {
                                throw new Error(result.message);
                            }
                        } catch (error) {
                            showNotification('❌ ' + error.message, 'error');
                        }
                    }
                }
                
                async function logout() {
                    try {
                        const response = await fetch('/admin/auth/logout', {
                            method: 'POST'
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            window.location.href = '/admin/login';
                        } else {
                            alert('Error al cerrar sesión');
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Error de conexión');
                    }
                }
                
                document.querySelector('.stat-card.excel').addEventListener('click', function() {
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 150);
                });
            </script>
        </body>
        </html>`;
        
        res.send(html);
        
    } catch (error) {
        console.error('❌ Error en panel admin:', error);
        res.status(500).send('Error al cargar los datos: ' + error.message);
    }
});

// ✅ HEALTH CHECK (pública)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '🏥 Salud Total EPS - Sistema funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        status: 'operational',
        partnership: {
            aseguradora: 'Indreima Seguros',
            eps: 'Salud Total EPS'
        },
        security: {
            authentication: true,
            sessionManagement: true,
            adminPanelProtected: true
        },
        features: {
            formularioAfiliacion: true,
            tratamientoDatos: true,
            baseDatos: true,
            panelAdmin: true,
            exportExcel: true,
            loginSystem: true
        }
    });
});

// ==============================================
// 🚀 INICIO DEL SERVIDOR
// ==============================================

app.listen(PORT, () => {
    console.log('🎉 Servidor Salud Total EPS ejecutándose en puerto ' + PORT);
    console.log('📱 Formulario: http://localhost:' + PORT);
    console.log('🔐 Login Admin: http://localhost:' + PORT + '/admin/login');
    console.log('📊 Panel Admin: http://localhost:' + PORT + '/admin/afiliados');
    console.log('🔍 Health Check: http://localhost:' + PORT + '/api/health');
    console.log('🛡️  SISTEMA DE AUTENTICACIÓN ACTIVADO');
    console.log('🏢 Aliado estratégico: Indreima Seguros');
    
    createTableIfNotExists();
});

// Manejo graceful de shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Recibido SIGTERM. Cerrando servidor gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Recibido SIGINT. Cerrando servidor...');
    process.exit(0);
});
