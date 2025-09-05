/**
 * Configuración de base de datos PostgreSQL para Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Este archivo configura la conexión a PostgreSQL usando Sequelize ORM
 * Incluye configuración para Render y manejo de SSL
 */

const { Sequelize } = require('sequelize');
const config = require('./environment');

// Configuración de conexión a base de datos
const sequelizeConfig = {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging,
    pool: config.database.pool,
    
    // Configuración específica para Render PostgreSQL
    dialectOptions: {
        ssl: config.database.ssl ? {
            require: true,
            rejectUnauthorized: false // Necesario para Render
        } : false,
        
        // Configuración adicional para conexiones estables
        keepAlive: true,
        statement_timeout: 30000,
        idle_in_transaction_session_timeout: 30000
    },
    
    // Configuración de zona horaria
    timezone: '-06:00', // Guatemala GMT-6
    
    // Configuración de definición de modelos
    define: {
        timestamps: true, // Agregar createdAt y updatedAt automáticamente
        underscored: true, // Usar snake_case para nombres de columnas
        freezeTableName: true, // No pluralizar nombres de tablas
        charset: 'utf8',
        collate: 'utf8_general_ci'
    }
};

// Crear instancia de Sequelize
const sequelize = new Sequelize(
    config.database.name,
    config.database.username,
    config.database.password,
    sequelizeConfig
);

/**
 * Función para probar la conexión a la base de datos
 * Se ejecuta al iniciar la aplicación
 */
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión a PostgreSQL establecida exitosamente');
        
        // Mostrar información de la base de datos en desarrollo
        if (config.server.environment === 'development') {
            console.log(`Base de datos: ${config.database.name}`);
            console.log(`Host: ${config.database.host}:${config.database.port}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error.message);
        
        // En producción, terminar la aplicación si no hay conexión
        if (config.server.environment === 'production') {
            process.exit(1);
        }
        
        return false;
    }
};

/**
 * Función para sincronizar modelos con la base de datos
 * Solo usar en desarrollo - en producción usar migraciones
 */
const syncDatabase = async (options = {}) => {
    try {
        // Por defecto, no hacer drop de tablas existentes
        const syncOptions = {
            force: false, // No recrear tablas existentes
            alter: config.server.environment === 'development', // Solo alterar en desarrollo
            ...options
        };
        
        await sequelize.sync(syncOptions);
        console.log('Sincronización de base de datos completada');
        
        return true;
    } catch (error) {
        console.error('Error al sincronizar base de datos:', error.message);
        return false;
    }
};

/**
 * Función para cerrar la conexión de manera elegante
 */
const closeConnection = async () => {
    try {
        await sequelize.close();
        console.log('Conexión a base de datos cerrada');
    } catch (error) {
        console.error('Error al cerrar conexión:', error.message);
    }
};

// Manejar cierre elegante de la aplicación
process.on('SIGINT', async () => {
    console.log('Recibida señal SIGINT, cerrando conexión a base de datos...');
    await closeConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Recibida señal SIGTERM, cerrando conexión a base de datos...');
    await closeConnection();
    process.exit(0);
});

// Exportar instancia de Sequelize y funciones utilitarias
module.exports = {
    sequelize,
    testConnection,
    syncDatabase,
    closeConnection,
    Sequelize // Exportar también la clase para tipos de datos
};