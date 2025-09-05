/**
 * Middleware de Validación - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Proporciona validaciones para diferentes endpoints usando express-validator
 * Incluye validaciones para usuarios, reservas, habitaciones y servicios
 */

const { body, param, query, validationResult } = require('express-validator');
const { USER_ROLES, ROOM_CATEGORIES, ROOM_STATUS, SERVICE_TYPES, VALIDATION } = require('../utils/constants');
const { logger } = require('../utils/logger');

/**
 * Middleware para manejar errores de validación
 * Debe ejecutarse después de las validaciones
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        logger.warn('Errores de validación', {
            errors: errors.array(),
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });
        
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    
    next();
};

/**
 * Validaciones para autenticación
 */
const validateLogin = [
    body('credential')
        .notEmpty()
        .withMessage('Email o nombre de usuario requerido')
        .isLength({ min: 3, max: 100 })
        .withMessage('El credential debe tener entre 3 y 100 caracteres'),
    
    body('password')
        .notEmpty()
        .withMessage('Contraseña requerida')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    
    handleValidationErrors
];

const validateRegister = [
    body('first_name')
        .notEmpty()
        .withMessage('Nombre requerido')
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras'),
    
    body('last_name')
        .notEmpty()
        .withMessage('Apellido requerido')
        .isLength({ min: 2, max: 50 })
        .withMessage('El apellido debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El apellido solo puede contener letras'),
    
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('El email no puede exceder 100 caracteres'),
    
    body('username')
        .isLength({ min: VALIDATION.USERNAME_MIN_LENGTH, max: VALIDATION.USERNAME_MAX_LENGTH })
        .withMessage(`El username debe tener entre ${VALIDATION.USERNAME_MIN_LENGTH} y ${VALIDATION.USERNAME_MAX_LENGTH} caracteres`)
        .isAlphanumeric()
        .withMessage('El username solo puede contener letras y números'),
    
    body('password')
        .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
        .withMessage(`La contraseña debe tener al menos ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`)
        .matches(VALIDATION.PASSWORD_REGEX)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
    
    body('phone')
        .optional()
        .matches(VALIDATION.PHONE_REGEX)
        .withMessage('Formato de teléfono inválido'),
    
    body('role')
        .optional()
        .isIn(Object.values(USER_ROLES))
        .withMessage('Rol inválido'),
    
    handleValidationErrors
];

/**
 * Validaciones para gestión de usuarios
 */
const validateUpdateUser = [
    param('id')
        .isUUID()
        .withMessage('ID de usuario inválido'),
    
    body('first_name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
    
    body('last_name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
    
    body('email')
        .optional()
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    
    body('phone')
        .optional()
        .matches(VALIDATION.PHONE_REGEX)
        .withMessage('Formato de teléfono inválido'),
    
    body('role')
        .optional()
        .isIn(Object.values(USER_ROLES))
        .withMessage('Rol inválido'),
    
    handleValidationErrors
];

/**
 * Validaciones para habitaciones
 */
const validateCreateRoom = [
    body('room_number')
        .notEmpty()
        .withMessage('Número de habitación requerido')
        .isLength({ min: 1, max: 10 })
        .withMessage('El número debe tener entre 1 y 10 caracteres'),
    
    body('category')
        .isIn(Object.values(ROOM_CATEGORIES))
        .withMessage('Categoría de habitación inválida'),
    
    body('floor')
        .isInt({ min: 1, max: 50 })
        .withMessage('El piso debe ser un número entre 1 y 50'),
    
    body('capacity')
        .isInt({ min: 1, max: 10 })
        .withMessage('La capacidad debe ser un número entre 1 y 10'),
    
    body('beds_count')
        .isInt({ min: 1, max: 5 })
        .withMessage('El número de camas debe ser entre 1 y 5'),
    
    body('base_price')
        .isFloat({ min: 0 })
        .withMessage('El precio base debe ser un número positivo'),
    
    body('currency')
        .optional()
        .isLength({ min: 3, max: 3 })
        .withMessage('La moneda debe tener exactamente 3 caracteres'),
    
    body('amenities')
        .optional()
        .isArray()
        .withMessage('Las amenidades deben ser un array'),
    
    handleValidationErrors
];

const validateUpdateRoom = [
    param('id')
        .isUUID()
        .withMessage('ID de habitación inválido'),
    
    body('status')
        .optional()
        .isIn(Object.values(ROOM_STATUS))
        .withMessage('Estado de habitación inválido'),
    
    body('base_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El precio base debe ser un número positivo'),
    
    body('capacity')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('La capacidad debe ser un número entre 1 y 10'),
    
    handleValidationErrors
];

/**
 * Validaciones para reservas
 */
const validateCreateReservation = [
    body('guest_id')
        .isUUID()
        .withMessage('ID de huésped inválido'),
    
    body('room_id')
        .isUUID()
        .withMessage('ID de habitación inválido'),
    
    body('check_in_date')
        .isISO8601()
        .withMessage('Fecha de check-in inválida')
        .custom(value => {
            const checkIn = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (checkIn < today) {
                throw new Error('La fecha de check-in no puede ser en el pasado');
            }
            return true;
        }),
    
    body('check_out_date')
        .isISO8601()
        .withMessage('Fecha de check-out inválida')
        .custom((value, { req }) => {
            const checkOut = new Date(value);
            const checkIn = new Date(req.body.check_in_date);
            
            if (checkOut <= checkIn) {
                throw new Error('La fecha de check-out debe ser posterior al check-in');
            }
            return true;
        }),
    
    body('adults_count')
        .isInt({ min: 1, max: 10 })
        .withMessage('El número de adultos debe ser entre 1 y 10'),
    
    body('children_count')
        .optional()
        .isInt({ min: 0, max: 10 })
        .withMessage('El número de niños debe ser entre 0 y 10'),
    
    body('special_requests')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Las solicitudes especiales no pueden exceder 1000 caracteres'),
    
    handleValidationErrors
];

/**
 * Validaciones para huéspedes
 */
const validateCreateGuest = [
    body('first_name')
        .notEmpty()
        .withMessage('Nombre requerido')
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
    
    body('last_name')
        .notEmpty()
        .withMessage('Apellido requerido')
        .isLength({ min: 2, max: 50 })
        .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
    
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    
    body('phone')
        .notEmpty()
        .withMessage('Teléfono requerido')
        .matches(VALIDATION.PHONE_REGEX)
        .withMessage('Formato de teléfono inválido'),
    
    body('document_type')
        .isIn(['passport', 'national_id', 'driver_license', 'other'])
        .withMessage('Tipo de documento inválido'),
    
    body('document_number')
        .notEmpty()
        .withMessage('Número de documento requerido')
        .isLength({ min: 5, max: 30 })
        .withMessage('El número de documento debe tener entre 5 y 30 caracteres'),
    
    body('document_country')
        .notEmpty()
        .withMessage('País del documento requerido')
        .isLength({ min: 2, max: 3 })
        .withMessage('El código de país debe tener 2 o 3 caracteres'),
    
    body('date_of_birth')
        .optional()
        .isISO8601()
        .withMessage('Fecha de nacimiento inválida')
        .custom(value => {
            const birthDate = new Date(value);
            const today = new Date();
            
            if (birthDate >= today) {
                throw new Error('La fecha de nacimiento debe ser anterior a hoy');
            }
            return true;
        }),
    
    handleValidationErrors
];

/**
 * Validaciones para servicios adicionales
 */
const validateCreateService = [
    body('reservation_id')
        .isUUID()
        .withMessage('ID de reserva inválido'),
    
    body('guest_id')
        .isUUID()
        .withMessage('ID de huésped inválido'),
    
    body('service_type')
        .isIn(Object.values(SERVICE_TYPES))
        .withMessage('Tipo de servicio inválido'),
    
    body('service_name')
        .notEmpty()
        .withMessage('Nombre del servicio requerido')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('service_date')
        .isISO8601()
        .withMessage('Fecha del servicio inválida'),
    
    body('quantity')
        .isFloat({ min: 0.01 })
        .withMessage('La cantidad debe ser mayor a 0'),
    
    body('unit_price')
        .isFloat({ min: 0 })
        .withMessage('El precio unitario debe ser un número positivo'),
    
    handleValidationErrors
];

/**
 * Validaciones para incidencias
 */
const validateCreateIncident = [
    body('title')
        .notEmpty()
        .withMessage('Título requerido')
        .isLength({ min: 5, max: 200 })
        .withMessage('El título debe tener entre 5 y 200 caracteres'),
    
    body('description')
        .notEmpty()
        .withMessage('Descripción requerida')
        .isLength({ min: 10, max: 2000 })
        .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
    
    body('incident_type')
        .isIn(['maintenance', 'cleaning', 'technical', 'security', 'other'])
        .withMessage('Tipo de incidencia inválido'),
    
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Prioridad inválida'),
    
    body('room_id')
        .optional()
        .isUUID()
        .withMessage('ID de habitación inválido'),
    
    body('location')
        .optional()
        .isLength({ max: 200 })
        .withMessage('La ubicación no puede exceder 200 caracteres'),
    
    handleValidationErrors
];

/**
 * Validaciones para parámetros de consulta comunes
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El número de página debe ser mayor a 0'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe ser entre 1 y 100'),
    
    handleValidationErrors
];

const validateDateRange = [
    query('start_date')
        .optional()
        .isISO8601()
        .withMessage('Fecha de inicio inválida'),
    
    query('end_date')
        .optional()
        .isISO8601()
        .withMessage('Fecha de fin inválida')
        .custom((value, { req }) => {
            if (req.query.start_date && value) {
                const startDate = new Date(req.query.start_date);
                const endDate = new Date(value);
                
                if (endDate <= startDate) {
                    throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
                }
            }
            return true;
        }),
    
    handleValidationErrors
];

/**
 * Validaciones para UUIDs en parámetros
 */
const validateUUIDParam = (paramName) => [
    param(paramName)
        .isUUID()
        .withMessage(`${paramName} debe ser un UUID válido`),
    
    handleValidationErrors
];

/**
 * Validación personalizada para verificar disponibilidad de habitación
 */
const validateRoomAvailability = async (req, res, next) => {
    try {
        const { room_id, check_in_date, check_out_date } = req.body;
        
        if (!room_id || !check_in_date || !check_out_date) {
            return next();
        }
        
        const Room = require('../models/Room');
        const Reservation = require('../models/Reservation');
        
        // Verificar que la habitación existe y está disponible
        const room = await Room.findByPk(room_id);
        if (!room) {
            return res.status(400).json({
                success: false,
                message: 'Habitación no encontrada'
            });
        }
        
        if (!room.isAvailable()) {
            return res.status(400).json({
                success: false,
                message: 'Habitación no disponible'
            });
        }
        
        // Verificar conflictos de fechas
        const conflictingReservations = await Reservation.findByDateRange(
            check_in_date, 
            check_out_date
        );
        
        const hasConflict = conflictingReservations.some(reservation => 
            reservation.room_id === room_id && 
            ['confirmed', 'checked_in'].includes(reservation.status)
        );
        
        if (hasConflict) {
            return res.status(400).json({
                success: false,
                message: 'La habitación no está disponible en las fechas seleccionadas'
            });
        }
        
        next();
    } catch (error) {
        logger.error('Error validando disponibilidad de habitación', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Validación para cambio de contraseña
 */
const validatePasswordChange = [
    body('current_password')
        .notEmpty()
        .withMessage('Contraseña actual requerida'),
    
    body('new_password')
        .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
        .withMessage(`La nueva contraseña debe tener al menos ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`)
        .matches(VALIDATION.PASSWORD_REGEX)
        .withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número'),
    
    body('confirm_password')
        .custom((value, { req }) => {
            if (value !== req.body.new_password) {
                throw new Error('Las contraseñas no coinciden');
            }
            return true;
        }),
    
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateLogin,
    validateRegister,
    validateUpdateUser,
    validateCreateRoom,
    validateUpdateRoom,
    validateCreateReservation,
    validateCreateGuest,
    validateCreateService,
    validateCreateIncident,
    validatePagination,
    validateDateRange,
    validateUUIDParam,
    validateRoomAvailability,
    validatePasswordChange
};