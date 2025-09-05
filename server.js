/**
 * Servidor Principal - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Punto de entrada principal del servidor que inicializa la aplicación,
 * configura la base de datos y maneja el arranque del sistema
 */

require('dotenv').config();

const { app, initializeApp } = require('./src/app');
const config = require('./src/config/environment');
const { logger } = require('./src/utils/logger');

// Variables de entorno y configuración
const PORT = config.server.port;
const ENVIRONMENT = config.server.environment;

/**
 * Función principal para iniciar el servidor
 */
async function startServer() {
    try {
        logger.info('Iniciando servidor Hotel Mar Azul...', {
            port: PORT,
            environment: ENVIRONMENT,
            node_version: process.version,
            timestamp: new Date().toISOString()
        });

        // Inicializar la aplicación (base de datos, modelos, etc.)
        const initialized = await initializeApp();
        
        if (!initialized) {
            logger.error('Error durante la inicialización de la aplicación');
            process.exit(1);
        }

        // Iniciar el servidor HTTP
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Servidor iniciado exitosamente`, {
                port: PORT,
                environment: ENVIRONMENT,
                url: `http://localhost:${PORT}`,
                api_url: `http://localhost:${PORT}/api`,
                health_check: `http://localhost:${PORT}/health`
            });

            // Mostrar información adicional en desarrollo
            if (ENVIRONMENT === 'development') {
                console.log('\n🏨 ===== HOTEL MAR AZUL - API =====');
                console.log(`🌐 Servidor corriendo en: http://localhost:${PORT}`);
                console.log(`📱 API Base URL: http://localhost:${PORT}/api`);
                console.log(`💚 Health Check: http://localhost:${PORT}/health`);
                console.log(`📚 Documentación: http://localhost:${PORT}/api/docs`);
                console.log('\n📋 Endpoints disponibles:');
                console.log('  🔐 Auth: /api/auth');
                console.log('  🏠 Rooms: /api/rooms');
                console.log('  📅 Reservations: /api/reservations');
                console.log('  👥 Guests: /api/guests');
                console.log('  🚨 Incidents: /api/incidents');
                console.log('  📊 Reports: /api/reports');
                console.log('\n✅ Servidor listo para recibir conexiones!\n');
            }
        });

        // Configurar timeout del servidor
        server.timeout = 30000; // 30 segundos

        // Manejar cierre elegante del servidor
        const gracefulShutdown = (signal) => {
            logger.info(`Recibida señal ${signal}, cerrando servidor...`);
            
            server.close((err) => {
                if (err) {
                    logger.error('Error cerrando servidor', err);
                    process.exit(1);
                }
                
                logger.info('Servidor cerrado exitosamente');
                process.exit(0);
            });

            // Forzar cierre después de 10 segundos
            setTimeout(() => {
                logger.error('Forzando cierre del servidor...');
                process.exit(1);
            }, 10000);
        };

        // Escuchar señales de cierre
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Manejar errores del servidor
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Puerto ${PORT} ya está en uso`);
                process.exit(1);
            } else if (error.code === 'EACCES') {
                logger.error(`Sin permisos para usar el puerto ${PORT}`);
                process.exit(1);
            } else {
                logger.error('Error del servidor', error);
                process.exit(1);
            }
        });

        return server;

    } catch (error) {
        logger.error('Error fatal iniciando servidor', error);
        process.exit(1);
    }
}

/**
 * Manejar excepciones no capturadas
 */
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception! Cerrando aplicación...', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection! Cerrando aplicación...', reason, {
        promise: promise.toString()
    });
    process.exit(1);
});

// Verificar variables de entorno críticas antes de iniciar
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Error: Variables de entorno faltantes:', missingVars.join(', '));
    console.error('Por favor, configure estas variables en su archivo .env');
    process.exit(1);
}

// Iniciar el servidor
if (require.main === module) {
    startServer().catch((error) => {
        console.error('❌ Error iniciando servidor:', error.message);
        process.exit(1);
    });
}

// Exportar para testing
module.exports = { startServer };