/**
 * Servidor Principal - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Punto de entrada principal del servidor. Inicializa la aplicación
 * y levanta el servidor HTTP en el puerto configurado
 */

const { app, initializeApp } = require('./src/app');
const config = require('./src/config/environment');
const { logger } = require('./src/utils/logger');

/**
 * Función principal para arrancar el servidor
 */
async function startServer() {
    try {
        // Mostrar banner de inicio
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                    🏨 HOTEL MAR AZUL 🏨                     ║
║                                                              ║
║              Sistema de Gestión Hotelera                     ║
║              Desarrollador: Alexander Echeverria             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        `);

        // Mostrar información del entorno
        logger.info('Configuración del servidor', {
            environment: config.server.environment,
            port: config.server.port,
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        });

        // Inicializar aplicación
        logger.info('Inicializando aplicación...');
        await initializeApp();

        // Crear servidor HTTP
        const server = app.listen(config.server.port, () => {
            logger.info(`Servidor iniciado exitosamente`, {
                port: config.server.port,
                environment: config.server.environment,
                apiUrl: `http://localhost:${config.server.port}/api`,
                healthUrl: `http://localhost:${config.server.port}/health`
            });

            // Mostrar URLs importantes en consola
            console.log(`
🚀 Servidor corriendo en puerto ${config.server.port}
📍 API disponible en: http://localhost:${config.server.port}/api
🔍 Health check en: http://localhost:${config.server.port}/health
📊 Dashboard en: ${config.server.frontendUrl || 'No configurado'}

📝 Endpoints principales:
   • POST /api/auth/login - Login de usuarios
   • GET  /api/rooms - Consultar habitaciones
   • POST /api/reservations - Crear reservas
   • GET  /api/reports/dashboard - Dashboard de métricas

🔧 Entorno: ${config.server.environment.toUpperCase()}
            `);

            // Configurar manejo de señales para cierre elegante
            setupServerShutdown(server);
        });

        // Configurar timeouts del servidor
        server.timeout = 30000; // 30 segundos
        server.keepAliveTimeout = 5000; // 5 segundos
        server.headersTimeout = 6000; // 6 segundos

        // Manejar errores del servidor
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Puerto ${config.server.port} ya está en uso`);
                process.exit(1);
            } else if (error.code === 'EACCES') {
                logger.error(`Sin permisos para usar puerto ${config.server.port}`);
                process.exit(1);
            } else {
                logger.error('Error del servidor', error);
                process.exit(1);
            }
        });

        return server;

    } catch (error) {
        logger.error('Error crítico al iniciar servidor', error);
        
        // Mostrar mensaje de error más amigable
        console.error(`
❌ Error crítico al iniciar el servidor:
   ${error.message}

💡 Posibles soluciones:
   • Verificar que PostgreSQL esté corriendo
   • Revisar las variables de entorno en .env
   • Verificar que el puerto ${config.server.port} esté disponible
   • Verificar las credenciales de base de datos

📋 Para más información, revisar los logs del sistema.
        `);
        
        process.exit(1);
    }
}

/**
 * Configura el cierre elegante del servidor
 */
function setupServerShutdown(server) {
    const shutdown = (signal) => {
        logger.info(`Recibida señal ${signal}, cerrando servidor...`);
        
        // Dejar de aceptar nuevas conexiones
        server.close((error) => {
            if (error) {
                logger.error('Error cerrando servidor', error);
                process.exit(1);
            }
            
            logger.info('Servidor cerrado exitosamente');
            
            // Cerrar conexiones de base de datos
            const { closeConnection } = require('./src/config/database');
            closeConnection()
                .then(() => {
                    logger.info('Todas las conexiones cerradas correctamente');
                    process.exit(0);
                })
                .catch((dbError) => {
                    logger.error('Error cerrando conexiones de base de datos', dbError);
                    process.exit(1);
                });
        });

        // Forzar cierre después de 10 segundos si no se cierra elegantemente
        setTimeout(() => {
            logger.warn('Forzando cierre del servidor después de timeout');
            process.exit(1);
        }, 10000);
    };

    // Escuchar señales de cierre
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Verificar requisitos del sistema antes de iniciar
 */
function checkSystemRequirements() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 14) {
        console.error(`
❌ Versión de Node.js no soportada: ${nodeVersion}
   Se requiere Node.js 14.0.0 o superior
   
   Para actualizar Node.js:
   • Visitar: https://nodejs.org
   • O usar nvm: nvm install node && nvm use node
        `);
        process.exit(1);
    }

    // Verificar variables de entorno críticas
    const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error(`
❌ Variables de entorno faltantes:
   ${missingVars.join(', ')}

   Crear archivo .env basado en .env.example y configurar:
   ${missingVars.map(v => `   ${v}=tu_valor_aqui`).join('\n')}
        `);
        process.exit(1);
    }
}

// Verificar requisitos antes de iniciar
checkSystemRequirements();

// Iniciar servidor
if (require.main === module) {
    startServer().catch((error) => {
        logger.error('Error fatal iniciando servidor', error);
        process.exit(1);
    });
}

// Exportar función para testing
module.exports = { startServer };