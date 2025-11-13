/**
 * Middleware de Manejo de Errores - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Proporciona manejo centralizado de errores para toda la aplicación
 * Incluye logging, formateo de respuestas y manejo de diferentes tipos de errores
 */

const { logger } = require('../utils/logger');
const { ERROR_MESSAGES } = require('../utils/constants');
const config = require('../config/environment');

/**
 * Clase personalizada para errores de la aplicación
 */
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Maneja errores de validación de Sequelize
 */
const handleSequelizeValidationError = (error) => {
    const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
    }));

    const appError = new AppError(
        'Errores de validación de datos',
        400,
        true
    );
    appError.validationErrors = errors;
    return appError;
};

/**
 * Maneja errores de violación de restricciones únicas
 */
const handleSequelizeUniqueConstraintError = (error) => {
    const field = error.errors[0]?.path;
    const value = error.errors[0]?.value;
    
    let message = 'El valor ya existe en el sistema';
    
    // Mensajes específicos para campos comunes
    const fieldMessages = {
        email: 'El correo electrónico ya está registrado',
        username: 'El nombre de usuario ya está en uso',
        room_number: 'El número de habitación ya existe',
        reservation_code: 'El código de reserva ya existe',
        document_number: 'El número de documento ya está registrado'
    };
    
    if (field && fieldMessages[field]) {
        message = fieldMessages[field];
    }
    
    return new AppError(message, 400, true);
};

/**
 * Maneja errores de violación de clave foránea
 */
const handleSequelizeForeignKeyConstraintError = (error) => {
    return new AppError(
        'Referencia inválida - El recurso relacionado no existe',
        400,
        true
    );
};

/**
 * Maneja errores de conexión a base de datos
 */
const handleSequelizeConnectionError = (error) => {
    logger.error('Error de conexión a base de datos', error);
    
    return new AppError(
        'Error de conexión a la base de datos',
        503,
        true
    );
};

/**
 * Maneja errores de timeout de base de datos
 */
const handleSequelizeTimeoutError = (error) => {
    logger.error('Timeout en base de datos', error);
    
    return new AppError(
        'Timeout en la operación de base de datos',
        504,
        true
    );
};

/**
 * Maneja errores de JWT
 */
const handleJWTError = (error) => {
    if (error.name === 'JsonWebTokenError') {
        return new AppError('Token de acceso inválido', 401, true);
    }
    
    if (error.name === 'TokenExpiredError') {
        return new AppError('Token de acceso expirado', 401, true);
    }
    
    return new AppError('Error de autenticación', 401, true);
};

/**
 * Maneja errores de rate limiting
 */
const handleRateLimitError = (error) => {
    return new AppError(
        'Demasiadas solicitudes. Intente de nuevo más tarde.',
        429,
        true
    );
};

/**
 * Formatea el error para envío al cliente
 */
const sendErrorResponse = (err, req, res) => {
    // Error para producción (información limitada)
    if (config.server.environment === 'production') {
        // Solo enviar errores operacionales en producción
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                success: false,
                status: err.status,
                message: err.message,
                timestamp: new Date().toISOString(),
                path: req.originalUrl
            });
        }
        
        // Error genérico para errores no operacionales en producción
        return res.status(500).json({
            success: false,
            status: 'error',
            message: ERROR_MESSAGES.SERVER_ERROR,
            timestamp: new Date().toISOString(),
            path: req.originalUrl
        });
    }
    
    // Error detallado para desarrollo
    const responseError = {
        success: false,
        status: err.status || 'error',
        message: err.message,
        stack: err.stack,
        error: err,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
    };

    // Incluir errores de validación si existen
    if (err.validationErrors) {
        responseError.validationErrors = err.validationErrors;
    }

    res.status(err.statusCode || 500).json(responseError);
};

/**
 * Middleware principal de manejo de errores
 * Debe ser el último middleware en la cadena
 */
const errorHandler = (err, req, res, next) => {
    // Establecer valores por defecto
    let error = { ...err };
    error.message = err.message;

    // Log del error original
    logger.error('Error capturado por errorHandler', err, {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        body: req.body,
        params: req.params,
        query: req.query
    });

    // Manejar diferentes tipos de errores de Sequelize
    if (err.name === 'SequelizeValidationError') {
        error = handleSequelizeValidationError(err);
    } else if (err.name === 'SequelizeUniqueConstraintError') {
        error = handleSequelizeUniqueConstraintError(err);
    } else if (err.name === 'SequelizeForeignKeyConstraintError') {
        error = handleSequelizeForeignKeyConstraintError(err);
    } else if (err.name === 'SequelizeConnectionError') {
        error = handleSequelizeConnectionError(err);
    } else if (err.name === 'SequelizeTimeoutError') {
        error = handleSequelizeTimeoutError(err);
    }
    
    // Manejar errores de JWT
    else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        error = handleJWTError(err);
    }
    
    // Manejar errores de rate limiting
    else if (err.status === 429) {
        error = handleRateLimitError(err);
    }
    
    // Manejar errores de Cast (IDs inválidos)
    else if (err.name === 'CastError') {
        error = new AppError('Recurso no encontrado', 404, true);
    }
    
    // Si no es un AppError, crear uno genérico
    if (!error.isOperational) {
        error = new AppError(
            config.server.environment === 'production' 
                ? ERROR_MESSAGES.SERVER_ERROR 
                : err.message,
            err.statusCode || 500,
            false
        );
    }

    sendErrorResponse(error, req, res);
};

/**
 * Middleware para manejar rutas no encontradas
 */
const notFoundHandler = (req, res, next) => {
    const error = new AppError(
        `Ruta ${req.originalUrl} no encontrada`,
        404,
        true
    );
    
    logger.warn('Ruta no encontrada', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    next(error);
};

/**
 * Wrapper para funciones async que automáticamente captura errores
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Middleware para validar que el recurso existe
 */
const validateResourceExists = (Model, paramName = 'id', resourceName = 'recurso') => {
    return catchAsync(async (req, res, next) => {
        const id = req.params[paramName];
        const resource = await Model.findByPk(id);
        
        if (!resource) {
            throw new AppError(
                `${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} no encontrado`,
                404,
                true
            );
        }
        
        // Agregar el recurso al request para uso posterior
        req[resourceName] = resource;
        next();
    });
};

/**
 * Middleware para manejar errores de parsing JSON
 */
const jsonErrorHandler = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        logger.warn('Error de parsing JSON', {
            error: err.message,
            url: req.originalUrl,
            ip: req.ip
        });
        
        return res.status(400).json({
            success: false,
            message: 'JSON inválido en el cuerpo de la solicitud',
            error: 'Syntax error in JSON'
        });
    }
    next(err);
};

/**
 * Manejo global de promesas rechazadas no capturadas
 */
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', reason, {
        promise: promise.toString()
    });
    
    // En producción, cerrar el servidor elegantemente
    if (config.server.environment === 'production') {
        console.log('Cerrando servidor debido a unhandled rejection...');
        process.exit(1);
    }
});

/**
 * Manejo global de excepciones no capturadas
 */
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
    
    console.log('Uncaught Exception! Cerrando aplicación...');
    process.exit(1);
});

/**
 * Middleware para logs de requests en desarrollo
 */
const requestLogger = (req, res, next) => {
    if (config.server.environment === 'development') {
        logger.debug('Request recibido', {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            body: req.method !== 'GET' ? req.body : undefined
        });
    }
    next();
};

/**
 * Middleware para agregar headers de seguridad
 */
const securityHeaders = (req, res, next) => {
    // Prevenir sniffing de MIME type
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Prevenir clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Habilitar protección XSS del browser
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Remover header que expone tecnología
    res.removeHeader('X-Powered-By');
    
    next();
};

module.exports = {
    AppError,
    errorHandler,
    notFoundHandler,
    catchAsync,
    validateResourceExists,
    jsonErrorHandler,
    requestLogger,
    securityHeaders
};