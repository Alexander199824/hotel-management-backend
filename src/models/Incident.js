/**
 * Modelo Incident - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Define el modelo de incidencias reportadas por personal de limpieza,
 * recepcionistas o cualquier staff del hotel para mantenimiento y seguimiento
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { INCIDENT_STATUS, INCIDENT_PRIORITY, INCIDENT_TYPES } = require('../utils/constants');

const Incident = sequelize.define('Incident', {
    // Identificador único de la incidencia
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: 'Identificador único de la incidencia'
    },

    // Número de ticket visible
    ticket_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: {
            name: 'ticket_number_unique',
            msg: 'El número de ticket ya existe'
        },
        comment: 'Número único de ticket para seguimiento'
    },

    // Relaciones con otras entidades
    room_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'rooms',
            key: 'id'
        },
        comment: 'ID de la habitación afectada (si aplica)'
    },

    reported_by_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'ID del usuario que reportó la incidencia'
    },

    assigned_to_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'ID del usuario asignado para resolver'
    },

    resolved_by_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'ID del usuario que resolvió la incidencia'
    },

    // Información básica de la incidencia
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El título es requerido'
            },
            len: {
                args: [5, 200],
                msg: 'El título debe tener entre 5 y 200 caracteres'
            }
        },
        comment: 'Título breve de la incidencia'
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La descripción es requerida'
            },
            len: {
                args: [10, 2000],
                msg: 'La descripción debe tener entre 10 y 2000 caracteres'
            }
        },
        comment: 'Descripción detallada de la incidencia'
    },

    incident_type: {
        type: DataTypes.ENUM(Object.values(INCIDENT_TYPES)),
        allowNull: false,
        validate: {
            isIn: {
                args: [Object.values(INCIDENT_TYPES)],
                msg: 'Tipo de incidencia inválido'
            }
        },
        comment: 'Tipo de incidencia'
    },

    priority: {
        type: DataTypes.ENUM(Object.values(INCIDENT_PRIORITY)),
        allowNull: false,
        defaultValue: INCIDENT_PRIORITY.MEDIUM,
        validate: {
            isIn: {
                args: [Object.values(INCIDENT_PRIORITY)],
                msg: 'Prioridad inválida'
            }
        },
        comment: 'Prioridad de la incidencia'
    },

    status: {
        type: DataTypes.ENUM(Object.values(INCIDENT_STATUS)),
        allowNull: false,
        defaultValue: INCIDENT_STATUS.REPORTED,
        validate: {
            isIn: {
                args: [Object.values(INCIDENT_STATUS)],
                msg: 'Estado de incidencia inválido'
            }
        },
        comment: 'Estado actual de la incidencia'
    },

    // Ubicación específica
    location: {
        type: DataTypes.STRING(200),
        allowNull: true,
        validate: {
            len: {
                args: [0, 200],
                msg: 'La ubicación no puede exceder 200 caracteres'
            }
        },
        comment: 'Ubicación específica donde ocurrió la incidencia'
    },

    floor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: {
                args: 0,
                msg: 'El piso no puede ser negativo'
            },
            max: {
                args: 50,
                msg: 'El piso no puede ser mayor a 50'
            }
        },
        comment: 'Piso donde ocurrió la incidencia'
    },

    area: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isIn: {
                args: [['habitacion', 'lobby', 'restaurante', 'spa', 'piscina', 'gimnasio', 'parking', 'jardin', 'azotea', 'sotano', 'pasillo', 'ascensor', 'escalera', 'baño_publico', 'cocina', 'lavanderia', 'oficina', 'almacen', 'otro']],
                msg: 'Área inválida'
            }
        },
        comment: 'Área general donde ocurrió la incidencia'
    },

    // Información de impacto
    affects_guest_experience: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si afecta directamente la experiencia del huésped'
    },

    affects_safety: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si representa un riesgo de seguridad'
    },

    affects_operations: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si afecta las operaciones del hotel'
    },

    estimated_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: {
                args: 0,
                msg: 'El costo estimado no puede ser negativo'
            }
        },
        comment: 'Costo estimado de reparación'
    },

    actual_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: {
                args: 0,
                msg: 'El costo real no puede ser negativo'
            }
        },
        comment: 'Costo real de reparación'
    },

    currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'GTQ',
        validate: {
            len: {
                args: [3, 3],
                msg: 'La moneda debe tener exactamente 3 caracteres'
            }
        },
        comment: 'Código de moneda ISO 4217'
    },

    // Fechas importantes
    reported_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Fecha y hora del reporte'
    },

    target_resolution_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha objetivo para resolución'
    },

    started_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha y hora de inicio de trabajo'
    },

    resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha y hora de resolución'
    },

    // Información de resolución
    resolution_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: {
                args: [0, 2000],
                msg: 'La descripción de resolución no puede exceder 2000 caracteres'
            }
        },
        comment: 'Descripción de cómo se resolvió la incidencia'
    },

    materials_used: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Lista de materiales utilizados en formato JSON'
    },

    hours_worked: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
        validate: {
            min: {
                args: 0,
                msg: 'Las horas trabajadas no pueden ser negativas'
            }
        },
        comment: 'Horas trabajadas en la resolución'
    },

    // Información del proveedor externo
    external_provider: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: 'Nombre del proveedor externo (si aplica)'
    },

    provider_contact: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Contacto del proveedor externo'
    },

    provider_reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Número de referencia del proveedor'
    },

    // Archivos adjuntos y evidencia
    attachments: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'URLs de archivos adjuntos en formato JSON'
    },

    before_photos: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'URLs de fotos antes de la reparación'
    },

    after_photos: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'URLs de fotos después de la reparación'
    },

    // Notas y seguimiento
    internal_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas internas del staff'
    },

    follow_up_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si requiere seguimiento posterior'
    },

    follow_up_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha de seguimiento programado'
    },

    follow_up_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas del seguimiento'
    },

    // Información de recurrencia
    is_recurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si es una incidencia recurrente'
    },

    related_incident_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'incidents',
            key: 'id'
        },
        comment: 'ID de incidencia relacionada'
    },

    preventive_action: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Acción preventiva para evitar recurrencia'
    },

    // Información de satisfacción
    satisfaction_rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: {
                args: 1,
                msg: 'La calificación mínima es 1'
            },
            max: {
                args: 5,
                msg: 'La calificación máxima es 5'
            }
        },
        comment: 'Calificación de satisfacción con la resolución (1-5)'
    },

    satisfaction_feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Comentarios sobre la satisfacción'
    }
}, {
    tableName: 'incidents',
    timestamps: true,
    
    // Índices para mejorar rendimiento
    indexes: [
        {
            fields: ['ticket_number'],
            unique: true
        },
        {
            fields: ['room_id']
        },
        {
            fields: ['reported_by_user_id']
        },
        {
            fields: ['assigned_to_user_id']
        },
        {
            fields: ['incident_type']
        },
        {
            fields: ['priority']
        },
        {
            fields: ['status']
        },
        {
            fields: ['area']
        },
        {
            fields: ['reported_at']
        },
        {
            fields: ['target_resolution_date']
        },
        {
            fields: ['affects_guest_experience']
        },
        {
            fields: ['affects_safety']
        },
        {
            fields: ['status', 'priority']
        }
    ],

    // Configuración de validación a nivel de modelo
    validate: {
        // Validar que la fecha de resolución sea después del reporte
        resolutionDateValid() {
            if (this.resolved_at && this.resolved_at <= this.reported_at) {
                throw new Error('La fecha de resolución debe ser posterior al reporte');
            }
        },

        // Validar que si está resuelto tenga descripción
        resolutionDescriptionRequired() {
            if (this.status === INCIDENT_STATUS.RESOLVED && !this.resolution_description) {
                throw new Error('La descripción de resolución es requerida para incidencias resueltas');
            }
        },

        // Validar que el costo real no sea mayor significativamente al estimado
        costValidation() {
            if (this.estimated_cost && this.actual_cost && this.actual_cost > this.estimated_cost * 2) {
                console.warn(`Incidencia ${this.ticket_number}: Costo real excede significativamente el estimado`);
            }
        }
    }
});

// Hooks del modelo

// Hook: Antes de crear una incidencia
Incident.beforeCreate(async (incident, options) => {
    // Generar número de ticket único
    if (!incident.ticket_number) {
        incident.ticket_number = await Incident.generateTicketNumber();
    }
    
    // Establecer fecha objetivo basada en prioridad
    if (!incident.target_resolution_date) {
        const hours = {
            [INCIDENT_PRIORITY.URGENT]: 2,
            [INCIDENT_PRIORITY.HIGH]: 8,
            [INCIDENT_PRIORITY.MEDIUM]: 24,
            [INCIDENT_PRIORITY.LOW]: 72
        };
        
        const targetHours = hours[incident.priority] || 24;
        incident.target_resolution_date = new Date(Date.now() + targetHours * 60 * 60 * 1000);
    }
    
    // Ajustar prioridad automáticamente según impacto
    if (incident.affects_safety && incident.priority !== INCIDENT_PRIORITY.URGENT) {
        incident.priority = INCIDENT_PRIORITY.HIGH;
    }
    
    if (incident.affects_guest_experience && incident.priority === INCIDENT_PRIORITY.LOW) {
        incident.priority = INCIDENT_PRIORITY.MEDIUM;
    }
});

// Hook: Antes de actualizar una incidencia
Incident.beforeUpdate(async (incident, options) => {
    // Actualizar timestamps de estado
    if (incident.changed('status')) {
        switch (incident.status) {
            case INCIDENT_STATUS.IN_PROGRESS:
                if (!incident.started_at) {
                    incident.started_at = new Date();
                }
                break;
            case INCIDENT_STATUS.RESOLVED:
                if (!incident.resolved_at) {
                    incident.resolved_at = new Date();
                }
                break;
        }
    }
});

// Métodos de instancia

/**
 * Verifica si la incidencia puede ser asignada
 */
Incident.prototype.canBeAssigned = function() {
    return [INCIDENT_STATUS.REPORTED, INCIDENT_STATUS.IN_PROGRESS].includes(this.status);
};

/**
 * Verifica si la incidencia puede ser resuelta
 */
Incident.prototype.canBeResolved = function() {
    return [INCIDENT_STATUS.REPORTED, INCIDENT_STATUS.IN_PROGRESS].includes(this.status);
};

/**
 * Verifica si la incidencia está vencida
 */
Incident.prototype.isOverdue = function() {
    return this.target_resolution_date && 
           new Date() > this.target_resolution_date && 
           this.status !== INCIDENT_STATUS.RESOLVED;
};

/**
 * Calcula el tiempo transcurrido desde el reporte
 */
Incident.prototype.getElapsedTime = function() {
    const now = this.resolved_at || new Date();
    const diffMs = now - this.reported_at;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, total_minutes: Math.floor(diffMs / (1000 * 60)) };
};

/**
 * Calcula el tiempo de resolución
 */
Incident.prototype.getResolutionTime = function() {
    if (!this.resolved_at) return null;
    
    const diffMs = this.resolved_at - this.reported_at;
    return Math.floor(diffMs / (1000 * 60 * 60)); // horas
};

/**
 * Asigna la incidencia a un usuario
 */
Incident.prototype.assignTo = async function(userId) {
    this.assigned_to_user_id = userId;
    if (this.status === INCIDENT_STATUS.REPORTED) {
        this.status = INCIDENT_STATUS.IN_PROGRESS;
        this.started_at = new Date();
    }
    await this.save();
};

/**
 * Marca la incidencia como en progreso
 */
Incident.prototype.startWork = async function() {
    this.status = INCIDENT_STATUS.IN_PROGRESS;
    this.started_at = new Date();
    await this.save();
};

/**
 * Resuelve la incidencia
 */
Incident.prototype.resolve = async function(description, userId = null, cost = null) {
    this.status = INCIDENT_STATUS.RESOLVED;
    this.resolved_at = new Date();
    this.resolution_description = description;
    if (userId) this.resolved_by_user_id = userId;
    if (cost !== null) this.actual_cost = cost;
    await this.save();
};

/**
 * Cancela la incidencia
 */
Incident.prototype.cancel = async function(reason) {
    this.status = INCIDENT_STATUS.CANCELLED;
    this.resolution_description = `Cancelada: ${reason}`;
    await this.save();
};

/**
 * Añade una nota de seguimiento
 */
Incident.prototype.addFollowUp = async function(notes, nextDate = null) {
    this.follow_up_notes = notes;
    this.follow_up_required = !!nextDate;
    if (nextDate) this.follow_up_date = nextDate;
    await this.save();
};

/**
 * Añade calificación de satisfacción
 */
Incident.prototype.addSatisfactionRating = async function(rating, feedback = null) {
    this.satisfaction_rating = rating;
    if (feedback) this.satisfaction_feedback = feedback;
    await this.save();
};

/**
 * Obtiene información resumida de la incidencia
 */
Incident.prototype.getSummary = function() {
    return {
        id: this.id,
        ticket_number: this.ticket_number,
        title: this.title,
        incident_type: this.incident_type,
        priority: this.priority,
        status: this.status,
        area: this.area,
        floor: this.floor,
        reported_at: this.reported_at,
        target_resolution_date: this.target_resolution_date,
        resolved_at: this.resolved_at,
        affects_guest_experience: this.affects_guest_experience,
        affects_safety: this.affects_safety,
        is_overdue: this.isOverdue(),
        elapsed_time: this.getElapsedTime(),
        resolution_time: this.getResolutionTime()
    };
};

// Métodos estáticos (de clase)

/**
 * Genera un número único de ticket
 */
Incident.generateTicketNumber = async function() {
    let ticketNumber;
    let exists = true;
    
    while (exists) {
        // Generar número: INC + año + mes + día + 4 dígitos secuenciales
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        
        // Contar incidencias del día actual
        const startOfDay = new Date(year, now.getMonth(), now.getDate());
        const endOfDay = new Date(year, now.getMonth(), now.getDate() + 1);
        
        const count = await this.count({
            where: {
                reported_at: {
                    [sequelize.Sequelize.Op.between]: [startOfDay, endOfDay]
                }
            }
        });
        
        const sequence = (count + 1).toString().padStart(4, '0');
        ticketNumber = `INC${year}${month}${day}${sequence}`;
        
        // Verificar si ya existe
        const existing = await this.findOne({ where: { ticket_number: ticketNumber } });
        exists = !!existing;
    }
    
    return ticketNumber;
};

/**
 * Busca incidencias abiertas
 */
Incident.findOpenIncidents = async function() {
    return await this.findAll({
        where: {
            status: {
                [sequelize.Sequelize.Op.in]: [INCIDENT_STATUS.REPORTED, INCIDENT_STATUS.IN_PROGRESS]
            }
        },
        order: [['priority', 'DESC'], ['reported_at', 'ASC']]
    });
};

/**
 * Busca incidencias vencidas
 */
Incident.findOverdueIncidents = async function() {
    return await this.findAll({
        where: {
            target_resolution_date: {
                [sequelize.Sequelize.Op.lt]: new Date()
            },
            status: {
                [sequelize.Sequelize.Op.ne]: INCIDENT_STATUS.RESOLVED
            }
        },
        order: [['target_resolution_date', 'ASC']]
    });
};

/**
 * Busca incidencias por habitación
 */
Incident.findByRoom = async function(roomId, includeResolved = false) {
    const whereConditions = { room_id: roomId };
    
    if (!includeResolved) {
        whereConditions.status = {
            [sequelize.Sequelize.Op.ne]: INCIDENT_STATUS.RESOLVED
        };
    }
    
    return await this.findAll({
        where: whereConditions,
        order: [['reported_at', 'DESC']]
    });
};

/**
 * Obtiene estadísticas de incidencias
 */
Incident.getStats = async function(startDate = null, endDate = null) {
    const whereConditions = {};
    
    if (startDate && endDate) {
        whereConditions.reported_at = {
            [sequelize.Sequelize.Op.between]: [startDate, endDate]
        };
    }
    
    const [total, byType, byStatus, byPriority, resolution] = await Promise.all([
        this.count({ where: whereConditions }),
        this.findAll({
            attributes: [
                'incident_type',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: whereConditions,
            group: ['incident_type'],
            raw: true
        }),
        this.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: whereConditions,
            group: ['status'],
            raw: true
        }),
        this.findAll({
            attributes: [
                'priority',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: whereConditions,
            group: ['priority'],
            raw: true
        }),
        this.findOne({
            attributes: [
                [sequelize.fn('AVG', 
                    sequelize.literal(`EXTRACT(EPOCH FROM (resolved_at - reported_at))/3600`)
                ), 'avg_resolution_hours'],
                [sequelize.fn('AVG', sequelize.col('satisfaction_rating')), 'avg_satisfaction']
            ],
            where: {
                ...whereConditions,
                status: INCIDENT_STATUS.RESOLVED,
                resolved_at: { [sequelize.Sequelize.Op.ne]: null }
            },
            raw: true
        })
    ]);
    
    return {
        total_incidents: total,
        by_type: byType,
        by_status: byStatus,
        by_priority: byPriority,
        resolution_stats: resolution
    };
};

module.exports = Incident;