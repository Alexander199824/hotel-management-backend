/**
 * Rutas de Huéspedes - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Define todas las rutas relacionadas con huéspedes:
 * registro, consulta, actualización, historial y gestión de estatus
 */

const express = require('express');
const router = express.Router();

// Importar controladores
const guestController = require('../controllers/guestController');

// Importar middlewares
const { 
    authenticateToken, 
    requireStaff, 
    requireManager,
    requireOwnershipOrStaff 
} = require('../middleware/auth');

const {
    validateCreateGuest,
    validatePagination,
    validateUUIDParam,
    handleValidationErrors
} = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * GET /api/guests
 * Obtener todos los huéspedes con filtros y paginación
 * Acceso: Staff
 */
router.get('/', 
    requireStaff,
    [
        ...validatePagination,
        require('express-validator').query('search')
            .optional({ values: 'falsy' })
            .isLength({ min: 2 })
            .withMessage('La búsqueda debe tener al menos 2 caracteres'),
        require('express-validator').query('nationality')
            .optional({ values: 'falsy' })
            .isLength({ min: 2, max: 3 })
            .withMessage('Código de nacionalidad debe tener 2 o 3 caracteres'),
        require('express-validator').query('vip_status')
            .optional({ values: 'falsy' })
            .isBoolean()
            .withMessage('VIP status debe ser boolean'),
        require('express-validator').query('min_stays')
            .optional({ values: 'falsy' })
            .isInt({ min: 1 })
            .withMessage('Número mínimo de estadías debe ser positivo'),
        require('express-validator').query('sort_by')
            .optional({ values: 'falsy' })
            .isIn(['created_at', 'last_name', 'total_stays', 'total_spent', 'last_stay_date'])
            .withMessage('Campo de ordenamiento inválido'),
        require('express-validator').query('sort_order')
            .optional({ values: 'falsy' })
            .isIn(['ASC', 'DESC'])
            .withMessage('Orden debe ser ASC o DESC'),
        handleValidationErrors
    ],
    guestController.getAllGuests
);

/**
 * POST /api/guests
 * Crear nuevo huésped
 * Acceso: Staff
 */
router.post('/', 
    requireStaff,
    validateCreateGuest,
    guestController.createGuest
);

/**
 * GET /api/guests/me
 * Obtener o crear el perfil de huésped del usuario autenticado
 * Acceso: Guest (solo su propio perfil)
 */
router.get('/me',
    guestController.getOrCreateMyProfile
);

/**
 * GET /api/guests/search
 * Buscar huéspedes por nombre o email
 * Acceso: Staff
 */
router.get('/search',
    requireStaff,
    [
        require('express-validator').query('query')
            .notEmpty()
            .withMessage('Parámetro de búsqueda requerido')
            .isLength({ min: 2 })
            .withMessage('La búsqueda debe tener al menos 2 caracteres'),
        handleValidationErrors
    ],
    guestController.searchGuests
);

/**
 * GET /api/guests/stats
 * Obtener estadísticas de huéspedes
 * Acceso: Staff
 */
router.get('/stats', 
    requireStaff,
    guestController.getGuestStats
);

/**
 * GET /api/guests/:id
 * Obtener huésped específico por ID
 * Acceso: Staff o el mismo huésped
 */
router.get('/:id', 
    validateUUIDParam('id'),
    requireOwnershipOrStaff,
    guestController.getGuestById
);

/**
 * PUT /api/guests/:id
 * Actualizar huésped existente
 * Acceso: Staff o el mismo huésped (con limitaciones)
 */
router.put('/:id', 
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('first_name')
            .optional({ values: 'falsy' })
            .isLength({ min: 2, max: 50 })
            .withMessage('El nombre debe tener entre 2 y 50 caracteres')
            .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
            .withMessage('El nombre solo puede contener letras'),
        require('express-validator').body('last_name')
            .optional({ values: 'falsy' })
            .isLength({ min: 2, max: 50 })
            .withMessage('El apellido debe tener entre 2 y 50 caracteres')
            .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
            .withMessage('El apellido solo puede contener letras'),
        require('express-validator').body('phone')
            .optional({ values: 'falsy' })
            .matches(/^\+?[\d\s\-\(\)]+$/)
            .withMessage('Formato de teléfono inválido'),
        require('express-validator').body('alternative_phone')
            .optional({ values: 'falsy' })
            .matches(/^\+?[\d\s\-\(\)]+$/)
            .withMessage('Formato de teléfono alternativo inválido'),
        require('express-validator').body('date_of_birth')
            .optional({ values: 'falsy' })
            .isISO8601()
            .withMessage('Fecha de nacimiento inválida')
            .custom(value => {
                if (new Date(value) >= new Date()) {
                    throw new Error('La fecha de nacimiento debe ser anterior a hoy');
                }
                return true;
            }),
        require('express-validator').body('gender')
            .optional({ values: 'falsy' })
            .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
            .withMessage('Género inválido'),
        require('express-validator').body('nationality')
            .optional({ values: 'falsy' })
            .isLength({ min: 2, max: 3 })
            .withMessage('Código de nacionalidad debe tener 2 o 3 caracteres'),
        require('express-validator').body('language')
            .optional({ values: 'falsy' })
            .isIn(['es', 'en', 'fr', 'de', 'pt'])
            .withMessage('Idioma no soportado'),
        require('express-validator').body('dietary_restrictions')
            .optional({ values: 'falsy' })
            .isArray()
            .withMessage('Restricciones dietéticas deben ser un array'),
        require('express-validator').body('special_needs')
            .optional({ values: 'falsy' })
            .isLength({ max: 1000 })
            .withMessage('Necesidades especiales no pueden exceder 1000 caracteres'),
        require('express-validator').body('newsletter_subscription')
            .optional({ values: 'falsy' })
            .isBoolean()
            .withMessage('Suscripción a newsletter debe ser boolean'),
        require('express-validator').body('marketing_emails')
            .optional({ values: 'falsy' })
            .isBoolean()
            .withMessage('Emails de marketing debe ser boolean'),
        handleValidationErrors
    ],
    requireOwnershipOrStaff,
    guestController.updateGuest
);

/**
 * GET /api/guests/:id/history
 * Obtener historial completo de un huésped
 * Acceso: Staff
 */
router.get('/:id/history', 
    requireStaff,
    [
        ...validateUUIDParam('id'),
        ...validatePagination,
        handleValidationErrors
    ],
    guestController.getGuestHistory
);

/**
 * POST /api/guests/:id/promote-vip
 * Promover huésped a estatus VIP
 * Acceso: Managers
 */
router.post('/:id/promote-vip', 
    requireManager,
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('reason')
            .optional({ values: 'falsy' })
            .isLength({ max: 500 })
            .withMessage('La razón no puede exceder 500 caracteres'),
        handleValidationErrors
    ],
    guestController.promoteToVIP
);

/**
 * POST /api/guests/:id/remove-vip
 * Remover estatus VIP de un huésped
 * Acceso: Managers
 */
router.post('/:id/remove-vip', 
    requireManager,
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('reason')
            .optional({ values: 'falsy' })
            .isLength({ max: 500 })
            .withMessage('La razón no puede exceder 500 caracteres'),
        handleValidationErrors
    ],
    guestController.removeVIPStatus
);

/**
 * POST /api/guests/:id/blacklist
 * Agregar huésped a lista negra
 * Acceso: Managers
 */
router.post('/:id/blacklist', 
    requireManager,
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('reason')
            .notEmpty()
            .withMessage('Razón requerida para agregar a lista negra')
            .isLength({ min: 10, max: 1000 })
            .withMessage('La razón debe tener entre 10 y 1000 caracteres'),
        handleValidationErrors
    ],
    guestController.addToBlacklist
);

/**
 * POST /api/guests/:id/remove-blacklist
 * Remover huésped de lista negra
 * Acceso: Managers
 */
router.post('/:id/remove-blacklist',
    requireManager,
    validateUUIDParam('id'),
    guestController.removeFromBlacklist
);

module.exports = router;
