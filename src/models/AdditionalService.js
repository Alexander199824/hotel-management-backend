/**
 * Modelo AdditionalService - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Define el modelo de servicios adicionales como restaurante, spa, transporte
 * Incluye consumos por reserva/huésped y facturación
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { SERVICE_TYPES } = require('../utils/constants');

const AdditionalService = sequelize.define('AdditionalService', {
    // Identificador único del servicio
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: 'Identificador único del servicio adicional'
    },

    // Relaciones con otras entidades
    reservation_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'reservations',
            key: 'id'
        },
        comment: 'ID de la reserva asociada'
    },

    guest_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'guests',
            key: 'id'
        },
        comment: 'ID del huésped que consume el servicio'
    },

    room_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'rooms',
            key: 'id'
        },
        comment: 'ID de la habitación (si aplica)'
    },

    invoice_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'invoices',
            key: 'id'
        },
        comment: 'ID de la factura asociada'
    },

    registered_by_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'ID del usuario que registró el servicio'
    },

    // Información del servicio - Cambiado de ENUM a STRING
    service_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: {
                args: [Object.values(SERVICE_TYPES)],
                msg: 'Tipo de servicio inválido'
            }
        },
        comment: 'Tipo de servicio adicional'
    },

    service_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El nombre del servicio es requerido'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
            }
        },
        comment: 'Nombre específico del servicio'
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: {
                args: [0, 500],
                msg: 'La descripción no puede exceder 500 caracteres'
            }
        },
        comment: 'Descripción detallada del servicio'
    },

    // Información de fecha y hora
    service_date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La fecha del servicio es requerida'
            },
            isDate: {
                msg: 'Fecha de servicio inválida'
            }
        },
        comment: 'Fecha y hora del servicio'
    },

    start_time: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: 'Hora de inicio del servicio'
    },

    end_time: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: 'Hora de fin del servicio'
    },

    duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: {
                args: 1,
                msg: 'La duración debe ser mayor a 0 minutos'
            },
            max: {
                args: 1440, // 24 horas
                msg: 'La duración no puede exceder 24 horas'
            }
        },
        comment: 'Duración del servicio en minutos'
    },

    // Información de cantidad y precios
    quantity: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: {
                args: 0.01,
                msg: 'La cantidad debe ser mayor a 0'
            }
        },
        comment: 'Cantidad de servicios consumidos'
    },

    unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'unidad',
        validate: {
            isIn: {
                args: [['unidad', 'hora', 'persona', 'noche', 'kg', 'litro', 'minuto']],
                msg: 'Unidad de medida inválida'
            }
        },
        comment: 'Unidad de medida del servicio'
    },

    unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: {
                args: 0,
                msg: 'El precio unitario no puede ser negativo'
            }
        },
        comment: 'Precio por unidad'
    },

    discount_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: 0,
                msg: 'El descuento no puede ser negativo'
            },
            max: {
                args: 100,
                msg: 'El descuento no puede ser mayor al 100%'
            }
        },
        comment: 'Porcentaje de descuento aplicado'
    },

    discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: 0,
                msg: 'El monto de descuento no puede ser negativo'
            }
        },
        comment: 'Monto del descuento aplicado'
    },

    tax_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: 0,
                msg: 'El impuesto no puede ser negativo'
            },
            max: {
                args: 50,
                msg: 'El impuesto no puede ser mayor al 50%'
            }
        },
        comment: 'Porcentaje de impuesto aplicado'
    },

    tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: 0,
                msg: 'El monto de impuesto no puede ser negativo'
            }
        },
        comment: 'Monto del impuesto calculado'
    },

    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: {
                args: 0,
                msg: 'El subtotal no puede ser negativo'
            }
        },
        comment: 'Subtotal antes de descuentos e impuestos'
    },

    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: {
                args: 0,
                msg: 'El total no puede ser negativo'
            }
        },
        comment: 'Monto total del servicio'
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

    // Estados del servicio - Cambiado de ENUM a STRING
    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: {
                args: [['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']],
                msg: 'Estado de servicio inválido'
            }
        },
        comment: 'Estado actual del servicio'
    },

    is_paid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si el servicio ha sido pagado'
    },

    is_complimentary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si el servicio es cortesía'
    },

    // Información del proveedor/departamento
    department: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Departamento que proporciona el servicio'
    },

    provider_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Nombre del proveedor externo (si aplica)'
    },

    location: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Ubicación donde se presta el servicio'
    },

    // Información adicional
    special_instructions: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: {
                args: [0, 1000],
                msg: 'Las instrucciones no pueden exceder 1000 caracteres'
            }
        },
        comment: 'Instrucciones especiales para el servicio'
    },

    guest_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas o comentarios del huésped'
    },

    staff_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas internas del staff'
    },

    // Información de cancelación
    cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha y hora de cancelación'
    },

    cancelled_by_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'ID del usuario que canceló el servicio'
    },

    cancellation_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Razón de la cancelación'
    },

    // Información de servicio completado
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha y hora de finalización'
    },

    completed_by_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'ID del usuario que marcó como completado'
    },

    // Rating y feedback
    guest_rating: {
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
        comment: 'Calificación del huésped (1-5)'
    },

    guest_feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Comentarios del huésped sobre el servicio'
    }
}, {
    tableName: 'additional_services',
    timestamps: true,
    
    // Índices para mejorar rendimiento
    indexes: [
        {
            fields: ['reservation_id']
        },
        {
            fields: ['guest_id']
        },
        {
            fields: ['room_id']
        },
        {
            fields: ['invoice_id']
        },
        {
            fields: ['service_type']
        },
        {
            fields: ['service_date']
        },
        {
            fields: ['status']
        },
        {
            fields: ['is_paid']
        },
        {
            fields: ['department']
        },
        {
            fields: ['service_date', 'service_type']
        }
    ],

    // Configuración de validación a nivel de modelo
    validate: {
        // Validar que end_time sea después de start_time
        timeValidation() {
            if (this.start_time && this.end_time && this.start_time >= this.end_time) {
                throw new Error('La hora de fin debe ser posterior a la hora de inicio');
            }
        },

        // Validar que si está cancelado tenga razón
        cancellationValidation() {
            if (this.status === 'cancelled' && !this.cancellation_reason) {
                throw new Error('Debe especificar la razón de cancelación');
            }
        },

        // Validar que el descuento no exceda el subtotal
        discountValidation() {
            if (this.discount_amount > this.subtotal) {
                throw new Error('El descuento no puede ser mayor al subtotal');
            }
        }
    }
});

// Hooks del modelo

// Hook: Antes de crear un servicio
AdditionalService.beforeCreate(async (service, options) => {
    // Calcular subtotal
    service.subtotal = service.quantity * service.unit_price;
    
    // Calcular descuento si se especificó porcentaje
    if (service.discount_percentage > 0 && service.discount_amount === 0) {
        service.discount_amount = service.subtotal * (service.discount_percentage / 100);
    }
    
    // Calcular impuestos si se especificó porcentaje
    if (service.tax_percentage > 0 && service.tax_amount === 0) {
        const taxableAmount = service.subtotal - service.discount_amount;
        service.tax_amount = taxableAmount * (service.tax_percentage / 100);
    }
    
    // Calcular total
    service.total_amount = service.subtotal - service.discount_amount + service.tax_amount;
    
    // Si es cortesía, el total es 0
    if (service.is_complimentary) {
        service.total_amount = 0;
    }
});

// Hook: Antes de actualizar un servicio
AdditionalService.beforeUpdate(async (service, options) => {
    // Recalcular montos si cambiaron cantidad, precio o descuentos
    if (service.changed('quantity') || 
        service.changed('unit_price') || 
        service.changed('discount_percentage') || 
        service.changed('discount_amount') ||
        service.changed('tax_percentage') ||
        service.changed('is_complimentary')) {
        
        // Recalcular subtotal
        service.subtotal = service.quantity * service.unit_price;
        
        // Recalcular descuento
        if (service.discount_percentage > 0) {
            service.discount_amount = service.subtotal * (service.discount_percentage / 100);
        }
        
        // Recalcular impuestos
        if (service.tax_percentage > 0) {
            const taxableAmount = service.subtotal - service.discount_amount;
            service.tax_amount = taxableAmount * (service.tax_percentage / 100);
        }
        
        // Recalcular total
        service.total_amount = service.subtotal - service.discount_amount + service.tax_amount;
        
        // Si es cortesía, el total es 0
        if (service.is_complimentary) {
            service.total_amount = 0;
        }
    }
    
    // Actualizar timestamps de estado
    if (service.changed('status')) {
        switch (service.status) {
            case 'completed':
                if (!service.completed_at) {
                    service.completed_at = new Date();
                }
                break;
            case 'cancelled':
                if (!service.cancelled_at) {
                    service.cancelled_at = new Date();
                }
                break;
        }
    }
});

// Métodos de instancia

/**
 * Verifica si el servicio puede ser cancelado
 */
AdditionalService.prototype.canBeCancelled = function() {
    return ['pending', 'confirmed'].includes(this.status);
};

/**
 * Verifica si el servicio puede ser modificado
 */
AdditionalService.prototype.canBeModified = function() {
    return ['pending', 'confirmed'].includes(this.status) && !this.is_paid;
};

/**
 * Confirma el servicio
 */
AdditionalService.prototype.confirm = async function() {
    this.status = 'confirmed';
    await this.save();
};

/**
 * Marca el servicio como en progreso
 */
AdditionalService.prototype.startService = async function() {
    this.status = 'in_progress';
    await this.save();
};

/**
 * Marca el servicio como completado
 */
AdditionalService.prototype.complete = async function(userId = null) {
    this.status = 'completed';
    this.completed_at = new Date();
    if (userId) this.completed_by_user_id = userId;
    await this.save();
};

/**
 * Cancela el servicio
 */
AdditionalService.prototype.cancel = async function(reason, userId = null) {
    this.status = 'cancelled';
    this.cancelled_at = new Date();
    this.cancellation_reason = reason;
    if (userId) this.cancelled_by_user_id = userId;
    await this.save();
};

/**
 * Marca el servicio como pagado
 */
AdditionalService.prototype.markAsPaid = async function() {
    this.is_paid = true;
    await this.save();
};

/**
 * Añade calificación del huésped
 */
AdditionalService.prototype.addRating = async function(rating, feedback = null) {
    this.guest_rating = rating;
    if (feedback) this.guest_feedback = feedback;
    await this.save();
};

/**
 * Calcula la duración basada en horas de inicio y fin
 */
AdditionalService.prototype.calculateDuration = function() {
    if (!this.start_time || !this.end_time) return null;
    
    const start = new Date(`2000-01-01 ${this.start_time}`);
    const end = new Date(`2000-01-01 ${this.end_time}`);
    
    return Math.round((end - start) / (1000 * 60)); // minutos
};

/**
 * Obtiene información resumida del servicio
 */
AdditionalService.prototype.getSummary = function() {
    return {
        id: this.id,
        service_type: this.service_type,
        service_name: this.service_name,
        service_date: this.service_date,
        quantity: this.quantity,
        unit: this.unit,
        unit_price: this.unit_price,
        total_amount: this.total_amount,
        currency: this.currency,
        status: this.status,
        is_paid: this.is_paid,
        is_complimentary: this.is_complimentary,
        guest_rating: this.guest_rating
    };
};

// Métodos estáticos (de clase)

/**
 * Busca servicios por tipo y fecha
 */
AdditionalService.findByTypeAndDate = async function(serviceType, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await this.findAll({
        where: {
            service_type: serviceType,
            service_date: {
                [sequelize.Sequelize.Op.between]: [startOfDay, endOfDay]
            }
        },
        order: [['service_date', 'ASC']]
    });
};

/**
 * Busca servicios pendientes de pago
 */
AdditionalService.findUnpaidServices = async function() {
    return await this.findAll({
        where: {
            is_paid: false,
            is_complimentary: false,
            status: {
                [sequelize.Sequelize.Op.in]: ['completed', 'confirmed']
            }
        },
        order: [['service_date', 'ASC']]
    });
};

/**
 * Obtiene estadísticas de servicios
 */
AdditionalService.getStats = async function(startDate = null, endDate = null) {
    const whereConditions = {};
    
    if (startDate && endDate) {
        whereConditions.service_date = {
            [sequelize.Sequelize.Op.between]: [startDate, endDate]
        };
    }
    
    const [totalServices, byType, byStatus, revenue] = await Promise.all([
        this.count({ where: whereConditions }),
        this.findAll({
            attributes: [
                'service_type',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue']
            ],
            where: whereConditions,
            group: ['service_type'],
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
        this.findOne({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
                [sequelize.fn('AVG', sequelize.col('guest_rating')), 'average_rating']
            ],
            where: {
                ...whereConditions,
                is_complimentary: false
            },
            raw: true
        })
    ]);
    
    return {
        total_services: totalServices,
        by_service_type: byType,
        by_status: byStatus,
        revenue_stats: revenue
    };
};

/**
 * Obtiene los servicios más populares
 */
AdditionalService.getMostPopularServices = async function(limit = 10) {
    return await this.findAll({
        attributes: [
            'service_name',
            'service_type',
            [sequelize.fn('COUNT', sequelize.col('id')), 'usage_count'],
            [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
            [sequelize.fn('AVG', sequelize.col('guest_rating')), 'average_rating']
        ],
        where: {
            status: 'completed'
        },
        group: ['service_name', 'service_type'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit,
        raw: true
    });
};

module.exports = AdditionalService;