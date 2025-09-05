/**
 * Rutas de Reportes - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Define todas las rutas relacionadas con generación de reportes:
 * ocupación, ventas, huéspedes, financiero, incidencias y dashboard
 */

const express = require('express');
const router = express.Router();

// Importar controladores
const reportController = require('../controllers/reportController');

// Importar middlewares
const { 
    authenticateToken, 
    requireStaff, 
    requireManager 
} = require('../middleware/auth');

const {
    validateDateRange,
    handleValidationErrors
} = require('../middleware/validation');

// Todas las rutas requieren autenticación de staff
router.use(authenticateToken, requireStaff);

/**
 * GET /api/reports
 * Obtener lista de reportes disponibles
 * Acceso: Staff
 */
router.get('/', 
    reportController.getAvailableReports
);

/**
 * GET /api/reports/dashboard
 * Obtener dashboard con métricas principales
 * Acceso: Staff
 */
router.get('/dashboard', 
    [
        require('express-validator').query('period')
            .optional()
            .isInt({ min: 1, max: 365 })
            .withMessage('Período debe ser entre 1 y 365 días'),
        handleValidationErrors
    ],
    reportController.getDashboard
);

/**
 * GET /api/reports/occupancy
 * Generar reporte de ocupación
 * Acceso: Staff
 */
router.get('/occupancy', 
    [
        ...validateDateRange,
        require('express-validator').query('status')
            .optional()
            .isIn(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'])
            .withMessage('Estado de reserva inválido'),
        require('express-validator').query('category')
            .optional()
            .isIn(['standard', 'deluxe', 'suite', 'presidential'])
            .withMessage('Categoría de habitación inválida'),
        require('express-validator').query('export_format')
            .optional()
            .isIn(['json', 'csv', 'pdf', 'excel'])
            .withMessage('Formato de exportación inválido'),
        handleValidationErrors
    ],
    reportController.generateOccupancyReport
);

/**
 * GET /api/reports/sales
 * Generar reporte de ventas
 * Acceso: Staff
 */
router.get('/sales', 
    [
        ...validateDateRange,
        require('express-validator').query('include_services')
            .optional()
            .isBoolean()
            .withMessage('include_services debe ser boolean'),
        require('express-validator').query('service_type')
            .optional()
            .isIn(['restaurant', 'spa', 'transport', 'laundry', 'room_service', 'minibar', 'parking', 'wifi'])
            .withMessage('Tipo de servicio inválido'),
        require('express-validator').query('export_format')
            .optional()
            .isIn(['json', 'csv', 'pdf', 'excel'])
            .withMessage('Formato de exportación inválido'),
        handleValidationErrors
    ],
    reportController.generateSalesReport
);

/**
 * GET /api/reports/guests
 * Generar reporte de huéspedes
 * Acceso: Staff
 */
router.get('/guests', 
    [
        ...validateDateRange,
        require('express-validator').query('nationality')
            .optional()
            .isLength({ min: 2, max: 3 })
            .withMessage('Código de nacionalidad debe tener 2 o 3 caracteres'),
        require('express-validator').query('vip_only')
            .optional()
            .isBoolean()
            .withMessage('vip_only debe ser boolean'),
        require('express-validator').query('include_demographics')
            .optional()
            .isBoolean()
            .withMessage('include_demographics debe ser boolean'),
        require('express-validator').query('export_format')
            .optional()
            .isIn(['json', 'csv', 'pdf', 'excel'])
            .withMessage('Formato de exportación inválido'),
        handleValidationErrors
    ],
    reportController.generateGuestsReport
);

/**
 * GET /api/reports/financial
 * Generar reporte financiero
 * Acceso: Managers
 */
router.get('/financial', 
    requireManager,
    [
        ...validateDateRange,
        require('express-validator').query('include_projections')
            .optional()
            .isBoolean()
            .withMessage('include_projections debe ser boolean'),
        require('express-validator').query('currency')
            .optional()
            .isLength({ min: 3, max: 3 })
            .withMessage('Código de moneda debe tener 3 caracteres'),
        require('express-validator').query('export_format')
            .optional()
            .isIn(['json', 'csv', 'pdf', 'excel'])
            .withMessage('Formato de exportación inválido'),
        handleValidationErrors
    ],
    reportController.generateFinancialReport
);

/**
 * GET /api/reports/incidents
 * Generar reporte de incidencias
 * Acceso: Staff
 */
router.get('/incidents', 
    [
        ...validateDateRange,
        require('express-validator').query('incident_type')
            .optional()
            .isIn(['maintenance', 'cleaning', 'technical', 'security', 'other'])
            .withMessage('Tipo de incidencia inválido'),
        require('express-validator').query('priority')
            .optional()
            .isIn(['low', 'medium', 'high', 'urgent'])
            .withMessage('Prioridad inválida'),
        require('express-validator').query('status')
            .optional()
            .isIn(['reported', 'in_progress', 'resolved', 'cancelled'])
            .withMessage('Estado de incidencia inválido'),
        require('express-validator').query('include_costs')
            .optional()
            .isBoolean()
            .withMessage('include_costs debe ser boolean'),
        require('express-validator').query('export_format')
            .optional()
            .isIn(['json', 'csv', 'pdf', 'excel'])
            .withMessage('Formato de exportación inválido'),
        handleValidationErrors
    ],
    reportController.generateIncidentsReport
);

/**
 * POST /api/reports/custom
 * Generar reporte personalizado
 * Acceso: Managers
 */
router.post('/custom', 
    requireManager,
    [
        require('express-validator').body('start_date')
            .notEmpty()
            .withMessage('Fecha de inicio requerida')
            .isISO8601()
            .withMessage('Fecha de inicio inválida'),
        require('express-validator').body('end_date')
            .notEmpty()
            .withMessage('Fecha de fin requerida')
            .isISO8601()
            .withMessage('Fecha de fin inválida')
            .custom((value, { req }) => {
                if (new Date(value) <= new Date(req.body.start_date)) {
                    throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
                }
                return true;
            }),
        require('express-validator').body('metrics')
            .isArray({ min: 1 })
            .withMessage('Debe especificar al menos una métrica')
            .custom(metrics => {
                const validMetrics = [
                    'occupancy_rate', 
                    'revenue', 
                    'guest_satisfaction', 
                    'incidents_count', 
                    'average_daily_rate', 
                    'revpar'
                ];
                const invalidMetrics = metrics.filter(m => !validMetrics.includes(m));
                if (invalidMetrics.length > 0) {
                    throw new Error(`Métricas inválidas: ${invalidMetrics.join(', ')}`);
                }
                return true;
            }),
        require('express-validator').body('grouping')
            .optional()
            .isIn(['daily', 'weekly', 'monthly'])
            .withMessage('Agrupación debe ser daily, weekly o monthly'),
        require('express-validator').body('export_format')
            .optional()
            .isIn(['json', 'csv', 'pdf', 'excel'])
            .withMessage('Formato de exportación inválido'),
        handleValidationErrors
    ],
    reportController.generateCustomReport
);

module.exports = router;