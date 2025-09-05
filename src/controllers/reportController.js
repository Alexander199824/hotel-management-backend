/**
 * Controlador de Reportes - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Maneja la generación y exportación de reportes de ocupación,
 * ventas, huéspedes, análisis financiero e incidencias
 */

const { catchAsync } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { REPORT_TYPES, EXPORT_FORMATS } = require('../utils/constants');
const reportService = require('../services/reportService');

/**
 * Genera reporte de ocupación del hotel
 */
const generateOccupancyReport = catchAsync(async (req, res) => {
    const {
        start_date,
        end_date,
        status,
        category,
        export_format = EXPORT_FORMATS.JSON
    } = req.query;

    // Validar fechas requeridas
    if (!start_date || !end_date) {
        return res.status(400).json({
            success: false,
            message: 'Fechas de inicio y fin son requeridas'
        });
    }

    // Validar que la fecha de fin sea posterior a la de inicio
    if (new Date(end_date) <= new Date(start_date)) {
        return res.status(400).json({
            success: false,
            message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        });
    }

    logger.info('Generando reporte de ocupación', {
        userId: req.user.id,
        start_date,
        end_date,
        filters: { status, category },
        export_format
    });

    // Generar el reporte
    const reportData = await reportService.generateOccupancyReport(
        start_date,
        end_date,
        { status, category }
    );

    // Si se solicita exportación en formato específico
    if (export_format !== EXPORT_FORMATS.JSON) {
        const exportResult = await reportService.exportReport(reportData, export_format);
        
        res.set({
            'Content-Type': exportResult.contentType,
            'Content-Disposition': `attachment; filename="${exportResult.filename}"`
        });
        
        return res.send(exportResult.data);
    }

    // Respuesta en JSON
    res.json({
        success: true,
        data: reportData
    });
});

/**
 * Genera reporte de ventas e ingresos
 */
const generateSalesReport = catchAsync(async (req, res) => {
    const {
        start_date,
        end_date,
        include_services = true,
        service_type,
        export_format = EXPORT_FORMATS.JSON
    } = req.query;

    // Validar fechas requeridas
    if (!start_date || !end_date) {
        return res.status(400).json({
            success: false,
            message: 'Fechas de inicio y fin son requeridas'
        });
    }

    logger.info('Generando reporte de ventas', {
        userId: req.user.id,
        start_date,
        end_date,
        filters: { include_services, service_type },
        export_format
    });

    // Generar el reporte
    const reportData = await reportService.generateSalesReport(
        start_date,
        end_date,
        { 
            include_services: include_services === 'true',
            service_type 
        }
    );

    // Si se solicita exportación en formato específico
    if (export_format !== EXPORT_FORMATS.JSON) {
        const exportResult = await reportService.exportReport(reportData, export_format);
        
        res.set({
            'Content-Type': exportResult.contentType,
            'Content-Disposition': `attachment; filename="${exportResult.filename}"`
        });
        
        return res.send(exportResult.data);
    }

    // Respuesta en JSON
    res.json({
        success: true,
        data: reportData
    });
});

/**
 * Genera reporte de huéspedes y demografía
 */
const generateGuestsReport = catchAsync(async (req, res) => {
    const {
        start_date,
        end_date,
        nationality,
        vip_only = false,
        include_demographics = true,
        export_format = EXPORT_FORMATS.JSON
    } = req.query;

    // Validar fechas requeridas
    if (!start_date || !end_date) {
        return res.status(400).json({
            success: false,
            message: 'Fechas de inicio y fin son requeridas'
        });
    }

    logger.info('Generando reporte de huéspedes', {
        userId: req.user.id,
        start_date,
        end_date,
        filters: { nationality, vip_only, include_demographics },
        export_format
    });

    // Generar el reporte
    const reportData = await reportService.generateGuestsReport(
        start_date,
        end_date,
        { 
            nationality,
            vip_only: vip_only === 'true',
            include_demographics: include_demographics === 'true'
        }
    );

    // Si se solicita exportación en formato específico
    if (export_format !== EXPORT_FORMATS.JSON) {
        const exportResult = await reportService.exportReport(reportData, export_format);
        
        res.set({
            'Content-Type': exportResult.contentType,
            'Content-Disposition': `attachment; filename="${exportResult.filename}"`
        });
        
        return res.send(exportResult.data);
    }

    // Respuesta en JSON
    res.json({
        success: true,
        data: reportData
    });
});

/**
 * Genera reporte financiero detallado
 */
const generateFinancialReport = catchAsync(async (req, res) => {
    const {
        start_date,
        end_date,
        include_projections = false,
        currency = 'GTQ',
        export_format = EXPORT_FORMATS.JSON
    } = req.query;

    // Validar fechas requeridas
    if (!start_date || !end_date) {
        return res.status(400).json({
            success: false,
            message: 'Fechas de inicio y fin son requeridas'
        });
    }

    logger.info('Generando reporte financiero', {
        userId: req.user.id,
        start_date,
        end_date,
        filters: { include_projections, currency },
        export_format
    });

    // Generar el reporte
    const reportData = await reportService.generateFinancialReport(
        start_date,
        end_date,
        { 
            include_projections: include_projections === 'true',
            currency
        }
    );

    // Si se solicita exportación en formato específico
    if (export_format !== EXPORT_FORMATS.JSON) {
        const exportResult = await reportService.exportReport(reportData, export_format);
        
        res.set({
            'Content-Type': exportResult.contentType,
            'Content-Disposition': `attachment; filename="${exportResult.filename}"`
        });
        
        return res.send(exportResult.data);
    }

    // Respuesta en JSON
    res.json({
        success: true,
        data: reportData
    });
});

/**
 * Genera reporte de incidencias y mantenimiento
 */
const generateIncidentsReport = catchAsync(async (req, res) => {
    const {
        start_date,
        end_date,
        incident_type,
        priority,
        status,
        include_costs = true,
        export_format = EXPORT_FORMATS.JSON
    } = req.query;

    // Validar fechas requeridas
    if (!start_date || !end_date) {
        return res.status(400).json({
            success: false,
            message: 'Fechas de inicio y fin son requeridas'
        });
    }

    logger.info('Generando reporte de incidencias', {
        userId: req.user.id,
        start_date,
        end_date,
        filters: { incident_type, priority, status, include_costs },
        export_format
    });

    // Obtener estadísticas de incidencias
    const Incident = require('../models/Incident');
    const incidentStats = await Incident.getStats(start_date, end_date);

    // Obtener incidencias del período
    const incidents = await Incident.findAll({
        where: {
            reported_at: {
                [require('sequelize').Op.between]: [start_date, end_date]
            },
            ...(incident_type && { incident_type }),
            ...(priority && { priority }),
            ...(status && { status })
        },
        include: [
            {
                model: require('../models/Room'),
                as: 'room',
                attributes: ['id', 'room_number', 'category'],
                required: false
            },
            {
                model: require('../models/User'),
                as: 'reported_by_user',
                attributes: ['id', 'first_name', 'last_name'],
                required: false
            }
        ],
        order: [['reported_at', 'DESC']]
    });

    const reportData = {
        type: REPORT_TYPES.INCIDENTS,
        period: {
            start_date,
            end_date
        },
        summary: {
            total_incidents: incidents.length,
            resolved_incidents: incidents.filter(i => i.status === 'resolved').length,
            pending_incidents: incidents.filter(i => ['reported', 'in_progress'].includes(i.status)).length,
            average_resolution_time: incidentStats.resolution_stats?.avg_resolution_hours || 0,
            total_estimated_cost: incidents.reduce((sum, i) => sum + (parseFloat(i.estimated_cost) || 0), 0),
            total_actual_cost: incidents.reduce((sum, i) => sum + (parseFloat(i.actual_cost) || 0), 0)
        },
        statistics: incidentStats,
        incidents: incidents.map(incident => ({
            ...incident.getSummary(),
            room: incident.room,
            reported_by: incident.reported_by_user
        })),
        cost_analysis: include_costs === 'true' ? {
            by_type: this.calculateCostsByType(incidents),
            by_priority: this.calculateCostsByPriority(incidents),
            budget_variance: this.calculateBudgetVariance(incidents)
        } : null,
        generated_at: new Date(),
        filters: { incident_type, priority, status, include_costs }
    };

    // Si se solicita exportación en formato específico
    if (export_format !== EXPORT_FORMATS.JSON) {
        const exportResult = await reportService.exportReport(reportData, export_format);
        
        res.set({
            'Content-Type': exportResult.contentType,
            'Content-Disposition': `attachment; filename="${exportResult.filename}"`
        });
        
        return res.send(exportResult.data);
    }

    // Respuesta en JSON
    res.json({
        success: true,
        data: reportData
    });
});

/**
 * Genera reporte personalizado con múltiples métricas
 */
const generateCustomReport = catchAsync(async (req, res) => {
    const {
        start_date,
        end_date,
        metrics = [],
        grouping = 'daily',
        export_format = EXPORT_FORMATS.JSON
    } = req.body;

    // Validar fechas requeridas
    if (!start_date || !end_date) {
        return res.status(400).json({
            success: false,
            message: 'Fechas de inicio y fin son requeridas'
        });
    }

    // Validar métricas solicitadas
    const availableMetrics = [
        'occupancy_rate',
        'revenue',
        'guest_satisfaction',
        'incidents_count',
        'average_daily_rate',
        'revpar'
    ];

    const requestedMetrics = Array.isArray(metrics) ? metrics : [];
    const invalidMetrics = requestedMetrics.filter(m => !availableMetrics.includes(m));

    if (invalidMetrics.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Métricas inválidas: ${invalidMetrics.join(', ')}`
        });
    }

    logger.info('Generando reporte personalizado', {
        userId: req.user.id,
        start_date,
        end_date,
        metrics: requestedMetrics,
        grouping,
        export_format
    });

    // Generar datos para cada métrica solicitada
    const reportData = {
        type: 'custom',
        period: { start_date, end_date },
        grouping,
        metrics: {},
        generated_at: new Date()
    };

    // Procesar cada métrica solicitada
    for (const metric of requestedMetrics) {
        try {
            switch (metric) {
                case 'occupancy_rate':
                    const occupancyData = await reportService.generateOccupancyReport(start_date, end_date);
                    reportData.metrics.occupancy_rate = {
                        summary: occupancyData.summary,
                        daily_data: occupancyData.daily_statistics
                    };
                    break;

                case 'revenue':
                    const salesData = await reportService.generateSalesReport(start_date, end_date);
                    reportData.metrics.revenue = {
                        summary: salesData.revenue_summary,
                        daily_data: salesData.daily_revenue
                    };
                    break;

                case 'guest_satisfaction':
                    // Simular datos de satisfacción
                    reportData.metrics.guest_satisfaction = {
                        average_rating: 4.2,
                        total_reviews: 156,
                        rating_distribution: { 5: 45, 4: 30, 3: 15, 2: 7, 1: 3 }
                    };
                    break;

                case 'incidents_count':
                    const Incident = require('../models/Incident');
                    const incidentStats = await Incident.getStats(start_date, end_date);
                    reportData.metrics.incidents_count = incidentStats;
                    break;

                default:
                    // Métrica no implementada
                    reportData.metrics[metric] = { error: 'Métrica no implementada' };
            }
        } catch (error) {
            logger.error(`Error procesando métrica ${metric}`, error);
            reportData.metrics[metric] = { error: error.message };
        }
    }

    // Si se solicita exportación en formato específico
    if (export_format !== EXPORT_FORMATS.JSON) {
        const exportResult = await reportService.exportReport(reportData, export_format);
        
        res.set({
            'Content-Type': exportResult.contentType,
            'Content-Disposition': `attachment; filename="${exportResult.filename}"`
        });
        
        return res.send(exportResult.data);
    }

    // Respuesta en JSON
    res.json({
        success: true,
        data: reportData
    });
});

/**
 * Obtiene el dashboard con métricas principales
 */
const getDashboard = catchAsync(async (req, res) => {
    const { period = '30' } = req.query; // Días hacia atrás
    
    const endDate = new Date();
    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    logger.info('Generando dashboard', {
        userId: req.user.id,
        period,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
    });

    try {
        // Obtener métricas principales en paralelo
        const [
            occupancyData,
            salesData,
            guestsData,
            roomStats,
            incidentStats
        ] = await Promise.all([
            reportService.generateOccupancyReport(
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            ),
            reportService.generateSalesReport(
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            ),
            reportService.generateGuestsReport(
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            ),
            require('../models/Room').getOccupancyStats(),
            require('../models/Incident').getStats(
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            )
        ]);

        const dashboard = {
            period: {
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                days: parseInt(period)
            },
            key_metrics: {
                occupancy_rate: occupancyData.summary.occupancy_rate,
                total_revenue: salesData.summary.total_revenue,
                total_reservations: occupancyData.summary.total_reservations,
                unique_guests: guestsData.summary.total_unique_guests,
                adr: occupancyData.summary.average_daily_rate,
                revpar: occupancyData.summary.revenue_per_available_room
            },
            current_status: {
                available_rooms: roomStats.by_status.available || 0,
                occupied_rooms: roomStats.by_status.occupied || 0,
                rooms_cleaning: roomStats.by_status.cleaning || 0,
                rooms_maintenance: roomStats.by_status.maintenance || 0,
                open_incidents: incidentStats.by_status.filter(s => 
                    ['reported', 'in_progress'].includes(s.status)
                ).reduce((sum, s) => sum + parseInt(s.count), 0)
            },
            trends: {
                occupancy_trend: occupancyData.trends,
                revenue_by_day: salesData.daily_revenue?.slice(-7) || [], // Últimos 7 días
                guest_satisfaction: 4.2 // Simulado
            },
            alerts: this.generateAlerts(roomStats, incidentStats, occupancyData),
            generated_at: new Date()
        };

        res.json({
            success: true,
            data: dashboard
        });

    } catch (error) {
        logger.error('Error generando dashboard', error);
        throw error;
    }
});

/**
 * Lista los tipos de reportes disponibles
 */
const getAvailableReports = catchAsync(async (req, res) => {
    const reports = [
        {
            type: REPORT_TYPES.OCCUPANCY,
            name: 'Reporte de Ocupación',
            description: 'Análisis de ocupación de habitaciones, tasas y tendencias',
            required_params: ['start_date', 'end_date'],
            optional_params: ['status', 'category', 'export_format'],
            export_formats: Object.values(EXPORT_FORMATS)
        },
        {
            type: REPORT_TYPES.SALES,
            name: 'Reporte de Ventas',
            description: 'Análisis de ingresos por hospedaje y servicios adicionales',
            required_params: ['start_date', 'end_date'],
            optional_params: ['include_services', 'service_type', 'export_format'],
            export_formats: Object.values(EXPORT_FORMATS)
        },
        {
            type: REPORT_TYPES.GUESTS,
            name: 'Reporte de Huéspedes',
            description: 'Análisis demográfico y de comportamiento de huéspedes',
            required_params: ['start_date', 'end_date'],
            optional_params: ['nationality', 'vip_only', 'include_demographics', 'export_format'],
            export_formats: Object.values(EXPORT_FORMATS)
        },
        {
            type: REPORT_TYPES.FINANCIAL,
            name: 'Reporte Financiero',
            description: 'Análisis financiero detallado con costos y rentabilidad',
            required_params: ['start_date', 'end_date'],
            optional_params: ['include_projections', 'currency', 'export_format'],
            export_formats: Object.values(EXPORT_FORMATS)
        },
        {
            type: REPORT_TYPES.INCIDENTS,
            name: 'Reporte de Incidencias',
            description: 'Análisis de incidencias y costos de mantenimiento',
            required_params: ['start_date', 'end_date'],
            optional_params: ['incident_type', 'priority', 'status', 'include_costs', 'export_format'],
            export_formats: Object.values(EXPORT_FORMATS)
        }
    ];

    res.json({
        success: true,
        data: {
            available_reports: reports,
            supported_export_formats: Object.values(EXPORT_FORMATS),
            max_date_range_days: 365
        }
    });
});

/**
 * Funciones auxiliares
 */
function calculateCostsByType(incidents) {
    return incidents.reduce((acc, incident) => {
        const type = incident.incident_type;
        const cost = parseFloat(incident.actual_cost) || parseFloat(incident.estimated_cost) || 0;
        acc[type] = (acc[type] || 0) + cost;
        return acc;
    }, {});
}

function calculateCostsByPriority(incidents) {
    return incidents.reduce((acc, incident) => {
        const priority = incident.priority;
        const cost = parseFloat(incident.actual_cost) || parseFloat(incident.estimated_cost) || 0;
        acc[priority] = (acc[priority] || 0) + cost;
        return acc;
    }, {});
}

function calculateBudgetVariance(incidents) {
    const totalEstimated = incidents.reduce((sum, i) => sum + (parseFloat(i.estimated_cost) || 0), 0);
    const totalActual = incidents.reduce((sum, i) => sum + (parseFloat(i.actual_cost) || 0), 0);
    
    return {
        estimated_total: totalEstimated,
        actual_total: totalActual,
        variance: totalActual - totalEstimated,
        variance_percentage: totalEstimated > 0 ? ((totalActual - totalEstimated) / totalEstimated) * 100 : 0
    };
}

function generateAlerts(roomStats, incidentStats, occupancyData) {
    const alerts = [];

    // Alerta de ocupación alta
    if (occupancyData.summary.occupancy_rate > 90) {
        alerts.push({
            type: 'warning',
            message: 'Ocupación muy alta - considerar estrategias de revenue management',
            priority: 'medium'
        });
    }

    // Alerta de ocupación baja
    if (occupancyData.summary.occupancy_rate < 30) {
        alerts.push({
            type: 'warning',
            message: 'Ocupación baja - revisar estrategias de marketing',
            priority: 'high'
        });
    }

    // Alerta de incidencias pendientes
    const pendingIncidents = incidentStats.by_status
        .filter(s => ['reported', 'in_progress'].includes(s.status))
        .reduce((sum, s) => sum + parseInt(s.count), 0);

    if (pendingIncidents > 5) {
        alerts.push({
            type: 'error',
            message: `${pendingIncidents} incidencias pendientes requieren atención`,
            priority: 'urgent'
        });
    }

    // Alerta de habitaciones fuera de servicio
    const outOfOrderRooms = roomStats.by_status.out_of_order || 0;
    if (outOfOrderRooms > 0) {
        alerts.push({
            type: 'warning',
            message: `${outOfOrderRooms} habitación(es) fuera de servicio`,
            priority: 'medium'
        });
    }

    return alerts;
}

module.exports = {
    generateOccupancyReport,
    generateSalesReport,
    generateGuestsReport,
    generateFinancialReport,
    generateIncidentsReport,
    generateCustomReport,
    getDashboard,
    getAvailableReports
};