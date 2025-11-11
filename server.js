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
    secret: process.env.SESSION_SECRET || 'salud-total-eps-seguridad-datos-2024',
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
            console.log('✅ Tabla affiliates creada con columna tratamiento_datos');
        } else {
            const columnExists = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'affiliates' AND column_name = 'tratamiento_datos'
                );
            `);
            
            if (!columnExists.rows[0].exists) {
                await pool.query(`
                    ALTER TABLE affiliates 
                    ADD COLUMN tratamiento_datos BOOLEAN DEFAULT FALSE;
                `);
                console.log('✅ Columna tratamiento_datos agregada a la tabla existente');
            } else {
                console.log('✅ Tabla affiliates ya tiene la columna tratamiento_datos');
            }
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
// 🎨 CONFIGURACIÓN DEL FRONTEND
// ==============================================

function ensureFrontendExists() {
    const frontDir = path.join(__dirname, 'front');
    const indexPath = path.join(frontDir, 'index.html');
    
    if (!fs.existsSync(frontDir)) {
        fs.mkdirSync(frontDir, { recursive: true });
        console.log('📁 Carpeta front creada');
    }
    
    if (!fs.existsSync(indexPath)) {
        const yourExactHTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SALUD TOTAL EPS | Afiliación Oficial</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --salud-total-blue: #0055A4;
            --salud-total-green: #00A859;
            --salud-total-light: #F0F7FF;
            --white: #FFFFFF;
            --gray-light: #F8F9FA;
            --gray: #6B7280;
            --dark: #1F2937;
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
            background: linear-gradient(135deg, var(--salud-total-light) 0%, #FFFFFF 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: var(--dark);
            line-height: 1.6;
            position: relative;
            overflow-x: hidden;
        }

        .wave-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            overflow: hidden;
        }

        .wave {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 200%;
            height: 100%;
            background: linear-gradient(90deg, 
                rgba(0, 85, 164, 0.03) 0%, 
                rgba(0, 168, 89, 0.03) 50%, 
                rgba(0, 85, 164, 0.03) 100%);
            animation: waveAnimation 15s linear infinite;
            transform-origin: center bottom;
        }

        .wave:nth-child(1) {
            animation-duration: 20s;
            opacity: 0.6;
            height: 80%;
        }

        .wave:nth-child(2) {
            animation-duration: 25s;
            opacity: 0.4;
            height: 60%;
            animation-direction: reverse;
        }

        .wave:nth-child(3) {
            animation-duration: 30s;
            opacity: 0.2;
            height: 40%;
        }

        @keyframes waveAnimation {
            0% {
                transform: translateX(0) translateY(0);
            }
            50% {
                transform: translateX(-25%) translateY(10px);
            }
            100% {
                transform: translateX(-50%) translateY(0);
            }
        }

        .container {
            display: grid;
            grid-template-columns: 1.1fr 1.3fr;
            max-width: 1300px;
            width: 100%;
            background: var(--white);
            border-radius: var(--border-radius-lg);
            box-shadow: var(--shadow-lg);
            overflow: hidden;
            min-height: 800px;
            position: relative;
            animation: containerEntrance 1s ease-out;
        }

        @keyframes containerEntrance {
            0% {
                opacity: 0;
                transform: translateY(30px) scale(0.95);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .info-section {
            background: linear-gradient(135deg, var(--salud-total-blue) 0%, #003366 100%);
            padding: 50px 40px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
        }

        .info-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="rgba(255,255,255,0.02)"><circle cx="50" cy="50" r="1"/></svg>');
        }

        .info-header {
            position: relative;
            z-index: 2;
        }

        .official-badge {
            display: inline-flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 25px;
            color: white;
            animation: badgeFloat 2s ease-in-out infinite;
        }

        @keyframes badgeFloat {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-5px);
            }
        }

        .info-title {
            font-size: 2.2rem;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 15px;
            color: white;
            animation: titleGlow 3s ease-in-out infinite;
        }

        @keyframes titleGlow {
            0%, 100% {
                text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
            }
            50% {
                text-shadow: 0 0 30px rgba(255, 255, 255, 0.6);
            }
        }

        .info-subtitle {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 40px;
            font-weight: 400;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px 15px;
            border-radius: var(--border-radius);
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.15);
            transition: var(--transition);
            animation: statCardEntrance 0.6s ease-out;
            animation-fill-mode: both;
        }

        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        .stat-card:nth-child(4) { animation-delay: 0.4s; }

        @keyframes statCardEntrance {
            0% {
                opacity: 0;
                transform: translateY(20px) scale(0.9);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .stat-card:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-2px);
        }

        .stat-number {
            font-size: 1.8rem;
            font-weight: 700;
            color: white;
            margin-bottom: 5px;
        }

        .stat-label {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.8);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .features-list {
            background: rgba(255, 255, 255, 0.1);
            padding: 25px;
            border-radius: var(--border-radius);
            border: 1px solid rgba(255, 255, 255, 0.15);
            animation: featuresEntrance 0.8s ease-out 0.5s both;
        }

        @keyframes featuresEntrance {
            0% {
                opacity: 0;
                transform: translateX(-20px);
            }
            100% {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            color: white;
            animation: featureItemEntrance 0.5s ease-out;
            animation-fill-mode: both;
        }

        .feature-item:nth-child(1) { animation-delay: 0.6s; }
        .feature-item:nth-child(2) { animation-delay: 0.7s; }
        .feature-item:nth-child(3) { animation-delay: 0.8s; }
        .feature-item:nth-child(4) { animation-delay: 0.9s; }

        @keyframes featureItemEntrance {
            0% {
                opacity: 0;
                transform: translateX(-10px);
            }
            100% {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .feature-item:last-child {
            margin-bottom: 0;
        }

        .feature-item i {
            margin-right: 12px;
            color: #00A859;
            font-size: 1rem;
            width: 16px;
            text-align: center;
        }

        .feature-text {
            font-size: 0.9rem;
            line-height: 1.4;
        }

        .info-footer {
            position: relative;
            z-index: 2;
            margin-top: 30px;
            animation: footerEntrance 0.8s ease-out 1s both;
        }

        @keyframes footerEntrance {
            0% {
                opacity: 0;
                transform: translateY(20px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .legal-info {
            display: flex;
            align-items: center;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.8rem;
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: var(--border-radius);
            border-left: 3px solid #00A859;
        }

        .legal-info i {
            margin-right: 10px;
            color: #00A859;
        }

        .form-section {
            padding: 50px 40px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: var(--white);
        }

        .form-header {
            margin-bottom: 40px;
            text-align: center;
            animation: formHeaderEntrance 0.8s ease-out 0.3s both;
        }

        @keyframes formHeaderEntrance {
            0% {
                opacity: 0;
                transform: translateY(-20px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .form-logo {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, var(--salud-total-blue), var(--salud-total-green));
            border-radius: 50%;
            margin-bottom: 20px;
            box-shadow: var(--shadow);
            animation: logoPulse 2s ease-in-out infinite;
        }

        @keyframes logoPulse {
            0%, 100% {
                transform: scale(1);
                box-shadow: var(--shadow);
            }
            50% {
                transform: scale(1.05);
                box-shadow: 0 15px 40px rgba(0, 85, 164, 0.2);
            }
        }

        .form-logo i {
            font-size: 1.8rem;
            color: white;
        }

        .form-title {
            font-size: 1.8rem;
            font-weight: 700;
            margin-bottom: 8px;
            color: var(--salud-total-blue);
        }

        .form-subtitle {
            color: var(--gray);
            font-size: 0.95rem;
        }

        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
        }

        .form-group {
            position: relative;
            animation: formGroupEntrance 0.6s ease-out;
            animation-fill-mode: both;
        }

        .form-group:nth-child(1) { animation-delay: 0.4s; }
        .form-group:nth-child(2) { animation-delay: 0.5s; }
        .form-group:nth-child(3) { animation-delay: 0.6s; }
        .form-group:nth-child(4) { animation-delay: 0.7s; }
        .form-group:nth-child(5) { animation-delay: 0.8s; }
        .form-group:nth-child(6) { animation-delay: 0.9s; }
        .form-group:nth-child(7) { animation-delay: 1.0s; }
        .form-group:nth-child(8) { animation-delay: 1.1s; }

        @keyframes formGroupEntrance {
            0% {
                opacity: 0;
                transform: translateY(20px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .form-group.full-width {
            grid-column: 1 / -1;
        }

        .form-label {
            display: block;
            margin-bottom: 8px;
            color: var(--dark);
            font-weight: 600;
            font-size: 0.9rem;
        }

        .required::after {
            content: '*';
            color: #EF4444;
            margin-left: 4px;
        }

        .input-container {
            position: relative;
        }

        .input-icon {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--gray);
            z-index: 2;
            transition: var(--transition);
        }

        .form-input {
            width: 100%;
            padding: 14px 14px 14px 45px;
            background: var(--gray-light);
            border: 2px solid #E5E7EB;
            border-radius: var(--border-radius);
            font-size: 15px;
            transition: var(--transition);
            color: var(--dark);
            font-family: 'Inter', sans-serif;
        }

        .form-input::placeholder {
            color: var(--gray);
        }

        .form-input:focus {
            outline: none;
            border-color: var(--salud-total-blue);
            background: white;
            box-shadow: 0 0 0 3px rgba(0, 85, 164, 0.1);
            transform: translateY(-2px);
        }

        .form-input:focus + .input-icon {
            color: var(--salud-total-blue);
            transform: translateY(-50%) scale(1.1);
        }

        /* Estilos para checkboxes de tratamiento de datos */
        .checkbox-group {
            background: #f8f9fa;
            padding: 20px;
            border-radius: var(--border-radius);
            border: 2px solid #e9ecef;
            margin: 20px 0;
            transition: var(--transition);
        }

        .checkbox-group:focus-within {
            border-color: var(--salud-total-blue);
            background: white;
            box-shadow: 0 0 0 3px rgba(0, 85, 164, 0.1);
        }

        .checkbox-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
            cursor: pointer;
        }

        .checkbox-item:last-child {
            margin-bottom: 0;
        }

        .checkbox-input {
            margin-right: 12px;
            margin-top: 3px;
            accent-color: var(--salud-total-blue);
            transform: scale(1.2);
        }

        .checkbox-label {
            font-size: 0.85rem;
            line-height: 1.5;
            color: var(--dark);
        }

        .checkbox-label a {
            color: var(--salud-total-blue);
            text-decoration: none;
            font-weight: 600;
        }

        .checkbox-label a:hover {
            text-decoration: underline;
        }

        .required-checkbox {
            color: #EF4444;
            font-weight: bold;
        }

        .privacy-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .privacy-modal.active {
            display: flex;
            animation: modalFadeIn 0.3s ease;
        }

        @keyframes modalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .modal-content {
            background: white;
            border-radius: var(--border-radius-lg);
            max-width: 800px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: var(--shadow-lg);
            animation: modalSlideIn 0.3s ease;
        }

        @keyframes modalSlideIn {
            from { transform: translateY(-30px) scale(0.9); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .modal-header {
            background: linear-gradient(135deg, var(--salud-total-blue), var(--salud-total-green));
            color: white;
            padding: 25px;
            border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
            position: relative;
        }

        .modal-header h2 {
            margin: 0;
            font-size: 1.5rem;
        }

        .close-modal {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--transition);
        }

        .close-modal:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
        }

        .modal-body {
            padding: 30px;
            line-height: 1.6;
        }

        .modal-body h3 {
            color: var(--salud-total-blue);
            margin: 25px 0 15px 0;
            font-size: 1.2rem;
        }

        .modal-body h3:first-child {
            margin-top: 0;
        }

        .modal-body p {
            margin-bottom: 15px;
            color: var(--dark);
        }

        .modal-body ul {
            margin: 15px 0;
            padding-left: 20px;
        }

        .modal-body li {
            margin-bottom: 8px;
        }

        .submit-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, var(--salud-total-blue), var(--salud-total-green));
            color: white;
            border: none;
            border-radius: var(--border-radius);
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            animation: buttonEntrance 0.8s ease-out 1.2s both;
            position: relative;
            overflow: hidden;
        }

        .submit-btn:disabled {
            background: #9CA3AF;
            cursor: not-allowed;
            transform: none !important;
        }

        @keyframes buttonEntrance {
            0% {
                opacity: 0;
                transform: translateY(20px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .submit-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s;
        }

        .submit-btn:hover:not(:disabled)::before {
            left: 100%;
        }

        .submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 85, 164, 0.2);
        }

        .submit-btn:active:not(:disabled) {
            transform: translateY(0);
        }

        .message-box {
            margin-top: 20px;
            padding: 16px;
            border-radius: var(--border-radius);
            text-align: center;
            display: none;
            animation: messagePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            font-weight: 600;
        }

        @keyframes messagePop {
            0% {
                opacity: 0;
                transform: scale(0.8) translateY(10px);
            }
            100% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        .success {
            background: #D1FAE5;
            color: #065F46;
            border: 1px solid #A7F3D0;
        }

        .error {
            background: #FEE2E2;
            color: #991B1B;
            border: 1px solid #FECACA;
        }

        .loading {
            background: #EFF6FF;
            color: #1E40AF;
            border: 1px solid #BFDBFE;
        }

        .form-footer {
            margin-top: 25px;
            text-align: center;
            animation: formFooterEntrance 0.8s ease-out 1.4s both;
        }

        @keyframes formFooterEntrance {
            0% {
                opacity: 0;
            }
            100% {
                opacity: 1;
            }
        }

        .privacy-notice {
            font-size: 0.75rem;
            color: var(--gray);
            line-height: 1.4;
        }

        .privacy-notice a {
            color: var(--salud-total-blue);
            text-decoration: none;
            cursor: pointer;
            font-weight: 600;
        }

        .privacy-notice a:hover {
            text-decoration: underline;
        }

        @media (max-width: 1024px) {
            .container {
                grid-template-columns: 1fr;
                max-width: 600px;
            }
            
            .info-section {
                padding: 40px 30px;
            }
            
            .form-section {
                padding: 40px 30px;
            }
        }

        @media (max-width: 768px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
            
            .stats-grid {
                grid-template-columns: 1fr 1fr;
            }
            
            .info-title {
                font-size: 1.8rem;
            }

            .modal-content {
                margin: 10px;
                max-height: 95vh;
            }

            .modal-body {
                padding: 20px;
            }
        }

        @media (max-width: 480px) {
            .info-section, .form-section {
                padding: 30px 20px;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .info-title {
                font-size: 1.6rem;
            }
            
            .form-title {
                font-size: 1.4rem;
            }

            .checkbox-group {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="wave-background">
        <div class="wave"></div>
        <div class="wave"></div>
        <div class="wave"></div>
    </div>

    <!-- Modal de Política de Privacidad -->
    <div class="privacy-modal" id="privacyModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-shield-alt"></i> Política de Tratamiento de Datos Personales</h2>
                <button class="close-modal" id="closeModal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <h3>1. Marco Legal</h3>
                <p>Esta política se rige por la <strong>Ley 1581 de 2012</strong> y el <strong>Decreto 1377 de 2013</strong> sobre protección de datos personales en Colombia, y por las disposiciones del <strong>Régimen de Protección de Datos Personales</strong>.</p>

                <h3>2. Finalidades del Tratamiento</h3>
                <p>Sus datos personales serán utilizados para las siguientes finalidades:</p>
                <ul>
                    <li>Gestionar su proceso de afiliación al Sistema General de Seguridad Social en Salud (SGSSS)</li>
                    <li>Prestar los servicios de salud a los que tenga derecho como afiliado</li>
                    <li>Elaborar y mantener su historia clínica</li>
                    <li>Realizar procesos de auditoría y control de calidad en salud</li>
                    <li>Cumplir con las obligaciones legales y regulatorias como EPS</li>
                    <li>Gestionar los procesos administrativos de la afiliación</li>
                    <li>Contactarlo para información relevante sobre servicios de salud</li>
                </ul>

                <h3>3. Derechos del Titular</h3>
                <p>De conformidad con la normativa vigente, usted tiene derecho a:</p>
                <ul>
                    <li><strong>Acceso:</strong> Conocer su información personal almacenada</li>
                    <li><strong>Rectificación:</strong> Actualizar o corregir datos inexactos</li>
                    <li><strong>Cancelación:</strong> Solicitar la supresión de sus datos</li>
                    <li><strong>Oposición:</strong> Oponerse al tratamiento en ciertos casos</li>
                    <li><strong>Revocatoria:</strong> Revocar la autorización otorgada</li>
                    <li><strong>Consulta y reclamos:</strong> Presentar consultas y reclamos sobre el tratamiento</li>
                </ul>

                <h3>4. Procedimiento para Ejercer Derechos</h3>
                <p>Para ejercer sus derechos, puede:</p>
                <ul>
                    <li>Presentar su solicitud directamente en las sedes de la EPS</li>
                    <li>Utilizar los canales de atención al usuario establecidos</li>
                    <li>Seguir el procedimiento establecido en el Manual de Políticas y Procedimientos</li>
                    <li>La EPS dispondrá de hasta 10 días hábiles para responder su solicitud</li>
                </ul>

                <h3>5. Transferencia de Datos</h3>
                <p>Sus datos podrán ser compartidos con:</p>
                <ul>
                    <li>Instituciones Prestadoras de Servicios de Salud (IPS)</li>
                    <li>Entidades del Sistema de Seguridad Social en Salud</li>
                    <li>Entidades de control y vigilancia (Superintendencia Nacional de Salud, Ministerio de Salud)</li>
                    <li>Auditorías externas autorizadas</li>
                    <li>Proveedores de servicios con quienes se tenga relación contractual</li>
                </ul>

                <h3>6. Seguridad de la Información</h3>
                <p>La EPS implementa medidas técnicas, humanas y administrativas para proteger sus datos personales contra accesos no autorizados, pérdida, destrucción, uso, modificación o divulgación indebida.</p>

                <h3>7. Vigencia</h3>
                <p>La base de datos será conservada por el tiempo necesario para cumplir con las finalidades del tratamiento y las obligaciones legales, contables y de auditoría aplicables.</p>

                <h3>8. Autorización</h3>
                <p>Al marcar la casilla de autorización, usted declara haber leído, entendido y aceptado esta política de tratamiento de datos personales, y autoriza de manera expresa e informada a la EPS para el tratamiento de sus datos conforme a lo aquí establecido.</p>

                <div style="background: #f0f7ff; padding: 15px; border-radius: 8px; border-left: 4px solid var(--salud-total-blue); margin-top: 20px;">
                    <strong>Nota importante:</strong> Esta autorización es obligatoria para el proceso de afiliación al Sistema General de Seguridad Social en Salud. El tratamiento de datos personales en el sector salud está amparado por el secreto profesional y las normas de confidencialidad médica.
                </div>
            </div>
        </div>
    </div>

    <div class="container">
        <div class="info-section">
            <div class="info-header">
                <div class="official-badge">
                    <i class="fas fa-shield-alt"></i>
                    EPS Oficial - Régimen Contributivo
                </div>
                
                <h1 class="info-title">
                    SALUD TOTAL<br>
                    EPS S.A.
                </h1>
                
                <p class="info-subtitle">
                    Más de 25 años cuidando la salud de los colombianos. 
                    Afíliate a la EPS con cobertura nacional y servicios de calidad.
                </p>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">+4M</div>
                        <div class="stat-label">Afiliados</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">800+</div>
                        <div class="stat-label">Municipios</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">5.000+</div>
                        <div class="stat-label">Profesionales</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">24/7</div>
                        <div class="stat-label">Atención</div>
                    </div>
                </div>

                <div class="features-list">
                    <div class="feature-item">
                        <i class="fas fa-check"></i>
                        <span class="feature-text">Cobertura nacional en 32 departamentos</span>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-check"></i>
                        <span class="feature-text">Medicina general y especializada</span>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-check"></i>
                        <span class="feature-text">Urgencias las 24 horas</span>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-check"></i>
                        <span class="feature-text">Plan de beneficios POS completo</span>
                    </div>
                </div>
            </div>
            
            <div class="info-footer">
                <div class="legal-info">
                    <i class="fas fa-gavel"></i>
                    <span>Entidad vigilada por la Superintendencia Nacional de Salud</span>
                </div>
            </div>
        </div>

        <div class="form-section">
            <div class="form-header">
                <div class="form-logo">
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

                <!-- Sección de Tratamiento de Datos Personales - OBLIGATORIA -->
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" class="checkbox-input" id="tratamiento_datos" name="tratamiento_datos" required>
                        <label for="tratamiento_datos" class="checkbox-label">
                            <span class="required-checkbox">*</span> 
                            <strong>AUTORIZO OBLIGATORIAMENTE</strong> el tratamiento de mis datos personales conforme a la 
                            <a href="#" id="openPrivacyPolicy">Política de Tratamiento de Datos</a> 
                            y la Ley 1581 de 2012. Entiendo que esta autorización es <strong>requisito indispensable</strong> 
                            para el proceso de afiliación al Sistema General de Seguridad Social en Salud y conozco mis derechos de acceso, rectificación, cancelación y oposición.
                        </label>
                    </div>
                </div>

                <button type="submit" class="submit-btn" id="submitBtn">
                    <i class="fas fa-user-plus"></i>
                    SOLICITAR AFILIACIÓN
                </button>
            </form>

            <div id="message-box" class="message-box"></div>

            <div class="form-footer">
                <p class="privacy-notice">
                    Al enviar este formulario aceptas nuestro 
                    <a href="#" id="openPrivacyPolicyFooter">Aviso de Privacidad</a> y autorizas el tratamiento de datos personales 
                    conforme a la Ley 1581 de 2012. Salud Total EPS S.A. - Nit: 830.035.375-8
                </p>
            </div>
        </div>
    </div>

    <script>
        const API_URL = '/api/formulario/solicitud';

        // Funciones para el modal de privacidad
        const privacyModal = document.getElementById('privacyModal');
        const openPrivacyPolicy = document.getElementById('openPrivacyPolicy');
        const openPrivacyPolicyFooter = document.getElementById('openPrivacyPolicyFooter');
        const closeModal = document.getElementById('closeModal');

        function openModal() {
            privacyModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModalFunc() {
            privacyModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        openPrivacyPolicy.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });

        openPrivacyPolicyFooter.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });

        closeModal.addEventListener('click', closeModalFunc);

        // Cerrar modal al hacer clic fuera del contenido
        privacyModal.addEventListener('click', function(e) {
            if (e.target === privacyModal) {
                closeModalFunc();
            }
        });

        // Cerrar modal con tecla Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && privacyModal.classList.contains('active')) {
                closeModalFunc();
            }
        });

        function validateForm(formData) {
            const errors = [];
            
            // Validaciones básicas
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
            
            // Validación OBLIGATORIA de tratamiento de datos
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
                    throw new Error(result.message || \`Error \${response.status}: \${response.statusText}\`);
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
            messageBox.className = \`message-box \${type}\`;
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
        console.log('🔗 API Configurada:', API_URL);
        console.log('🛡️  Sistema de Tratamiento de Datos implementado');
    </script>
</body>
</html>`;
        
        fs.writeFileSync(indexPath, yourExactHTML, 'utf8');
        console.log('✅ index.html creado automáticamente');
        console.log('🎉 Tu formulario está listo!');
    }
}

// ==============================================
// ⚙️ MIDDLEWARES
// ==============================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'front')));

// ==============================================
// 🚀 RUTAS DE LA APLICACIÓN
// ==============================================

// ✅ RUTA PRINCIPAL (pública)
app.get('/', (req, res) => {
    ensureFrontendExists();
    res.sendFile(path.join(__dirname, 'front', 'index.html'));
});

// ✅ RUTA DE LOGIN (pública)
app.get('/admin/login', redirectIfAuthenticated, (req, res) => {
    const loginHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acceso Administrativo - Salud Total EPS</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            body { background: linear-gradient(135deg, #0055A4 0%, #003366 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
            .login-container { background: white; border-radius: 15px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); overflow: hidden; width: 100%; max-width: 450px; animation: slideUp 0.6s ease; }
            @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            .login-header { background: linear-gradient(135deg, #0055A4, #003366); color: white; padding: 40px 30px; text-align: center; }
            .login-header h1 { font-size: 1.8rem; margin-bottom: 10px; }
            .login-header p { opacity: 0.9; font-size: 0.9rem; }
            .login-body { padding: 40px 30px; }
            .security-notice { background: #f0f7ff; border: 1px solid #0055A4; border-radius: 8px; padding: 15px; margin-bottom: 25px; text-align: center; }
            .security-notice i { color: #0055A4; font-size: 1.2rem; margin-bottom: 8px; display: block; }
            .security-notice p { color: #0055A4; font-size: 0.85rem; font-weight: 600; }
            .form-group { margin-bottom: 20px; }
            .form-label { display: block; margin-bottom: 8px; color: #333; font-weight: 600; font-size: 0.9rem; }
            .input-container { position: relative; }
            .input-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #666; }
            .form-input { width: 100%; padding: 14px 14px 14px 45px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 15px; transition: all 0.3s ease; background: #f8f9fa; }
            .form-input:focus { outline: none; border-color: #0055A4; background: white; box-shadow: 0 0 0 3px rgba(0, 85, 164, 0.1); }
            .login-btn { width: 100%; padding: 15px; background: linear-gradient(135deg, #0055A4, #003366); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 10px; }
            .login-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0, 85, 164, 0.3); }
            .login-btn:active { transform: translateY(0); }
            .error-message { background: #fee2e2; color: #dc2626; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center; display: none; border: 1px solid #fecaca; }
            .error-message.show { display: block; animation: shake 0.5s ease; }
            @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
            .footer-info { text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            .footer-info p { color: #666; font-size: 0.8rem; }
            .back-link { display: inline-flex; align-items: center; gap: 5px; color: #0055A4; text-decoration: none; font-weight: 600; margin-top: 10px; font-size: 0.85rem; }
            .back-link:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="login-header">
                <h1><i class="fas fa-shield-alt"></i> Acceso Administrativo</h1>
                <p>Salud Total EPS - Sistema de Afiliaciones</p>
            </div>
            
            <div class="login-body">
                <div class="security-notice">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>🔒 Zona restringida - Manejo de datos personales sensibles</p>
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
                    <p>🛡️ Protegido por Ley 1581 de 2012</p>
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
    
    res.send(loginHTML);
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
        
        console.log(`🔐 Login exitoso: ${username} desde ${req.ip}`);
        
        res.json({
            success: true,
            message: '✅ Autenticación exitosa'
        });
    } else {
        console.log(`❌ Intento de login fallido: ${username} desde ${req.ip}`);
        res.status(401).json({
            success: false,
            message: '❌ Credenciales incorrectas'
        });
    }
});

// ✅ RUTA PARA LOGOUT
app.post('/admin/auth/logout', requireAuth, (req, res) => {
    console.log(`🚪 Logout: ${req.session.user.username}`);
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
            `INSERT INTO affiliates 
            (nombre, apellido, edad, tipo_documento, numero_documento, fecha_nacimiento, lugar_nacimiento, correo, tratamiento_datos, affiliate_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING *`,
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
        
        console.log(`🗑️ Eliminando afiliado ID: ${id}`);
        
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

        const fileName = `afiliados_salud_total_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);

        console.log(`✅ Archivo Excel descargado: ${fileName} con ${result.rows.length} registros`);

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
            <title>Afiliados - Salud Total EPS</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                body {
                    background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
                    min-height: 100vh;
                    padding: 20px;
                }
                
                .admin-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0, 85, 164, 0.1);
                    overflow: hidden;
                }
                
                .session-header {
                    background: #1e40af;
                    color: white;
                    padding: 15px 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #374151;
                }
                
                .session-info {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    font-size: 0.9rem;
                }
                
                .logout-btn {
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    transition: all 0.3s ease;
                }
                
                .logout-btn:hover {
                    background: #dc2626;
                    transform: translateY(-2px);
                }
                
                .security-badge {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                }
                
                .admin-header {
                    background: linear-gradient(135deg, #0055A4 0%, #003366 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                
                .admin-header h1 {
                    font-size: 2.5rem;
                    margin-bottom: 10px;
                }
                
                .admin-header p {
                    opacity: 0.9;
                    font-size: 1.1rem;
                }
                
                .stats-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    padding: 30px;
                    background: #f8f9fa;
                }
                
                .stat-card {
                    background: white;
                    padding: 25px;
                    border-radius: 10px;
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
                    margin-bottom: 5px;
                }
                
                .stat-card.excel .stat-number {
                    color: white;
                }
                
                .stat-label {
                    color: #666;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .stat-card.excel .stat-label {
                    color: rgba(255, 255, 255, 0.9);
                }
                
                .data-table {
                    padding: 0 30px 30px;
                    overflow-x: auto;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                    min-width: 1000px;
                }
                
                th {
                    background: #0055A4;
                    color: white;
                    padding: 15px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                
                td {
                    padding: 12px 15px;
                    border-bottom: 1px solid #e5e7eb;
                    font-size: 0.85rem;
                }
                
                tr:hover {
                    background: #f0f7ff;
                }
                
                .badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                
                .badge-success {
                    background: #D1FAE5;
                    color: #065F46;
                }
                
                .badge-warning {
                    background: #FEF3C7;
                    color: #92400E;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 8px;
                }
                
                .btn {
                    padding: 6px 12px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.75rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .btn-delete {
                    background: #EF4444;
                    color: white;
                }
                
                .btn-delete:hover {
                    background: #DC2626;
                    transform: translateY(-2px);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #666;
                }
                
                .empty-state i {
                    font-size: 3rem;
                    margin-bottom: 20px;
                    color: #0055A4;
                }
                
                .download-section {
                    text-align: center;
                    padding: 20px;
                    background: #f8f9fa;
                    border-top: 1px solid #e5e7eb;
                }
                
                .download-btn {
                    background: linear-gradient(135deg, #00A859, #008046);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    text-decoration: none;
                }
                
                .download-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 168, 89, 0.3);
                }
                
                .download-info {
                    margin-top: 10px;
                    color: #666;
                    font-size: 0.9rem;
                }
                
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
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
                    background: #EF4444;
                }
                
                @media (max-width: 768px) {
                    .stats-container {
                        grid-template-columns: 1fr;
                    }
                    
                    .data-table {
                        padding: 0 15px 20px;
                    }
                    
                    .download-btn {
                        width: 100%;
                        justify-content: center;
                    }
                    
                    .session-header {
                        flex-direction: column;
                        gap: 10px;
                        text-align: center;
                    }
                }
            </style>
        </head>
        <body>
            <div id="notification" class="notification" style="display: none;"></div>

            <div class="admin-container">
                <div class="session-header">
                    <div class="session-info">
                        <div class="security-badge">
                            <i class="fas fa-shield-alt"></i>
                            Sesión activa: ${req.session.user.username}
                        </div>
                        <div>Conectado desde: ${new Date(req.session.user.loginTime).toLocaleString('es-CO')}</div>
                    </div>
                    <button class="logout-btn" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        Cerrar Sesión
                    </button>
                </div>
                
                <div class="admin-header">
                    <h1>🏥 Salud Total EPS</h1>
                    <p>Panel de Administración - Sistema de Afiliaciones</p>
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
                            ¡La tabla está lista! Puedes registrar afiliados desde el formulario principal.
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
                    if (confirm('¿Estás seguro de que deseas eliminar al afiliado: ' + fullName + '?\\n\\nEsta acción no se puede deshacer.')) {
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
    console.log(`🎉 Servidor Salud Total EPS ejecutándose en puerto ${PORT}`);
    console.log(`📱 Formulario: http://localhost:${PORT}`);
    console.log(`🔐 Login Admin: http://localhost:${PORT}/admin/login`);
    console.log(`📊 Panel Admin: http://localhost:${PORT}/admin/afiliados`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🛡️  SISTEMA DE AUTENTICACIÓN ACTIVADO`);
    console.log(`📋 Configura en Render: ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET`);
    
    ensureFrontendExists();
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
