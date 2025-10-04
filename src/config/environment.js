/**
 * Configuración de variables de entorno para el Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Este archivo centraliza todas las variables de entorno y proporciona
 * valores por defecto seguros cuando sea apropiado
 */

require('dotenv').config();

// Validar variables de entorno críticas
const requiredEnvVars = [
    'DB_HOST',
    'DB_NAME', 
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET'
];

// Verificar que todas las variables requeridas estén presentes
requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        console.error(`Error: Variable de entorno requerida ${envVar} no está definida`);
        process.exit(1);
    }
});

const config = {
    // Configuración del servidor
    server: {
        port: parseInt(process.env.PORT) || 5000, // Cambiado de 3000 a 5000
        environment: process.env.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000/api' // Actualizado puerto
    },

    // Configuración de base de datos
    database: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 5432,
        name: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true',
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000
        }
    },

    // Configuración JWT para autenticación
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },

    // Configuración de correo electrónico
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true para 465, false para otros puertos
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        from: process.env.EMAIL_FROM || 'Hotel Mar Azul <noreply@hotelmarazul.com>'
    },

    googleAppsScript:{
        endpoint: process.env.GAS_EMAIL_ENDPOINT
    },

    // Configuración de pagos
    payment: {
        stripe: {
            publicKey: process.env.STRIPE_PUBLIC_KEY,
            secretKey: process.env.STRIPE_SECRET_KEY
        }
    },

    // Configuración de logging
    logging: {
        level: process.env.LOG_LEVEL || 'info'
    },

    // Configuración de seguridad
    security: {
        // Límite de intentos de login por IP
        rateLimitWindowMs: 15 * 60 * 1000, // 15 minutos
        rateLimitMaxAttempts: 5, // 5 intentos por ventana
        
        // Configuración de CORS
        corsOrigins: process.env.CORS_ORIGINS ? 
            process.env.CORS_ORIGINS.split(',') : 
            ['http://localhost:3000', 'http://localhost:5000'] // Actualizado puertos
    }
};

// Exportar configuración
module.exports = config;