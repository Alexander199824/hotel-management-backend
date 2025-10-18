/**
 * Modelo Room - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Define el modelo de habitaciones del hotel con sus características,
 * estado, precios y funcionalidades para gestión de disponibilidad
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { ROOM_STATUS, ROOM_CATEGORIES } = require('../utils/constants');

const Room = sequelize.define('Room', {
    // Identificador único de la habitación
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: 'Identificador único de la habitación'
    },

    // Número de habitación (único en el hotel)
    room_number: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: {
            name: 'room_number_unique',
            msg: 'El número de habitación ya existe'
        },
        validate: {
            notEmpty: {
                msg: 'El número de habitación es requerido'
            },
            len: {
                args: [1, 10],
                msg: 'El número de habitación debe tener entre 1 y 10 caracteres'
            }
        },
        comment: 'Número único de la habitación'
    },

    // Categoría de la habitación - Cambiado de ENUM a STRING
    category: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: {
                args: [Object.values(ROOM_CATEGORIES)],
                msg: 'Categoría de habitación inválida'
            }
        },
        comment: 'Categoría de la habitación (standard, deluxe, suite, presidential)'
    },

    // Información básica de la habitación
    floor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: {
                args: 1,
                msg: 'El piso debe ser mayor a 0'
            },
            max: {
                args: 50,
                msg: 'El piso no puede ser mayor a 50'
            }
        },
        comment: 'Piso donde se encuentra la habitación'
    },

    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
        validate: {
            min: {
                args: 1,
                msg: 'La capacidad debe ser al menos 1 persona'
            },
            max: {
                args: 10,
                msg: 'La capacidad no puede ser mayor a 10 personas'
            }
        },
        comment: 'Número máximo de huéspedes que puede alojar'
    },

    beds_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: {
                args: 1,
                msg: 'Debe tener al menos 1 cama'
            },
            max: {
                args: 5,
                msg: 'No puede tener más de 5 camas'
            }
        },
        comment: 'Número de camas en la habitación'
    },

    bed_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'individual',
        validate: {
            isIn: {
                args: [['individual', 'doble', 'queen', 'king', 'sofa_cama']],
                msg: 'Tipo de cama inválido'
            }
        },
        comment: 'Tipo de cama principal'
    },

    // Estado actual de la habitación - Cambiado de ENUM a STRING
    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: ROOM_STATUS.AVAILABLE,
        validate: {
            isIn: {
                args: [Object.values(ROOM_STATUS)],
                msg: 'Estado de habitación inválido'
            }
        },
        comment: 'Estado actual de la habitación'
    },

    // Información de precios
    base_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
        min: {
            args: [0],  // ← Cambiar a array
            msg: 'El precio base no puede ser negativo'
        },
        max: {
            args: [99999.99],  // ← También cambiar esto a array
            msg: 'El precio base es demasiado alto'
        }
    },
    comment: 'Precio base por noche en moneda local'
},

    currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'GTQ',
        validate: {
            len: {
                args: [3, 3],
                msg: 'La moneda debe tener exactamente 3 caracteres'
            },
            isUppercase: {
                msg: 'La moneda debe estar en mayúsculas'
            }
        },
        comment: 'Código de moneda ISO 4217'
    },

    // Amenidades y características
    amenities: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Lista de amenidades disponibles en JSON'
    },

    has_balcony: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si la habitación tiene balcón'
    },

    has_ocean_view: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si la habitación tiene vista al mar'
    },

    has_wifi: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Indica si la habitación tiene WiFi'
    },

    has_air_conditioning: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Indica si la habitación tiene aire acondicionado'
    },

    has_minibar: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si la habitación tiene minibar'
    },

    has_safe: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si la habitación tiene caja fuerte'
    },

    // Información descriptiva
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: {
                args: [0, 1000],
                msg: 'La descripción no puede exceder 1000 caracteres'
            }
        },
        comment: 'Descripción detallada de la habitación'
    },

    images: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'URLs de imágenes de la habitación en JSON'
    },

    // Información de mantenimiento
    last_maintenance_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha del último mantenimiento realizado'
    },

    next_maintenance_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha programada para próximo mantenimiento'
    },

    maintenance_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas sobre mantenimiento y reparaciones'
    },

    // Estado de limpieza
    last_cleaning_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha de la última limpieza'
    },

    cleaning_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas sobre el estado de limpieza'
    },

    // Estado de actividad
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Indica si la habitación está activa para reservas'
    },

    is_out_of_order: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si la habitación está fuera de servicio'
    },

    out_of_order_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Razón por la cual está fuera de servicio'
    }
}, {
    tableName: 'rooms',
    timestamps: true,
    
    // Índices para mejorar rendimiento
    indexes: [
        {
            fields: ['room_number'],
            unique: true
        },
        {
            fields: ['category']
        },
        {
            fields: ['status']
        },
        {
            fields: ['floor']
        },
        {
            fields: ['is_active']
        },
        {
            fields: ['capacity']
        },
        {
            fields: ['base_price']
        }
    ],

    // Configuración de validación a nivel de modelo
    validate: {
        // Validar que si está fuera de servicio tenga una razón
        outOfOrderValidation() {
            if (this.is_out_of_order && !this.out_of_order_reason) {
                throw new Error('Debe especificar la razón por la cual está fuera de servicio');
            }
        },

        // Validar que las fechas de mantenimiento sean coherentes
        maintenanceDatesValidation() {
            if (this.last_maintenance_date && this.next_maintenance_date) {
                if (this.next_maintenance_date <= this.last_maintenance_date) {
                    throw new Error('La fecha de próximo mantenimiento debe ser posterior a la última');
                }
            }
        }
    }
});

// Hooks del modelo

// Hook: Antes de crear una habitación
Room.beforeCreate(async (room, options) => {
    // Convertir número de habitación a mayúsculas para consistencia
    room.room_number = room.room_number.toUpperCase();
    
    // Si está fuera de servicio, cambiar estado automáticamente
    if (room.is_out_of_order) {
        room.status = ROOM_STATUS.OUT_OF_ORDER;
    }
});

// Hook: Antes de actualizar una habitación
Room.beforeUpdate(async (room, options) => {
    // Actualizar estado si cambió el estado de fuera de servicio
    if (room.changed('is_out_of_order')) {
        if (room.is_out_of_order) {
            room.status = ROOM_STATUS.OUT_OF_ORDER;
        } else {
            room.status = ROOM_STATUS.AVAILABLE;
        }
    }
    
    // Si se cambió el número, convertir a mayúsculas
    if (room.changed('room_number')) {
        room.room_number = room.room_number.toUpperCase();
    }
});

// Métodos de instancia

/**
 * Verifica si la habitación está disponible
 */
Room.prototype.isAvailable = function() {
    return this.status === ROOM_STATUS.AVAILABLE && 
           this.is_active && 
           !this.is_out_of_order;
};

/**
 * Verifica si la habitación está ocupada
 */
Room.prototype.isOccupied = function() {
    return this.status === ROOM_STATUS.OCCUPIED;
};

/**
 * Verifica si la habitación necesita limpieza
 */
Room.prototype.needsCleaning = function() {
    return this.status === ROOM_STATUS.CLEANING;
};

/**
 * Verifica si la habitación necesita mantenimiento
 */
Room.prototype.needsMaintenance = function() {
    if (this.status === ROOM_STATUS.MAINTENANCE) return true;
    if (this.next_maintenance_date && this.next_maintenance_date <= new Date()) return true;
    return false;
};

/**
 * Cambia el estado de la habitación
 */
Room.prototype.changeStatus = async function(newStatus, notes = null) {
    this.status = newStatus;
    
    // Agregar notas específicas según el estado
    if (newStatus === ROOM_STATUS.CLEANING && notes) {
        this.cleaning_notes = notes;
        this.last_cleaning_date = new Date();
    } else if (newStatus === ROOM_STATUS.MAINTENANCE && notes) {
        this.maintenance_notes = notes;
        this.last_maintenance_date = new Date();
    }
    
    await this.save();
};

/**
 * Marca la habitación como ocupada
 */
Room.prototype.checkIn = async function() {
    await this.changeStatus(ROOM_STATUS.OCCUPIED);
};

/**
 * Marca la habitación como disponible después del checkout
 */
Room.prototype.checkOut = async function() {
    await this.changeStatus(ROOM_STATUS.CLEANING, 'Habitación requiere limpieza después del checkout');
};

/**
 * Obtiene el precio con descuentos o incrementos aplicados
 */
Room.prototype.getPriceForDates = function(checkIn, checkOut, discountPercent = 0) {
    const basePrice = parseFloat(this.base_price);
    
    // Calcular número de noches
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    // Aplicar descuento si existe
    const finalPrice = basePrice * (1 - discountPercent / 100);
    
    return {
        basePrice,
        nights,
        pricePerNight: finalPrice,
        totalPrice: finalPrice * nights,
        currency: this.currency,
        discount: discountPercent
    };
};

/**
 * Obtiene las amenidades como array
 */
Room.prototype.getAmenities = function() {
    const amenities = [];
    
    if (this.has_wifi) amenities.push('WiFi');
    if (this.has_air_conditioning) amenities.push('Aire Acondicionado');
    if (this.has_balcony) amenities.push('Balcón');
    if (this.has_ocean_view) amenities.push('Vista al Mar');
    if (this.has_minibar) amenities.push('Minibar');
    if (this.has_safe) amenities.push('Caja Fuerte');
    
    // Agregar amenidades adicionales del JSON
    if (this.amenities && Array.isArray(this.amenities)) {
        amenities.push(...this.amenities);
    }
    
    return amenities;
};

/**
 * Obtiene información completa de la habitación
 */
Room.prototype.getFullInfo = function() {
    return {
        id: this.id,
        room_number: this.room_number,
        category: this.category,
        floor: this.floor,
        capacity: this.capacity,
        beds_count: this.beds_count,
        bed_type: this.bed_type,
        status: this.status,
        base_price: this.base_price,
        currency: this.currency,
        amenities: this.getAmenities(),
        description: this.description,
        images: this.images || [],
        is_available: this.isAvailable(),
        created_at: this.createdAt,
        updated_at: this.updatedAt
    };
};

// Métodos estáticos (de clase)

/**
 * Busca habitaciones disponibles por categoría y fechas
 */
Room.findAvailableRooms = async function(checkIn, checkOut, category = null, capacity = null) {
    const whereConditions = {
        status: ROOM_STATUS.AVAILABLE,
        is_active: true,
        is_out_of_order: false
    };
    
    if (category) {
        whereConditions.category = category;
    }
    
    if (capacity) {
        whereConditions.capacity = {
            [sequelize.Sequelize.Op.gte]: capacity
        };
    }
    
    return await this.findAll({
        where: whereConditions,
        order: [['category', 'ASC'], ['room_number', 'ASC']]
    });
};

/**
 * Obtiene estadísticas de ocupación
 */
Room.getOccupancyStats = async function() {
    const stats = await this.findAll({
        attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
    });
    
    const total = await this.count({ where: { is_active: true } });
    
    return {
        total,
        by_status: stats.reduce((acc, stat) => {
            acc[stat.status] = parseInt(stat.count);
            return acc;
        }, {}),
        occupancy_rate: stats.find(s => s.status === ROOM_STATUS.OCCUPIED)?.count || 0 / total * 100
    };
};

/**
 * Obtiene habitaciones que necesitan atención
 */
Room.getRoomsNeedingAttention = async function() {
    const maintenanceDate = new Date();
    
    return await this.findAll({
        where: {
            [sequelize.Sequelize.Op.or]: [
                { status: ROOM_STATUS.CLEANING },
                { status: ROOM_STATUS.MAINTENANCE },
                { is_out_of_order: true },
                {
                    next_maintenance_date: {
                        [sequelize.Sequelize.Op.lte]: maintenanceDate
                    }
                }
            ]
        },
        order: [['status', 'ASC'], ['room_number', 'ASC']]
    });
};

module.exports = Room;