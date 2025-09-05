/**
 * Rutas de Incidencias - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Define todas las rutas relacionadas con incidencias:
 * reporte, asignación, seguimiento y resolución
 */

const express = require('express');
const router = express.Router();

// Importar controladores y middleware
const incidentController = require('../controllers/incidentController');
const { 
    authenticateToken,
    requireStaff,
    requireManager,
    requireReceptionist
} = require('../middleware/auth');
const { 
    validateCreateIncident,
    validatePagination,
    validateDateRange,
    validateUUIDParam,
    handleValidationErrors
} = require('../middleware/validation');

/**
 * @route   GET /api/incidents
 * @desc    Obtener todas las incidencias con filtros
 * @access  Private - Staff only
 * @query   { page?, limit?, status?, priority?, incident_type?, room_id?, assigned_to?, area?, affects_safety?, affects_guest_experience?, search? }
 */
router.get('/',
    authenticateToken,
    requireStaff,
    validatePagination,
    incidentController.getAllIncidents
);

/**
 * @route   GET /api/incidents/my
 * @desc    Obtener incidencias asignadas al usuario actual
 * @access  Private - Staff only
 * @query   { status? }
 */
router.get('/my',
    authenticateToken,
    requireStaff,
    incidentController.getMyIncidents
);

/**
 * @route   GET /api/incidents/stats
 * @desc    Obtener estadísticas de incidencias
 * @access  Private - Staff only
 * @query   { start_date?, end_date? }
 */
router.get('/stats',
    authenticateToken,
    requireStaff,
    validateDateRange,
    incidentController.getIncidentStats
);

/**
 * @route   GET /api/incidents/:id
 * @desc    Obtener una incidencia específica
 * @access  Private - Staff only
 */
router.get('/:id',
    authenticateToken,
    requireStaff,
    validateUUIDParam('id'),
    incidentController.getIncidentById
);

/**
 * @route   POST /api/incidents
 * @desc    Crear nueva incidencia
 * @access  Private - Staff only
 * @body    { title, description, incident_type, priority?, room_id?, location?, affects_guest_experience?, affects_safety? }
 */
router.post('/',
    authenticateToken,
    requireStaff,
    validateCreateIncident,
    incidentController.createIncident
);

/**
 * @route   PUT /api/incidents/:id
 * @desc    Actualizar incidencia existente
 * @access  Private - Staff only
 * @body    { title?, description?, priority?, location?, estimated_cost?, internal_notes? }
 */
router.put('/:id',
    authenticateToken,
    requireStaff,
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('title')
            .optional()
            .isLength({ min: 5, max: 200 })
            .withMessage('El título debe tener entre 5 y 200 caracteres'),
        require('express-validator').body('description')
            .optional()
            .isLength({ min: 10, max: 2000 })
            .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
        require('express-validator').body('priority')
            .optional()
            .isIn(['low', 'medium', 'high', 'urgent'])
            .withMessage('Prioridad inválida'),
        require('express-validator').body('estimated_cost')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('El costo estimado debe ser un número positivo'),
        handleValidationErrors
    ],
    incidentController.updateIncident
);

/**
 * @route   POST /api/incidents/:id/assign
 * @desc    Asignar incidencia a un usuario
 * @access  Private - Receptionist or higher
 * @body    { assigned_to_user_id }
 */
router.post('/:id/assign',
    authenticateToken,
    requireReceptionist,
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('assigned_to_user_id')
            .notEmpty()
            .withMessage('ID del usuario asignado requerido')
            .isUUID()
            .withMessage('ID de usuario debe ser UUID válido'),
        handleValidationErrors
    ],
    incidentController.assignIncident
);

/**
 * @route   POST /api/incidents/:id/start-work
 * @desc    Iniciar trabajo en una incidencia
 * @access  Private - Staff only (debe ser el asignado o manager)
 */
router.post('/:id/start-work',
    authenticateToken,
    requireStaff,
    validateUUIDParam('id'),
    incidentController.startWork
);

/**
 * @route   POST /api/incidents/:id/resolve
 * @desc    Resolver una incidencia
 * @access  Private - Staff only (debe ser el asignado o manager)
 * @body    { resolution_description, actual_cost?, materials_used?, hours_worked?, after_photos?, preventive_action? }
 */
router.post('/:id/resolve',
    authenticateToken,
    requireStaff,
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('resolution_description')
            .notEmpty()
            .withMessage('Descripción de resolución requerida')
            .isLength({ min: 10, max: 2000 })
            .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
        require('express-validator').body('actual_cost')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('El costo real debe ser un número positivo'),
        require('express-validator').body('hours_worked')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Las horas trabajadas deben ser un número positivo'),
        require('express-validator').body('materials_used')
            .optional()
            .isArray()
            .withMessage('Los materiales usados deben ser un array'),
        require('express-validator').body('after_photos')
            .optional()
            .isArray()
            .withMessage('Las fotos después deben ser un array'),
        handleValidationErrors
    ],
    incidentController.resolveIncident
);

/**
 * @route   POST /api/incidents/:id/cancel
 * @desc    Cancelar una incidencia
 * @access  Private - Manager only
 * @body    { reason }
 */
router.post('/:id/cancel',
    authenticateToken,
    requireManager,
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('reason')
            .notEmpty()
            .withMessage('Razón de cancelación requerida')
            .isLength({ min: 5, max: 500 })
            .withMessage('La razón debe tener entre 5 y 500 caracteres'),
        handleValidationErrors
    ],
    incidentController.cancelIncident
);

/**
 * @route   POST /api/incidents/:id/follow-up
 * @desc    Agregar seguimiento a una incidencia
 * @access  Private - Staff only
 * @body    { notes, next_follow_up_date? }
 */
router.post('/:id/follow-up',
    authenticateToken,
    requireStaff,
    [
        ...validateUUIDParam('id'),
        require('express-validator').body('notes')
            .notEmpty()
            .withMessage('Notas de seguimiento requeridas')
            .isLength({ min: 5, max: 1000 })
            .withMessage('Las notas deben tener entre 5 y 1000 caracteres'),
        require('express-validator').body('next_follow_up_date')
            .optional()
            .isISO8601()
            .withMessage('Fecha de seguimiento inválida'),
        handleValidationErrors
    ],
    incidentController.addFollowUp
);

/**
 * @route   GET /api/incidents/room/:roomId
 * @desc    Obtener incidencias por habitación
 * @access  Private - Staff only
 * @query   { include_resolved? }
 */
router.get('/room/:roomId',
    authenticateToken,
    requireStaff,
    [
        require('express-validator').param('roomId')
            .isUUID()
            .withMessage('ID de habitación debe ser UUID válido'),
        require('express-validator').query('include_resolved')
            .optional()
            .isBoolean()
            .withMessage('include_resolved debe ser boolean'),
        handleValidationErrors
    ],
    incidentController.getIncidentsByRoom
);

module.exports = router;