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

app.use(session({
    secret: process.env.SESSION_SECRET || 'salud-total-andreima-session-2024', // CORREGIDO
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 2 * 60 * 60 * 1000
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
// 🎨 FUNCIONES DE DISEÑO MEJORADAS
// ==============================================

function generateHeader(title, showLogo = true) {
    return `
    <header class="main-header" style="
        background: #ffffff;
        border-bottom: 3px solid #d4af37;
        box-shadow: 0 8px 30px rgba(0, 85, 164, 0.08);
        position: fixed;
        top: 0;
        width: 100%;
        z-index: 1000;
        backdrop-filter: blur(10px);
    ">
        <div class="header-container" style="
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        ">
            ${showLogo ? `
            <div class="logo-section" style="display: flex; align-items: center; gap: 1rem;">
                <div class="logo-image" style="width: 250px; height: 80px; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(0, 85, 164, 0.08); transition: all 0.3s ease;">
                    <img src="https://andreimaseguros.com//andreimaseguros/app/webroot/img/logooriginal.png" 
                         alt="Salud Total EPS" 
                         class="logo-img" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="logo-text" style="display: flex; flex-direction: column;">
                    <div class="logo-main" style="font-size: 1.5rem; font-weight: 800; color: #0055A4; letter-spacing: -0.5px;">Salud Total</div>
                    <div class="logo-subtitle" style="font-size: 0.8rem; font-weight: 600; color: #00A859; letter-spacing: 1px;">EPS • Andreima Seguros</div> <!-- CORREGIDO -->
                </div>
            </div>
            ` : ''}
            <h1 class="page-title" style="font-size: 1.5rem; font-weight: 700; color: #0055A4; background: linear-gradient(135deg, #0055A4 0%, #00A859 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                ${title}
            </h1>
        </div>
    </header>`;
}

// ==============================================
// 🚀 RUTAS DE LA APLICACIÓN
// ==============================================

// ✅ RUTA PRINCIPAL - FORMULARIO DE AFILIACIÓN (HEADER FIJADO)
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
            /* TUS ESTILOS ORIGINALES SE MANTIENEN */
            :root {
                --primary-blue: #0055A4;
                --primary-green: #00A859;
                --primary-gold: #d4af37;
                --primary-dark: #1a1a1a;
                --light-bg: #f8fafc;
                --white: #ffffff;
                --gray-light: #f1f5f9;
                --gray: #64748b;
                --dark: #1e293b;
                --border-radius: 16px;
                --border-radius-lg: 24px;
                --shadow: 0 8px 30px rgba(0, 85, 164, 0.08);
                --shadow-lg: 0 20px 40px rgba(0, 85, 164, 0.12);
                --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                --gradient-primary: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-green) 100%);
                --gradient-hero: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Inter', sans-serif;
                background: linear-gradient(135deg, var(--light-bg) 0%, #e0f2fe 100%);
                min-height: 100vh;
                color: var(--dark);
                line-height: 1.6;
                overflow-x: hidden;
            }

            /* HEADER FIJADO - SOLO ESTO SE MODIFICÓ */
            .main-header {
                background: var(--white);
                border-bottom: 3px solid var(--primary-gold);
                box-shadow: var(--shadow);
                position: fixed; /* FIJADO */
                top: 0;
                width: 100%; /* FIJADO */
                z-index: 1000;
                backdrop-filter: blur(10px);
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
                align-items: center;
                gap: 1rem;
            }

            .logo-image {
                width: 250px;
                height: 80px;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: var(--shadow);
                transition: var(--transition);
            }

            .logo-image:hover {
                transform: scale(1.05);
                box-shadow: 0 12px 30px rgba(0, 85, 164, 0.2);
            }

            .logo-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .logo-text {
                display: flex;
                flex-direction: column;
            }

            .logo-main {
                font-size: 1.5rem;
                font-weight: 800;
                color: var(--primary-blue);
                letter-spacing: -0.5px;
            }

            .logo-subtitle {
                font-size: 0.8rem;
                font-weight: 600;
                color: var(--primary-green);
                letter-spacing: 1px;
            }

            .page-title {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--primary-blue);
                background: var(--gradient-primary);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            /* CONTENEDOR PRINCIPAL AJUSTADO PARA HEADER FIJADO */
            .main-container {
                max-width: 1200px;
                margin: 140px auto 0; /* AJUSTADO PARA HEADER FIJADO */
                padding: 2rem;
            }

            /* EL RESTO DE TUS ESTILOS ORIGINALES SE MANTIENEN INTACTOS */
            .hero-section {
                text-align: center;
                margin-bottom: 3rem;
                padding: 4rem 2rem;
                background: var(--white);
                border-radius: var(--border-radius-lg);
                box-shadow: var(--shadow-lg);
                position: relative;
                overflow: hidden;
            }

            .hero-section::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: var(--gradient-primary);
            }

            .hero-title {
                font-size: 3rem;
                font-weight: 800;
                background: var(--gradient-hero);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 1rem;
            }

            .hero-subtitle {
                font-size: 1.2rem;
                color: var(--gray);
                max-width: 600px;
                margin: 0 auto 2rem;
            }

            .hero-features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1.5rem;
                margin-top: 2rem;
            }

            .feature-card {
                background: var(--light-bg);
                padding: 1.5rem;
                border-radius: var(--border-radius);
                text-align: center;
                transition: var(--transition);
            }

            .feature-card:hover {
                transform: translateY(-5px);
                box-shadow: var(--shadow);
            }

            .feature-icon {
                width: 60px;
                height: 60px;
                background: var(--gradient-primary);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1rem;
                color: var(--white);
                font-size: 1.5rem;
            }

            .form-container {
                background: var(--white);
                border-radius: var(--border-radius-lg);
                box-shadow: var(--shadow-lg);
                padding: 3rem;
                margin-bottom: 2rem;
                position: relative;
                overflow: hidden;
            }

            .form-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: var(--gradient-primary);
            }

            .form-header {
                text-align: center;
                margin-bottom: 3rem;
            }

            .form-icon {
                width: 80px;
                height: 80px;
                background: var(--gradient-primary);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;
                color: var(--white);
                font-size: 2rem;
            }

            .form-title {
                font-size: 2.2rem;
                font-weight: 800;
                background: var(--gradient-primary);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 0.5rem;
            }

            .form-subtitle {
                color: var(--gray);
                font-size: 1.1rem;
            }

            .form-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
                padding: 1.2rem 1rem 1.2rem 3rem;
                background: var(--light-bg);
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
                transform: translateY(-2px);
            }

            .form-input:focus + .input-icon {
                color: var(--primary-blue);
                transform: translateY(-50%) scale(1.1);
            }

            .checkbox-group {
                background: var(--light-bg);
                padding: 2rem;
                border-radius: var(--border-radius);
                border: 2px solid #e2e8f0;
                margin: 2rem 0;
                transition: var(--transition);
            }

            .checkbox-group:focus-within {
                border-color: var(--primary-blue);
                box-shadow: 0 0 0 3px rgba(0, 85, 164, 0.1);
            }

            .checkbox-item {
                display: flex;
                align-items: flex-start;
                margin-bottom: 1rem;
                cursor: pointer;
                transition: var(--transition);
            }

            .checkbox-item:hover {
                transform: translateX(5px);
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
                transition: var(--transition);
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
                padding: 1.4rem;
                background: var(--gradient-primary);
                color: var(--white);
                border: none;
                border-radius: var(--border-radius);
                font-size: 1.1rem;
                font-weight: 700;
                cursor: pointer;
                transition: var(--transition);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                position: relative;
                overflow: hidden;
            }

            .submit-btn:hover:not(:disabled) {
                transform: translateY(-3px);
                box-shadow: 0 12px 30px rgba(0, 85, 164, 0.4);
            }

            .submit-btn:disabled {
                background: var(--gray);
                cursor: not-allowed;
                transform: none !important;
            }

            .message-box {
                margin-top: 1rem;
                padding: 1.2rem;
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
                padding: 3rem 2rem;
                margin-top: 4rem;
                position: relative;
            }

            .footer-content {
                max-width: 1200px;
                margin: 0 auto;
            }

            .partner-info {
                background: rgba(255, 255, 255, 0.1);
                padding: 1.5rem;
                border-radius: var(--border-radius);
                margin: 1.5rem 0;
                backdrop-filter: blur(10px);
            }

            .admin-link {
                color: var(--primary-gold);
                text-decoration: none;
                font-weight: 600;
                margin-top: 1rem;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                transition: var(--transition);
                padding: 0.8rem 1.5rem;
                border: 2px solid var(--primary-gold);
                border-radius: var(--border-radius);
            }

            .admin-link:hover {
                background: var(--primary-gold);
                color: var(--primary-blue);
                transform: translateY(-2px);
            }

            /* RESPONSIVE - AJUSTADO PARA HEADER FIJADO */
            @media (max-width: 768px) {
                .header-container {
                    padding: 1rem;
                    flex-direction: column;
                    gap: 1rem;
                    text-align: center;
                }

                .logo-section {
                    justify-content: center;
                }

                .main-container {
                    margin-top: 180px; /* AJUSTADO PARA MÓVIL */
                    padding: 1rem;
                }

                .form-grid {
                    grid-template-columns: 1fr;
                }

                .form-container {
                    padding: 2rem 1.5rem;
                }

                .hero-title {
                    font-size: 2.2rem;
                }

                .form-title {
                    font-size: 1.8rem;
                }
            }

            @media (max-width: 480px) {
                .main-container {
                    margin-top: 200px; /* AJUSTADO PARA MÓVIL PEQUEÑO */
                }

                .hero-section {
                    padding: 2rem 1rem;
                    margin-bottom: 2rem;
                }

                .hero-title {
                    font-size: 1.8rem;
                }

                .hero-subtitle {
                    font-size: 1rem;
                }

                .hero-features {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                .feature-card {
                    padding: 1.2rem;
                }

                .feature-icon {
                    width: 50px;
                    height: 50px;
                    font-size: 1.2rem;
                }

                .form-container {
                    padding: 1.5rem 1rem;
                }

                .form-title {
                    font-size: 1.5rem;
                }

                .form-subtitle {
                    font-size: 0.9rem;
                }

                .form-input {
                    padding: 1rem 1rem 1rem 2.8rem;
                    font-size: 16px;
                }

                .checkbox-group {
                    padding: 1.2rem;
                    margin: 1.5rem 0;
                }

                .checkbox-label {
                    font-size: 0.8rem;
                }

                .submit-btn {
                    padding: 1.2rem;
                    font-size: 1rem;
                    margin-bottom: 1rem;
                }

                .main-footer {
                    padding: 2rem 1rem;
                    margin-top: 2rem;
                }

                .partner-info {
                    padding: 1rem;
                    margin: 1rem 0;
                }

                .admin-link {
                    width: 100%;
                    justify-content: center;
                    margin-top: 1rem;
                }
            }
        </style>
    </head>
    <body>
        ${generateHeader('Sistema de Afiliación Digital')}

        <div class="main-container">
            <!-- TODO TU CONTENIDO ORIGINAL SE MANTIENE -->
            <div class="hero-section">
                <h1 class="hero-title">Salud Total EPS</h1>
                <p class="hero-subtitle">Más de 25 años cuidando la salud de los colombianos. Afíliate de forma rápida y segura a la EPS con cobertura nacional.</p>
                
                <div class="hero-features">
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h3>Seguro</h3>
                        <p>Datos protegidos</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-bolt"></i>
                        </div>
                        <h3>Rápido</h3>
                        <p>Proceso inmediato</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-network-wired"></i>
                        </div>
                        <h3>Cobertura</h3>
                        <p>Nacional</p>
                    </div>
                </div>
            </div>

            <div class="form-container">
                <div class="form-header">
                    <div class="form-icon">
                        <i class="fas fa-file-medical"></i>
                    </div>
                    <h2 class="form-title">Formulario de Afiliación</h2>
                    <p class="form-subtitle">Complete sus datos para el registro oficial en el Sistema General de Seguridad Social en Salud</p>
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
                    <p><strong>Aliado estratégico:</strong> Andreima Seguros</p> <!-- CORREGIDO -->
                    <p>Protegiendo tu salud con el respaldo de Andreima Seguros</p> <!-- CORREGIDO -->
                </div>
                <a href="/admin/login" class="admin-link">
                    <i class="fas fa-lock"></i>
                    Acceso Administrativo
                </a>
            </div>
        </footer>

        <script>
            // TODO TU JAVASCRIPT ORIGINAL SE MANTIENE
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
            console.log('🛡️  Aliado estratégico: Andreima Seguros'); // CORREGIDO
            console.log('📍 Header fijado correctamente');
        </script>
    </body>
    </html>`;
    
    res.send(html);
});

// LAS DEMÁS RUTAS (login, admin, etc.) SE MANTIENEN IGUAL PERO CON "Andreima" CORREGIDO

// ✅ RUTA PARA PROCESAR LOGIN (SOLO CORRECCIÓN DEL NOMBRE)
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

// ✅ HEALTH CHECK ACTUALIZADO
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '🏥 Salud Total EPS - Sistema funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '2.0.1',
        status: 'operational',
        partnership: {
            aseguradora: 'Andreima Seguros', // CORREGIDO
            eps: 'Salud Total EPS'
        },
        features: {
            formularioAfiliacion: true,
            tratamientoDatos: true,
            baseDatos: true,
            panelAdmin: true,
            exportExcel: true,
            loginSystem: true,
            diseñoMejorado: true,
            animaciones: true,
            headerFijo: true // NUEVA CARACTERÍSTICA
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
    console.log('🏢 Aliado estratégico: Andreima Seguros'); // CORREGIDO
    console.log('📍 Header fijado en todas las páginas');
    
    createTableIfNotExists();
});

// MANTENER TUS PROCESS LISTENERS ORIGINALES
process.on('SIGTERM', () => {
    console.log('🛑 Recibido SIGTERM. Cerrando servidor gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Recibido SIGINT. Cerrando servidor...');
    process.exit(0);
});
