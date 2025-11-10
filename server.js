const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

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
        await pool.query(`
            CREATE TABLE IF NOT EXISTS affiliates (
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
                notificaciones BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabla affiliates lista para usar');
    } catch (error) {
        console.error('❌ Error al crear la tabla:', error);
    }
}

// ==============================================
// 🎨 CONFIGURACIÓN DEL FRONTEND
// ==============================================

// ✅ FUNCIÓN PARA CREAR TU FRONTEND
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
                <h3>1. Responsable del Tratamiento</h3>
                <p><strong>Salud Total EPS S.A.</strong>, identificada con NIT 830.035.375-8, con domicilio principal en Bogotá D.C., será responsable del tratamiento de los datos personales que usted nos suministre.</p>

                <h3>2. Finalidades del Tratamiento</h3>
                <p>Sus datos personales serán utilizados para las siguientes finalidades:</p>
                <ul>
                    <li>Gestionar su proceso de afiliación al Sistema General de Seguridad Social en Salud</li>
                    <li>Prestar los servicios de salud a los que tenga derecho como afiliado</li>
                    <li>Mantener actualizada la información en nuestra base de datos</li>
                    <li>Enviar información relevante sobre servicios de salud y novedades del plan de beneficios</li>
                    <li>Cumplir con las obligaciones legales y regulatorias aplicables</li>
                </ul>

                <h3>3. Derechos del Titular</h3>
                <p>De conformidad con la Ley 1581 de 2012, usted tiene derecho a:</p>
                <ul>
                    <li>Conocer, actualizar y rectificar sus datos personales</li>
                    <li>Solicitar prueba de la autorización otorgada</li>
                    <li>Ser informado sobre el uso que se ha dado a sus datos</li>
                    <li>Presentar quejas ante la Superintendencia de Industria y Comercio</li>
                    <li>Revocar la autorización y/o solicitar la supresión de los datos</li>
                    <li>Acceder en forma gratuita a sus datos personales</li>
                </ul>

                <h3>4. Procedimiento para Ejercer sus Derechos</h3>
                <p>Para ejercer sus derechos, puede contactarnos a través de:</p>
                <ul>
                    <li><strong>Línea de atención:</strong> 01-8000-123456</li>
                    <li><strong>Correo electrónico:</strong> proteccion.datos@saludtotal.com</li>
                    <li><strong>Dirección:</strong> Carrera 15 # 95-74, Bogotá D.C.</li>
                </ul>

                <h3>5. Vigencia</h3>
                <p>La base de datos será conservada por el tiempo necesario para cumplir con las finalidades del tratamiento y las obligaciones legales aplicables.</p>

                <h3>6. Transferencias y Encargados</h3>
                <p>Sus datos podrán ser compartidos con:</p>
                <ul>
                    <li>Entidades del Sistema de Seguridad Social en Salud</li>
                    <li>Proveedores de servicios de salud (IPS, clínicas, hospitales)</li>
                    <li>Entidades de control y vigilancia (SuperSalud, Ministerio de Salud)</li>
                </ul>

                <p style="background: #f0f7ff; padding: 15px; border-radius: 8px; border-left: 4px solid var(--salud-total-blue);">
                    <strong>Nota importante:</strong> Al marcar las casillas de autorización en el formulario, usted declara haber leído, entendido y aceptado esta política de tratamiento de datos personales.
                </p>
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
                            <strong>AUTORIZO OBLIGATORIAMENTE</strong> el tratamiento de mis datos personales por 
                            <strong>Salud Total EPS S.A.</strong> conforme a la 
                            <a href="#" id="openPrivacyPolicy">Política de Tratamiento de Datos</a> 
                            y la Ley 1581 de 2012. Entiendo que esta autorización es <strong>requisito indispensable</strong> 
                            para el proceso de afiliación al Sistema General de Seguridad Social en Salud.
                        </label>
                    </div>
                    
                    <div class="checkbox-item">
                        <input type="checkbox" class="checkbox-input" id="notificaciones" name="notificaciones">
                        <label for="notificaciones" class="checkbox-label">
                            Autorizo de manera voluntaria el envío de información sobre servicios de salud, 
                            novedades del plan de beneficios, campañas de promoción y prevención, y demás 
                            comunicaciones relacionadas con mi afiliación.
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
                tratamiento_datos: document.getElementById('tratamiento_datos').checked,
                notificaciones: document.getElementById('notificaciones').checked
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
app.use(express.static(path.join(__dirname, 'front')));

// ==============================================
// 🚀 RUTAS DE LA APLICACIÓN
// ==============================================

// ✅ RUTA PRINCIPAL
app.get('/', (req, res) => {
    ensureFrontendExists();
    res.sendFile(path.join(__dirname, 'front', 'index.html'));
});

// ✅ RUTA PARA PROCESAR EL FORMULARIO
app.post('/api/formulario/solicitud', async (req, res) => {
    try {
        // ✅ CREAR TABLA SI NO EXISTE
        await createTableIfNotExists();
        
        const formData = req.body;
        
        console.log('📝 Datos recibidos del formulario:', formData);
        
        // Validar OBLIGATORIAMENTE que se haya autorizado el tratamiento de datos
        if (!formData.tratamiento_datos) {
            return res.status(400).json({
                success: false,
                message: '❌ Debe autorizar OBLIGATORIAMENTE el tratamiento de datos personales para continuar con la afiliación al Sistema de Salud'
            });
        }
        
        // ✅ GUARDAR EN POSTGRESQL
        const result = await pool.query(
            `INSERT INTO affiliates 
            (nombre, apellido, edad, tipo_documento, numero_documento, fecha_nacimiento, lugar_nacimiento, correo, tratamiento_datos, notificaciones, affiliate_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
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
                formData.notificaciones || false,
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
            notificaciones: result.rows[0].notificaciones,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error al guardar en PostgreSQL:', error);
        
        // Manejar error de duplicado
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

// ✅ HEALTH CHECK
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '🏥 Salud Total EPS - Sistema funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        status: 'operational',
        features: {
            formularioAfiliacion: true,
            tratamientoDatos: true,
            baseDatos: true
        }
    });
});

// ==============================================
// 🛡️ MANEJO DE ERRORES
// ==============================================

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

// ==============================================
// 🚀 INICIO DEL SERVIDOR
// ==============================================

app.listen(PORT, () => {
    console.log(`🎉 Servidor Salud Total EPS ejecutándose en puerto ${PORT}`);
    console.log(`📱 Formulario: http://localhost:${PORT}`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️  Base de datos: ${process.env.DATABASE_URL ? 'Conectada' : 'No configurada'}`);
    console.log(`🛡️  Sistema de Tratamiento de Datos implementado`);
    console.log(`⚠️  Autorización de datos: OBLIGATORIA para afiliación`);
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
