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
    validateUUIDParam
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
    validateUUIDParam('id'),
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
    validateUUIDParam('id'),
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
 * @body    { resolution_description, actual_cost?, materials_used?, hours_worked?, after_photos?, preventive_action?, follow_up_required?, follow_up_date? }
 */
router.post('/:id/resolve',
    authenticateToken,
    requireStaff,
    validateUUIDParam('id'),
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
    validateUUIDParam('id'),
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
    validateUUIDParam('id'),
    incidentController.addFollowUp
);

/**
 * @route   POST /api/incidents/:id/rating
 * @desc    Agregar calificación de satisfacción
 * @access  Private - Staff only
 * @body    { rating, feedback? }
 */
router.post('/:id/rating',
    authenticateToken,
    requireStaff,
    validateUUIDParam('id'),
    incidentController.addSatisfactionRating
);

module.exports = router;