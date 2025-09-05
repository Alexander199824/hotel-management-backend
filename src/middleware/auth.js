/**
 * Middleware de Autenticación - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Proporciona middleware para verificar tokens JWT, autorización por roles
 * y protección de rutas según permisos de usuario
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { USER_ROLES, ERROR_MESSAGES } = require('../utils/constants');
const config = require('../config/environment');
const { logger } = require('../utils/logger');

/**
 * Middleware para verificar token JWT
 * Extrae el token del header Authorization y verifica su validez
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : null;

        if (!token) {
            logger.warn('Intento de acceso sin token', {
                ip: req.ip,
                url: req.originalUrl,
                userAgent: req.get('User-Agent')
            });
            
            return res.status(401).json({
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
                error: 'Token de acceso requerido'
            });
        }

        // Verificar y decodificar el token
        const decoded = jwt.verify(token, config.jwt.secret);
        
        // Buscar el usuario en la base de datos
        const user = await User.findByPk(decoded.userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            logger.warn('Token válido pero usuario no encontrado', {
                userId: decoded.userId,
                ip: req.ip
            });
            
            return res.status(401).json({
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
                error: 'Usuario no encontrado'
            });
        }

        // Verificar si el usuario está activo
        if (!user.is_active) {
            logger.warn('Intento de acceso con usuario inactivo', {
                userId: user.id,
                email: user.email,
                ip: req.ip
            });
            
            return res.status(401).json({
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
                error: 'Cuenta inactiva'
            });
        }

        // Verificar si la cuenta está bloqueada
        if (user.isLocked()) {
            logger.warn('Intento de acceso con cuenta bloqueada', {
                userId: user.id,
                email: user.email,
                lockedUntil: user.locked_until,
                ip: req.ip
            });
            
            return res.status(401).json({
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
                error: 'Cuenta temporalmente bloqueada'
            });
        }

        // Agregar información del usuario a la request
        req.user = user;
        req.token = token;
        
        logger.debug('Usuario autenticado exitosamente', {
            userId: user.id,
            email: user.email,
            role: user.role
        });

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            logger.warn('Token JWT inválido', {
                error: error.message,
                ip: req.ip
            });
            
            return res.status(401).json({
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
                error: 'Token inválido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            logger.warn('Token JWT expirado', {
                expiredAt: error.expiredAt,
                ip: req.ip
            });
            
            return res.status(401).json({
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
                error: 'Token expirado'
            });
        }

        logger.error('Error en autenticación', error, {
            ip: req.ip,
            url: req.originalUrl
        });
        
        return res.status(500).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR,
            error: 'Error interno de autenticación'
        });
    }
};

/**
 * Middleware para autorizar roles específicos
 * Permite crear middleware dinámico para diferentes roles
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            // Verificar que el usuario esté autenticado
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: ERROR_MESSAGES.UNAUTHORIZED,
                    error: 'Usuario no autenticado'
                });
            }

            // Verificar que el usuario tenga un rol permitido
            if (!allowedRoles.includes(req.user.role)) {
                logger.warn('Acceso denegado por rol insuficiente', {
                    userId: req.user.id,
                    userRole: req.user.role,
                    requiredRoles: allowedRoles,
                    url: req.originalUrl,
                    ip: req.ip
                });
                
                return res.status(403).json({
                    success: false,
                    message: ERROR_MESSAGES.FORBIDDEN,
                    error: 'Permisos insuficientes para acceder a este recurso'
                });
            }

            logger.debug('Autorización exitosa', {
                userId: req.user.id,
                role: req.user.role,
                url: req.originalUrl
            });

            next();
        } catch (error) {
            logger.error('Error en autorización', error, {
                userId: req.user?.id,
                url: req.originalUrl,
                ip: req.ip
            });
            
            return res.status(500).json({
                success: false,
                message: ERROR_MESSAGES.SERVER_ERROR,
                error: 'Error interno de autorización'
            });
        }
    };
};

/**
 * Middleware específico para administradores
 */
const requireAdmin = authorizeRoles(USER_ROLES.ADMIN);

/**
 * Middleware específico para gerencia (incluye admin)
 */
const requireManager = authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.MANAGER);

/**
 * Middleware específico para personal del hotel (no incluye huéspedes)
 */
const requireStaff = authorizeRoles(
    USER_ROLES.ADMIN, 
    USER_ROLES.MANAGER, 
    USER_ROLES.RECEPTIONIST, 
    USER_ROLES.CLEANING
);

/**
 * Middleware específico para recepcionistas y superiores
 */
const requireReceptionist = authorizeRoles(
    USER_ROLES.ADMIN, 
    USER_ROLES.MANAGER, 
    USER_ROLES.RECEPTIONIST
);

/**
 * Middleware para verificar que el usuario puede acceder a sus propios datos
 * o es staff autorizado
 */
const requireOwnershipOrStaff = (req, res, next) => {
    try {
        const { userId } = req.params;
        const currentUser = req.user;

        // Si es el mismo usuario o es staff, permitir acceso
        if (currentUser.id === userId || currentUser.isStaff()) {
            return next();
        }

        logger.warn('Intento de acceso no autorizado a datos de usuario', {
            currentUserId: currentUser.id,
            targetUserId: userId,
            ip: req.ip
        });

        return res.status(403).json({
            success: false,
            message: ERROR_MESSAGES.FORBIDDEN,
            error: 'No tiene permisos para acceder a estos datos'
        });
    } catch (error) {
        logger.error('Error verificando ownership', error);
        return res.status(500).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * Middleware para verificar que el usuario puede acceder a una reserva específica
 */
const requireReservationAccess = async (req, res, next) => {
    try {
        const { reservationId } = req.params;
        const currentUser = req.user;

        // Si es staff, permitir acceso completo
        if (currentUser.isStaff()) {
            return next();
        }

        // Si es huésped, verificar que la reserva le pertenece
        const Reservation = require('../models/Reservation');
        const Guest = require('../models/Guest');
        
        const reservation = await Reservation.findByPk(reservationId, {
            include: [{
                model: Guest,
                as: 'guest'
            }]
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: ERROR_MESSAGES.NOT_FOUND,
                error: 'Reserva no encontrada'
            });
        }

        // Verificar si el huésped es el mismo usuario actual
        if (reservation.guest.email !== currentUser.email) {
            logger.warn('Intento de acceso no autorizado a reserva', {
                userId: currentUser.id,
                reservationId: reservationId,
                ip: req.ip
            });

            return res.status(403).json({
                success: false,
                message: ERROR_MESSAGES.FORBIDDEN,
                error: 'No tiene permisos para acceder a esta reserva'
            });
        }

        req.reservation = reservation;
        next();
    } catch (error) {
        logger.error('Error verificando acceso a reserva', error);
        return res.status(500).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * Middleware opcional de autenticación
 * Intenta autenticar pero no falla si no hay token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : null;

        if (token) {
            const decoded = jwt.verify(token, config.jwt.secret);
            const user = await User.findByPk(decoded.userId, {
                attributes: { exclude: ['password'] }
            });

            if (user && user.is_active && !user.isLocked()) {
                req.user = user;
                req.token = token;
            }
        }

        next();
    } catch (error) {
        // En caso de error, simplemente continuar sin usuario autenticado
        next();
    }
};

/**
 * Middleware para generar token JWT
 * Función utilitaria para crear tokens
 */
const generateToken = (userId, userRole = null) => {
    const payload = {
        userId,
        role: userRole,
        iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
    });
};

/**
 * Middleware para verificar token de reset de contraseña
 */
const verifyResetToken = async (req, res, next) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token de reset requerido'
            });
        }

        const user = await User.findOne({
            where: {
                password_reset_token: token,
                password_reset_expires: {
                    [require('sequelize').Op.gt]: new Date()
                }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token de reset inválido o expirado'
            });
        }

        req.user = user;
        req.resetToken = token;
        next();
    } catch (error) {
        logger.error('Error verificando token de reset', error);
        return res.status(500).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * Middleware para limitar intentos de login por IP
 * CORREGIDO: Eliminado keyGenerator personalizado para evitar problema IPv6
 */
const loginRateLimit = require('express-rate-limit')({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMaxAttempts,
    message: {
        success: false,
        message: 'Demasiados intentos de login. Intente de nuevo más tarde.',
        retryAfter: Math.ceil(config.security.rateLimitWindowMs / 1000 / 60)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // CORREGIDO: Eliminado keyGenerator personalizado que causaba problemas con IPv6
    // keyGenerator: (req) => {
    //     return req.ip + ':' + (req.body.email || req.body.username || 'unknown');
    // },
    // Handler cuando se excede el límite
    handler: (req, res) => {
        logger.warn('Rate limit excedido en login', {
            ip: req.ip,
            email: req.body.email,
            username: req.body.username
        });
        
        res.status(429).json({
            success: false,
            message: 'Demasiados intentos de login. Intente de nuevo más tarde.',
            retryAfter: Math.ceil(config.security.rateLimitWindowMs / 1000 / 60)
        });
    }
});

module.exports = {
    authenticateToken,
    authorizeRoles,
    requireAdmin,
    requireManager,
    requireStaff,
    requireReceptionist,
    requireOwnershipOrStaff,
    requireReservationAccess,
    optionalAuth,
    generateToken,
    verifyResetToken,
    loginRateLimit
};