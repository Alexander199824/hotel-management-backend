/**
 * Rutas de Reservas - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Define todas las rutas relacionadas con reservas:
 * creación, consulta, modificación, check-in/check-out y cancelación
 */

const express = require('express');
const router = express.Router();

// Importar controladores
const reservationController = require('../controllers/reservationController');

// Importar middlewares
const { 
    authenticateToken, 
    requireStaff, 
    requireReceptionist,
    requireReservationAccess 
} = require('../middleware/auth');

const {
    validateCreateReservation,
    validatePagination,
    validateDateRange,
    validateUUIDParam,
    validateRoomAvailability,
    handleValidationErrors
} = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * GET /api/reservations
 * Obtener todas las reservas con filtros y paginación
 * Acceso: Staff
 */
router.get('/', 
    requireStaff,
    [
        ...validatePagination,
        ...validateDateRange,
        require('express-validator').query('status')
            .optional()
            .isIn(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'])
            .withMessage('Estado de reserva inválido'),
        require('express-validator').query('guest_id')
            .optional()
            .isUUID()
            .withMessage('ID de huésped debe ser UUID válido'),
        require('express-validator').query('room_id')
            .optional()
            .isUUID()
            .withMessage('ID de habitación debe ser UUID válido'),
        handleValidationErrors
    ],
    reservationController.getAllReservations
);

/**
 * POST /api/reservations
 * Crear nueva reserva
 * Acceso: Staff y huéspedes (huéspedes solo pueden crear sus propias reservas)
 */
router.post('/', 
    [
        ...validateCreateReservation,
        validateRoomAvailability
    ],
    reservationController.createReservation
);

/**
 * GET /api/reservations/search
 * Buscar reservas por código o datos del huésped
 * Acceso: Staff
 */
router.get('/search', 
    requireStaff,
    [
        require('express-validator').query('query')
            .notEmpty()
            .withMessage('Parámetro de búsqueda requerido')
            .isLength({ min: 3 })
            .withMessage('La búsqueda debe tener al menos 3 caracteres'),
        handleValidationErrors
    ],
    reservationController.searchReservations
);

/**
 * GET /api/reservations/stats
 * Obtener estadísticas de reservas
 * Acceso: Staff
 */
router.get('/stats', 
    requireStaff,
    validateDateRange,
    reservationController.getReservationStats
);

/**
 * GET /api/reservations/:id
 * Obtener reserva específica por ID
 * Acceso: Staff o propietario de la reserva
 */
router.get('/:id', 
    validateUUIDParam('id'),
    requireReservationAccess,  // Verificar permisos de acceso
    reservationController.getReservationById
);

/**
 * PUT /api/reservations/:id
 * Actualizar reserva existente
 * Acceso: Staff o propietario de la reserva (con limitaciones)
 */
router.put('/:id', 
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('check_in_date')
            .optional()
            .isISO8601()
            .withMessage('Fecha de check-in inválida'),
        require('express-validator').body('check_out_date')
            .optional()
            .isISO8601()
            .withMessage('Fecha de check-out inválida'),
        require('express-validator').body('adults_count')
            .optional()
            .isInt({ min: 1, max: 10 })
            .withMessage('Número de adultos debe ser entre 1 y 10'),
        require('express-validator').body('children_count')
            .optional()
            .isInt({ min: 0, max: 10 })
            .withMessage('Número de niños debe ser entre 0 y 10'),
        require('express-validator').body('special_requests')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Solicitudes especiales no pueden exceder 1000 caracteres'),
        handleValidationErrors
    ],
    requireReservationAccess,
    reservationController.updateReservation
);

/**
 * POST /api/reservations/:id/confirm
 * Confirmar una reserva pendiente
 * Acceso: Staff
 */
router.post('/:id/confirm', 
    validateUUIDParam('id'),
    requireReceptionist,
    reservationController.confirmReservation
);

/**
 * POST /api/reservations/:id/cancel
 * Cancelar una reserva
 * Acceso: Staff o propietario de la reserva
 */
router.post('/:id/cancel', 
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('reason')
            .notEmpty()
            .withMessage('Razón de cancelación requerida')
            .isLength({ min: 5, max: 500 })
            .withMessage('La razón debe tener entre 5 y 500 caracteres'),
        handleValidationErrors
    ],
    requireReservationAccess,
    reservationController.cancelReservation
);

/**
 * POST /api/reservations/:id/checkin
 * Realizar check-in de una reserva
 * Acceso: Staff de recepción
 */
router.post('/:id/checkin', 
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('notes')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Las notas no pueden exceder 1000 caracteres'),
        handleValidationErrors
    ],
    requireReceptionist,
    reservationController.checkIn
);

/**
 * POST /api/reservations/:id/checkout
 * Realizar check-out de una reserva
 * Acceso: Staff de recepción
 */
router.post('/:id/checkout', 
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('notes')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Las notas no pueden exceder 1000 caracteres'),
        require('express-validator').body('generate_invoice')
            .optional()
            .isBoolean()
            .withMessage('generate_invoice debe ser boolean'),
        handleValidationErrors
    ],
    requireReceptionist,
    reservationController.checkOut
);

module.exports = router;