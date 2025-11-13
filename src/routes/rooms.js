/**
 * Rutas de Habitaciones - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Define todas las rutas relacionadas con habitaciones:
 * consulta, creación, actualización, gestión de estado y disponibilidad
 */

const express = require('express');
const router = express.Router();

// Importar controladores
const roomController = require('../controllers/roomController');

// Importar middlewares
const { 
    authenticateToken, 
    requireStaff, 
    requireManager,
    optionalAuth 
} = require('../middleware/auth');

const {
    validateCreateRoom,
    validateUpdateRoom,
    validatePagination,
    validateUUIDParam,
    handleValidationErrors
} = require('../middleware/validation');

/**
 * GET /api/rooms
 * Obtener todas las habitaciones con filtros
 * Acceso: Público (con autenticación opcional para más detalles)
 */
router.get('/',
    optionalAuth,  // Autenticación opcional
    [
        ...validatePagination,
        require('express-validator').query('status')
            .optional({ values: 'falsy' })
            .isIn(['available', 'occupied', 'cleaning', 'maintenance', 'out_of_order'])
            .withMessage('Estado de habitación inválido'),
        require('express-validator').query('category')
            .optional({ values: 'falsy' })
            .isIn(['standard', 'deluxe', 'suite', 'presidential'])
            .withMessage('Categoría de habitación inválida'),
        require('express-validator').query('floor')
            .optional({ values: 'falsy' })
            .isInt({ min: 1, max: 50 })
            .withMessage('Piso debe ser un número entre 1 y 50'),
        require('express-validator').query('min_capacity')
            .optional({ values: 'falsy' })
            .isInt({ min: 1, max: 10 })
            .withMessage('Capacidad mínima debe ser entre 1 y 10'),
        require('express-validator').query('max_price')
            .optional({ values: 'falsy' })
            .isFloat({ min: 0 })
            .withMessage('Precio máximo debe ser un número positivo'),
        require('express-validator').query('available_only')
            .optional({ values: 'falsy' })
            .isBoolean()
            .withMessage('available_only debe ser boolean'),
        handleValidationErrors
    ],
    roomController.getAllRooms
);

/**
 * POST /api/rooms
 * Crear nueva habitación
 * Acceso: Managers
 */
router.post('/', 
    authenticateToken,
    requireManager,
    validateCreateRoom,
    roomController.createRoom
);

/**
 * GET /api/rooms/search
 * Buscar habitaciones disponibles por criterios específicos
 * Acceso: Público
 */
router.get('/search', 
    [
        require('express-validator').query('check_in_date')
            .notEmpty()
            .withMessage('Fecha de check-in requerida')
            .isISO8601()
            .withMessage('Fecha de check-in inválida'),
        require('express-validator').query('check_out_date')
            .notEmpty()
            .withMessage('Fecha de check-out requerida')
            .isISO8601()
            .withMessage('Fecha de check-out inválida'),
        require('express-validator').query('capacity')
            .optional()
            .isInt({ min: 1, max: 10 })
            .withMessage('Capacidad debe ser entre 1 y 10'),
        require('express-validator').query('category')
            .optional()
            .isIn(['standard', 'deluxe', 'suite', 'presidential'])
            .withMessage('Categoría inválida'),
        require('express-validator').query('max_price')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Precio máximo debe ser positivo'),
        handleValidationErrors
    ],
    roomController.searchAvailableRooms
);

/**
 * GET /api/rooms/stats
 * Obtener estadísticas de habitaciones
 * Acceso: Staff
 */
router.get('/stats', 
    authenticateToken,
    requireStaff,
    roomController.getRoomStats
);

/**
 * GET /api/rooms/:id
 * Obtener habitación específica por ID
 * Acceso: Público (con autenticación opcional para más detalles)
 */
router.get('/:id', 
    optionalAuth,
    validateUUIDParam('id'),
    roomController.getRoomById
);

/**
 * PUT /api/rooms/:id
 * Actualizar habitación existente
 * Acceso: Managers
 */
router.put('/:id', 
    authenticateToken,
    requireManager,
    validateUUIDParam('id'),
    validateUpdateRoom,
    roomController.updateRoom
);

/**
 * PATCH /api/rooms/:id/status
 * Cambiar estado de una habitación
 * Acceso: Staff
 */
router.patch('/:id/status', 
    authenticateToken,
    requireStaff,
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('status')
            .notEmpty()
            .withMessage('Estado requerido')
            .isIn(['available', 'occupied', 'cleaning', 'maintenance', 'out_of_order'])
            .withMessage('Estado de habitación inválido'),
        require('express-validator').body('notes')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Las notas no pueden exceder 1000 caracteres'),
        handleValidationErrors
    ],
    roomController.changeRoomStatus
);

/**
 * POST /api/rooms/:id/out-of-order
 * Marcar habitación como fuera de servicio
 * Acceso: Staff
 */
router.post('/:id/out-of-order', 
    authenticateToken,
    requireStaff,
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('reason')
            .notEmpty()
            .withMessage('Razón requerida')
            .isLength({ min: 5, max: 500 })
            .withMessage('La razón debe tener entre 5 y 500 caracteres'),
        handleValidationErrors
    ],
    roomController.setOutOfOrder
);

/**
 * POST /api/rooms/:id/in-service
 * Poner habitación en servicio
 * Acceso: Staff
 */
router.post('/:id/in-service', 
    authenticateToken,
    requireStaff,
    validateUUIDParam('id'),
    roomController.setInService
);

/**
 * GET /api/rooms/:id/calendar
 * Obtener calendario de ocupación de una habitación
 * Acceso: Staff
 */
router.get('/:id/calendar', 
    authenticateToken,
    requireStaff,
    [
        ...validateUUIDParam('id'),
        require('express-validator').query('start_date')
            .optional()
            .isISO8601()
            .withMessage('Fecha de inicio inválida'),
        require('express-validator').query('end_date')
            .optional()
            .isISO8601()
            .withMessage('Fecha de fin inválida'),
        handleValidationErrors
    ],
    roomController.getRoomCalendar
);

/**
 * POST /api/rooms/:id/schedule-maintenance
 * Programar mantenimiento para una habitación
 * Acceso: Staff
 */
router.post('/:id/schedule-maintenance', 
    authenticateToken,
    requireStaff,
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('maintenance_date')
            .notEmpty()
            .withMessage('Fecha de mantenimiento requerida')
            .isISO8601()
            .withMessage('Fecha de mantenimiento inválida')
            .custom(value => {
                if (new Date(value) <= new Date()) {
                    throw new Error('La fecha de mantenimiento debe ser futura');
                }
                return true;
            }),
        require('express-validator').body('notes')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Las notas no pueden exceder 1000 caracteres'),
        handleValidationErrors
    ],
    roomController.scheduleMaintenanceWork
);

module.exports = router;