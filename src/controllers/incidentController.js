/**
 * Controlador de Incidencias - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Maneja todas las operaciones relacionadas con incidencias:
 * reporte, asignación, seguimiento, resolución y notificaciones
 */

const { Incident, Room, User, sequelize } = require('../models');
const { catchAsync } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { INCIDENT_STATUS, INCIDENT_PRIORITY, INCIDENT_TYPES, PAGINATION, USER_ROLES } = require('../utils/constants');
const emailService = require('../services/emailService');

/**
 * Obtiene todas las incidencias con filtros y paginación
 */
const getAllIncidents = catchAsync(async (req, res) => {
    const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        status,
        priority,
        incident_type,
        room_id,
        assigned_to,
        reported_by,
        area,
        start_date,
        end_date,
        overdue_only = false,
        search
    } = req.query;

    const offset = (page - 1) * limit;
    const whereConditions = {};

    // Aplicar filtros
    if (status) {
        whereConditions.status = status;
    }

    if (priority) {
        whereConditions.priority = priority;
    }

    if (incident_type) {
        whereConditions.incident_type = incident_type;
    }

    if (room_id) {
        whereConditions.room_id = room_id;
    }

    if (assigned_to) {
        whereConditions.assigned_to_user_id = assigned_to;
    }

    if (reported_by) {
        whereConditions.reported_by_user_id = reported_by;
    }

    if (area) {
        whereConditions.area = area;
    }

    if (start_date && end_date) {
        whereConditions.reported_at = {
            [sequelize.Sequelize.Op.between]: [start_date, end_date]
        };
    }

    if (overdue_only === 'true') {
        whereConditions.target_resolution_date = {
            [sequelize.Sequelize.Op.lt]: new Date()
        };
        whereConditions.status = {
            [sequelize.Sequelize.Op.ne]: INCIDENT_STATUS.RESOLVED
        };
    }

    // Búsqueda por título o ticket number
    if (search) {
        whereConditions[sequelize.Sequelize.Op.or] = [
            {
                title: {
                    [sequelize.Sequelize.Op.iLike]: `%${search}%`
                }
            },
            {
                ticket_number: {
                    [sequelize.Sequelize.Op.iLike]: `%${search}%`
                }
            }
        ];
    }

    const { rows: incidents, count: total } = await Incident.findAndCountAll({
        where: whereConditions,
        include: [
            {
                model: Room,
                as: 'room',
                attributes: ['id', 'room_number', 'category', 'floor'],
                required: false
            },
            {
                model: User,
                as: 'reportedBy',
                attributes: ['id', 'first_name', 'last_name', 'role']
            },
            {
                model: User,
                as: 'assignedTo',
                attributes: ['id', 'first_name', 'last_name', 'role'],
                required: false
            },
            {
                model: User,
                as: 'resolvedBy',
                attributes: ['id', 'first_name', 'last_name'],
                required: false
            }
        ],
        order: [['priority', 'DESC'], ['reported_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
    });

    logger.info('Incidencias consultadas', {
        userId: req.user.id,
        total,
        page,
        filters: { status, priority, incident_type, overdue_only }
    });

    res.json({
        success: true,
        data: {
            incidents: incidents.map(incident => ({
                ...incident.getSummary(),
                room: incident.room,
                reported_by: incident.reported_by_user,
                assigned_to: incident.assigned_to_user,
                resolved_by: incident.resolved_by_user
            })),
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: parseInt(limit)
            }
        }
    });
});

/**
 * Obtiene una incidencia específica por ID
 */
const getIncidentById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const incident = await Incident.findByPk(id, {
        include: [
            {
                model: Room,
                as: 'room',
                required: false
            },
            {
                model: User,
                as: 'reportedBy',
                attributes: ['id', 'first_name', 'last_name', 'role', 'email']
            },
            {
                model: User,
                as: 'assignedTo',
                attributes: ['id', 'first_name', 'last_name', 'role', 'email'],
                required: false
            },
            {
                model: User,
                as: 'resolvedBy',
                attributes: ['id', 'first_name', 'last_name'],
                required: false
            }
        ]
    });

    if (!incident) {
        return res.status(404).json({
            success: false,
            message: 'Incidencia no encontrada'
        });
    }

    // Verificar permisos: solo staff puede ver incidencias
    if (!req.user.isStaff()) {
        return res.status(403).json({
            success: false,
            message: 'No tiene permisos para ver incidencias'
        });
    }

    res.json({
        success: true,
        data: {
            incident: {
                ...incident.toJSON(),
                can_be_assigned: incident.canBeAssigned(),
                can_be_resolved: incident.canBeResolved(),
                is_overdue: incident.isOverdue(),
                elapsed_time: incident.getElapsedTime(),
                resolution_time: incident.getResolutionTime()
            }
        }
    });
});

/**
 * Crea una nueva incidencia
 */
const createIncident = catchAsync(async (req, res) => {
    const {
        title,
        description,
        incident_type,
        priority = INCIDENT_PRIORITY.MEDIUM,
        room_id,
        location,
        floor,
        area,
        affects_guest_experience = false,
        affects_safety = false,
        affects_operations = false,
        estimated_cost,
        attachments = [],
        before_photos = []
    } = req.body;

    // Verificar que la habitación existe si se especifica
    if (room_id) {
        const room = await Room.findByPk(room_id);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Habitación no encontrada'
            });
        }
    }

    const incident = await Incident.create({
        title,
        description,
        incident_type,
        priority,
        room_id,
        location,
        floor,
        area,
        affects_guest_experience,
        affects_safety,
        affects_operations,
        estimated_cost,
        attachments,
        before_photos,
        reported_by_user_id: req.user.id,
        status: INCIDENT_STATUS.REPORTED
    });

    // Recargar con relaciones
    const completeIncident = await Incident.findByPk(incident.id, {
        include: [
            {
                model: Room,
                as: 'room',
                attributes: ['id', 'room_number', 'category'],
                required: false
            },
            {
                model: User,
                as: 'reportedBy',
                attributes: ['id', 'first_name', 'last_name']
            }
        ]
    });

    logger.info('Incidencia creada', {
        incidentId: incident.id,
        ticketNumber: incident.ticket_number,
        type: incident_type,
        priority,
        roomId: room_id,
        reportedBy: req.user.id
    });

    // Enviar notificaciones al equipo correspondiente
    try {
        await this.notifyStaffOfNewIncident(completeIncident);
    } catch (emailError) {
        logger.warn('Error enviando notificación de incidencia', emailError);
    }

    res.status(201).json({
        success: true,
        message: 'Incidencia reportada exitosamente',
        data: {
            incident: {
                ...completeIncident.getSummary(),
                room: completeIncident.room,
                reported_by: completeIncident.reported_by_user
            }
        }
    });
});

/**
 * Actualiza una incidencia existente
 */
const updateIncident = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const incident = await Incident.findByPk(id);

    if (!incident) {
        return res.status(404).json({
            success: false,
            message: 'Incidencia no encontrada'
        });
    }

    // Solo el personal puede actualizar incidencias
    if (!req.user.isStaff()) {
        return res.status(403).json({
            success: false,
            message: 'No tiene permisos para actualizar incidencias'
        });
    }

    // Campos que se pueden actualizar
    const allowedFields = [
        'title', 'description', 'priority', 'location', 'area',
        'estimated_cost', 'internal_notes', 'follow_up_required',
        'follow_up_date', 'follow_up_notes', 'external_provider',
        'provider_contact', 'provider_reference', 'attachments'
    ];

    // Filtrar solo campos permitidos
    const filteredData = {};
    Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
            filteredData[key] = updateData[key];
        }
    });

    await incident.update(filteredData);

    logger.info('Incidencia actualizada', {
        incidentId: id,
        ticketNumber: incident.ticket_number,
        updatedFields: Object.keys(filteredData),
        updatedBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Incidencia actualizada exitosamente',
        data: {
            incident: incident.getSummary()
        }
    });
});

/**
 * Asigna una incidencia a un usuario
 */
const assignIncident = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { assigned_to_user_id } = req.body;

    const incident = await Incident.findByPk(id);

    if (!incident) {
        return res.status(404).json({
            success: false,
            message: 'Incidencia no encontrada'
        });
    }

    if (!incident.canBeAssigned()) {
        return res.status(400).json({
            success: false,
            message: 'Esta incidencia no puede ser asignada en su estado actual'
        });
    }

    // Verificar que el usuario existe y es staff
    const assignedUser = await User.findByPk(assigned_to_user_id);
    if (!assignedUser) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }

    if (!assignedUser.isStaff()) {
        return res.status(400).json({
            success: false,
            message: 'Solo se puede asignar a personal del hotel'
        });
    }

    await incident.assignTo(assigned_to_user_id);

    logger.info('Incidencia asignada', {
        incidentId: id,
        ticketNumber: incident.ticket_number,
        assignedTo: assigned_to_user_id,
        assignedBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Incidencia asignada exitosamente',
        data: {
            incident: {
                ...incident.getSummary(),
                assigned_to: {
                    id: assignedUser.id,
                    name: assignedUser.getFullName(),
                    role: assignedUser.role
                }
            }
        }
    });
});

/**
 * Inicia el trabajo en una incidencia
 */
const startWork = catchAsync(async (req, res) => {
    const { id } = req.params;

    const incident = await Incident.findByPk(id);

    if (!incident) {
        return res.status(404).json({
            success: false,
            message: 'Incidencia no encontrada'
        });
    }

    // Solo el asignado o un manager puede iniciar el trabajo
    if (incident.assigned_to_user_id !== req.user.id && !req.user.isManager()) {
        return res.status(403).json({
            success: false,
            message: 'No tiene permisos para iniciar trabajo en esta incidencia'
        });
    }

    await incident.startWork();

    logger.info('Trabajo iniciado en incidencia', {
        incidentId: id,
        ticketNumber: incident.ticket_number,
        startedBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Trabajo iniciado en la incidencia',
        data: {
            incident: incident.getSummary()
        }
    });
});

/**
 * Resuelve una incidencia
 */
const resolveIncident = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { 
        resolution_description, 
        actual_cost, 
        hours_worked,
        materials_used = [],
        after_photos = [],
        preventive_action 
    } = req.body;

    if (!resolution_description) {
        return res.status(400).json({
            success: false,
            message: 'La descripción de resolución es requerida'
        });
    }

    const incident = await Incident.findByPk(id);

    if (!incident) {
        return res.status(404).json({
            success: false,
            message: 'Incidencia no encontrada'
        });
    }

    if (!incident.canBeResolved()) {
        return res.status(400).json({
            success: false,
            message: 'Esta incidencia no puede ser resuelta en su estado actual'
        });
    }

    // Solo el asignado o un manager puede resolver
    if (incident.assigned_to_user_id !== req.user.id && !req.user.isManager()) {
        return res.status(403).json({
            success: false,
            message: 'No tiene permisos para resolver esta incidencia'
        });
    }

    // Actualizar información adicional de resolución
    await incident.update({
        actual_cost,
        hours_worked,
        materials_used,
        after_photos,
        preventive_action
    });

    // Resolver la incidencia
    await incident.resolve(resolution_description, req.user.id, actual_cost);

    logger.info('Incidencia resuelta', {
        incidentId: id,
        ticketNumber: incident.ticket_number,
        actualCost: actual_cost,
        hoursWorked: hours_worked,
        resolvedBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Incidencia resuelta exitosamente',
        data: {
            incident: {
                ...incident.getSummary(),
                resolution_time_hours: incident.getResolutionTime()
            }
        }
    });
});

/**
 * Cancela una incidencia
 */
const cancelIncident = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({
            success: false,
            message: 'Debe especificar la razón de cancelación'
        });
    }

    const incident = await Incident.findByPk(id);

    if (!incident) {
        return res.status(404).json({
            success: false,
            message: 'Incidencia no encontrada'
        });
    }

    // Solo managers pueden cancelar incidencias
    if (!req.user.isManager()) {
        return res.status(403).json({
            success: false,
            message: 'Solo managers pueden cancelar incidencias'
        });
    }

    await incident.cancel(reason);

    logger.info('Incidencia cancelada', {
        incidentId: id,
        ticketNumber: incident.ticket_number,
        reason,
        cancelledBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Incidencia cancelada exitosamente',
        data: {
            incident: incident.getSummary()
        }
    });
});

/**
 * Añade seguimiento a una incidencia
 */
const addFollowUp = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { notes, next_follow_up_date } = req.body;

    if (!notes) {
        return res.status(400).json({
            success: false,
            message: 'Las notas de seguimiento son requeridas'
        });
    }

    const incident = await Incident.findByPk(id);

    if (!incident) {
        return res.status(404).json({
            success: false,
            message: 'Incidencia no encontrada'
        });
    }

    await incident.addFollowUp(notes, next_follow_up_date);

    logger.info('Seguimiento agregado a incidencia', {
        incidentId: id,
        ticketNumber: incident.ticket_number,
        hasNextDate: !!next_follow_up_date,
        addedBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Seguimiento agregado exitosamente',
        data: {
            incident: incident.getSummary()
        }
    });
});

/**
 * Obtiene incidencias asignadas al usuario actual
 */
const getMyIncidents = catchAsync(async (req, res) => {
    const { status = 'open' } = req.query;

    let whereConditions = {
        assigned_to_user_id: req.user.id
    };

    if (status === 'open') {
        whereConditions.status = {
            [sequelize.Sequelize.Op.in]: [INCIDENT_STATUS.REPORTED, INCIDENT_STATUS.IN_PROGRESS]
        };
    } else if (status !== 'all') {
        whereConditions.status = status;
    }

    const incidents = await Incident.findAll({
        where: whereConditions,
        include: [
            {
                model: Room,
                as: 'room',
                attributes: ['id', 'room_number', 'category'],
                required: false
            }
        ],
        order: [['priority', 'DESC'], ['target_resolution_date', 'ASC']]
    });

    res.json({
        success: true,
        data: {
            incidents: incidents.map(incident => ({
                ...incident.getSummary(),
                room: incident.room
            })),
            summary: {
                total: incidents.length,
                overdue: incidents.filter(i => i.isOverdue()).length,
                urgent: incidents.filter(i => i.priority === INCIDENT_PRIORITY.URGENT).length
            }
        }
    });
});

/**
 * Obtiene incidencias por habitación
 */
const getIncidentsByRoom = catchAsync(async (req, res) => {
    const { roomId } = req.params;
    const { include_resolved = false } = req.query;

    const room = await Room.findByPk(roomId);
    if (!room) {
        return res.status(404).json({
            success: false,
            message: 'Habitación no encontrada'
        });
    }

    const incidents = await Incident.findByRoom(roomId, include_resolved === 'true');

    res.json({
        success: true,
        data: {
            room: {
                id: room.id,
                room_number: room.room_number,
                category: room.category,
                status: room.status
            },
            incidents: incidents.map(incident => incident.getSummary())
        }
    });
});

/**
 * Obtiene estadísticas de incidencias
 */
const getIncidentStats = catchAsync(async (req, res) => {
    const { start_date, end_date } = req.query;

    const stats = await Incident.getStats(start_date, end_date);
    const overdueIncidents = await Incident.findOverdueIncidents();

    res.json({
        success: true,
        data: {
            statistics: stats,
            overdue_incidents: overdueIncidents.map(incident => incident.getSummary()),
            summary: {
                total_overdue: overdueIncidents.length,
                high_priority_overdue: overdueIncidents.filter(i => 
                    [INCIDENT_PRIORITY.HIGH, INCIDENT_PRIORITY.URGENT].includes(i.priority)
                ).length
            },
            period: { start_date, end_date }
        }
    });
});

/**
 * Funciones auxiliares
 */
async function notifyStaffOfNewIncident(incident) {
    try {
        // Obtener emails del personal según el tipo de incidencia
        const staffRoles = [USER_ROLES.MANAGER, USER_ROLES.RECEPTIONIST];
        
        if (incident.incident_type === 'cleaning') {
            staffRoles.push(USER_ROLES.CLEANING);
        }

        const staffUsers = await User.findAll({
            where: {
                role: {
                    [sequelize.Sequelize.Op.in]: staffRoles
                },
                is_active: true
            },
            attributes: ['email']
        });

        const staffEmails = staffUsers.map(user => user.email);

        // Enviar notificación de incidencia - DESHABILITADO
        // if (staffEmails.length > 0) {
        //     await emailService.sendIncidentNotification(incident, staffEmails);
        // }

        logger.info('Notificación de incidencia (email deshabilitado)', {
            incidentId: incident.id,
            staffEmails: staffEmails.length
        });
    } catch (error) {
        logger.error('Error enviando notificación de incidencia', error);
    }
}

module.exports = {
    getAllIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
    assignIncident,
    startWork,
    resolveIncident,
    cancelIncident,
    addFollowUp,
    getMyIncidents,
    getIncidentsByRoom,
    getIncidentStats
};