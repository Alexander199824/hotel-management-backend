/**
 * Aplicación Principal - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Configuración principal de Express.js con middleware, rutas,
 * manejo de errores y configuración de seguridad
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Importar configuración y utilidades
const config = require('./config/environment');
const { logger, requestLogger } = require('./utils/logger');

// Importar middleware personalizado
const { 
    errorHandler, 
    notFoundHandler,
    jsonErrorHandler,
    securityHeaders
} = require('./middleware/errorHandler');

// Importar rutas
const authRoutes = require('./routes/auth');
const reservationRoutes = require('./routes/reservations');
const roomRoutes = require('./routes/rooms');
const guestRoutes = require('./routes/guests');
const reportRoutes = require('./routes/reports');
const incidentRoutes = require('./routes/incidents');

// Crear aplicación Express
const app = express();

/**
 * Configuración de seguridad con Helmet
 * Establece varios headers HTTP para mejorar la seguridad
 */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false, // Permite embebido en iframes si es necesario
    hsts: {
        maxAge: 31536000, // 1 año
        includeSubDomains: true,
        preload: true
    }
}));

/**
 * Configuración de CORS
 * Permite solicitudes desde el frontend y otros dominios autorizados
 */
app.use(cors({
    origin: function (origin, callback) {
        // Permitir solicitudes sin origin (aplicaciones móviles, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Verificar si el origin está en la lista de permitidos
        if (config.security.corsOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // En desarrollo, permitir localhost con cualquier puerto
        if (config.server.environment === 'development' && origin.includes('localhost')) {
            return callback(null, true);
        }
        
        callback(new Error('No permitido por CORS'));
    },
    credentials: true, // Permitir cookies y headers de autenticación
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'] // Headers que el cliente puede leer
}));

/**
 * Middleware para parsing del cuerpo de las solicitudes
 */
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

/**
 * Middleware de logging
 */
if (config.server.environment === 'development') {
    // Usar morgan para logging detallado en desarrollo
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }));
} else {
    // Usar requestLogger personalizado en producción
    app.use(requestLogger);
}

/**
 * Headers de seguridad personalizados
 */
app.use(securityHeaders);

/**
 * Middleware para manejo de errores de parsing JSON
 */
app.use(jsonErrorHandler);

/**
 * Middleware de información del servidor
 */
app.use((req, res, next) => {
    // Agregar información del servidor a las respuestas
    res.setHeader('X-Powered-By', 'Hotel Mar Azul API');
    res.setHeader('X-API-Version', '1.0.0');
    
    // Agregar timestamp a la request
    req.timestamp = new Date().toISOString();
    
    next();
});

/**
 * Ruta de health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: config.server.environment,
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

/**
 * Ruta raíz con información de la API
 */
app.get('/', (req, res) => {
    res.json({
        message: 'Bienvenido al API de Sistema de Gestión Hotelera "Mar Azul"',
        version: '1.0.0',
        developer: 'Alexander Echeverria',
        environment: config.server.environment,
        documentation: '/api/docs', // Para futuro Swagger/OpenAPI
        endpoints: {
            auth: '/api/auth',
            reservations: '/api/reservations',
            rooms: '/api/rooms',
            guests: '/api/guests',
            reports: '/api/reports',
            incidents: '/api/incidents'
        }
    });
});

/**
 * Configuración de rutas principales
 * Todas las rutas de la API están bajo el prefijo /api
 */
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/incidents', incidentRoutes);

/**
 * Ruta para servir archivos estáticos (si es necesario)
 * Por ejemplo, para imágenes de habitaciones, documentos, etc.
 */
app.use('/uploads', express.static('uploads', {
    maxAge: '1d', // Cache por 1 día
    etag: true,
    lastModified: true
}));

/**
 * Middleware para rutas no encontradas
 * Debe ir antes del error handler
 */
app.use(notFoundHandler);

/**
 * Middleware global de manejo de errores
 * Debe ser el último middleware
 */
app.use(errorHandler);

/**
 * Función para inicializar la aplicación
 * Incluye conexión a base de datos y configuraciones iniciales
 */
const initializeApp = async () => {
    try {
        // Importar y probar conexión a base de datos
        const { testConnection, syncDatabase } = require('./config/database');
        
        logger.info('Inicializando aplicación...');
        
        // Probar conexión a base de datos
        const dbConnected = await testConnection();
        if (!dbConnected) {
            throw new Error('No se pudo conectar a la base de datos');
        }
        
        // Sincronizar modelos en desarrollo (usar migraciones en producción)
        if (config.server.environment === 'development') {
            await syncDatabase({ alter: true });
            logger.info('Modelos de base de datos sincronizados');
            
            // Crear usuario administrador por defecto
            const User = require('./models/User');
            await User.createDefaultAdmin();
            logger.info('Usuario administrador verificado');
        }
        
        logger.info('Aplicación inicializada correctamente');
        return true;
        
    } catch (error) {
        logger.error('Error inicializando aplicación', error);
        
        // En producción, terminar la aplicación si no se puede inicializar
        if (config.server.environment === 'production') {
            process.exit(1);
        }
        
        return false;
    }
};

/**
 * Función para shutdown elegante
 */
const gracefulShutdown = async (signal) => {
    logger.info(`Recibida señal ${signal}, cerrando servidor...`);
    
    try {
        // Cerrar conexión a base de datos
        const { closeConnection } = require('./config/database');
        await closeConnection();
        
        logger.info('Aplicación cerrada correctamente');
        process.exit(0);
        
    } catch (error) {
        logger.error('Error durante shutdown', error);
        process.exit(1);
    }
};

// Manejar señales de shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejar excepciones no capturadas
process.on('uncaughtException', (error) => {
    logger.error('Excepción no capturada', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Promesa rechazada no manejada', reason, {
        promise: promise.toString()
    });
    process.exit(1);
});

module.exports = { app, initializeApp };