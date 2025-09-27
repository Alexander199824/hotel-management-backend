/**
 * Modelo Reservation - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Define el modelo de reservas del hotel incluyendo fechas, huéspedes,
 * habitaciones, precios y estados de la reserva
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { RESERVATION_STATUS, PAYMENT_STATUS } = require('../utils/constants');

const Reservation = sequelize.define('Reservation', {
    // Identificador único de la reserva
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: 'Identificador único de la reserva'
    },

    // Código de reserva visible para el cliente
    reservation_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: {
            name: 'reservation_code_unique',
            msg: 'El código de reserva ya existe'
        },
        comment: 'Código único de reserva para el cliente'
    },

    // Relaciones con otras entidades
    guest_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'guests',
            key: 'id'
        },
        comment: 'ID del huésped que realiza la reserva'
    },

    room_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'rooms',
            key: 'id'
        },
        comment: 'ID de la habitación reservada'
    },

    created_by_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'ID del usuario que creó la reserva (si fue por staff)'
    },

    // Fechas de la reserva
    check_in_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La fecha de check-in es requerida'
            },
            isDate: {
                msg: 'Fecha de check-in inválida'
            }
        },
        comment: 'Fecha de check-in'
    },

    check_out_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La fecha de check-out es requerida'
            },
            isDate: {
                msg: 'Fecha de check-out inválida'
            }
        },
        comment: 'Fecha de check-out'
    },

    // Fechas reales de check-in y check-out
    actual_check_in: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha y hora real de check-in'
    },

    actual_check_out: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha y hora real de check-out'
    },

    // Información de huéspedes
    adults_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: {
                args: 1,
                msg: 'Debe haber al menos 1 adulto'
            },
            max: {
                args: 10,
                msg: 'No puede haber más de 10 adultos'
            }
        },
        comment: 'Número de adultos'
    },

    children_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: 0,
                msg: 'El número de niños no puede ser negativo'
            },
            max: {
                args: 10,
                msg: 'No puede haber más de 10 niños'
            }
        },
        comment: 'Número de niños'
    },

    total_guests: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.adults_count + this.children_count;
        },
        comment: 'Total de huéspedes (calculado)'
    },

    // Estado de la reserva - Cambiado de ENUM a STRING
    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: RESERVATION_STATUS.PENDING,
        validate: {
            isIn: {
                args: [Object.values(RESERVATION_STATUS)],
                msg: 'Estado de reserva inválido'
            }
        },
        comment: 'Estado actual de la reserva'
    },

    // Información de precios
    base_price_per_night: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: {
                args: 0,
                msg: 'El precio base no puede ser negativo'
            }
        },
        comment: 'Precio base por noche al momento de la reserva'
    },

    nights_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: {
                args: 1,
                msg: 'Debe ser al menos 1 noche'
            }
        },
        comment: 'Número de noches de la reserva'
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
        comment: 'Subtotal antes de impuestos y descuentos'
    },

    discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: 0,
                msg: 'El descuento no puede ser negativo'
            }
        },
        comment: 'Monto total de descuentos aplicados'
    },

    tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: 0,
                msg: 'Los impuestos no pueden ser negativos'
            }
        },
        comment: 'Monto total de impuestos'
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
        comment: 'Monto total a pagar'
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

    // Información de pago - Cambiado de ENUM a STRING
    payment_status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: PAYMENT_STATUS.PENDING,
        validate: {
            isIn: {
                args: [Object.values(PAYMENT_STATUS)],
                msg: 'Estado de pago inválido'
            }
        },
        comment: 'Estado del pago de la reserva'
    },

    paid_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: 0,
                msg: 'El monto pagado no puede ser negativo'
            }
        },
        comment: 'Monto total pagado'
    },

    payment_deadline: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha límite para completar el pago'
    },

    // Solicitudes especiales y notas
    special_requests: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: {
                args: [0, 1000],
                msg: 'Las solicitudes especiales no pueden exceder 1000 caracteres'
            }
        },
        comment: 'Solicitudes especiales del huésped'
    },

    internal_notes: {
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
        comment: 'ID del usuario que canceló la reserva'
    },

    cancellation_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Razón de la cancelación'
    },

    // Información de confirmación
    confirmed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha y hora de confirmación'
    },

    confirmed_by_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'ID del usuario que confirmó la reserva'
    },

    // Información de contacto de emergencia
    emergency_contact_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Nombre del contacto de emergencia'
    },

    emergency_contact_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Teléfono del contacto de emergencia'
    },

    // Preferencias del huésped
    preferences: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: 'Preferencias del huésped en formato JSON'
    }
}, {
    tableName: 'reservations',
    timestamps: true,
    
    // Índices para mejorar rendimiento
    indexes: [
        {
            fields: ['reservation_code'],
            unique: true
        },
        {
            fields: ['guest_id']
        },
        {
            fields: ['room_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['payment_status']
        },
        {
            fields: ['check_in_date']
        },
        {
            fields: ['check_out_date']
        },
        {
            fields: ['check_in_date', 'check_out_date']
        },
        {
            fields: ['created_at']
        }
    ],

    // Configuración de validación a nivel de modelo
    validate: {
        // Validar que check-out sea después de check-in
        checkDatesOrder() {
            if (this.check_in_date >= this.check_out_date) {
                throw new Error('La fecha de check-out debe ser posterior a la de check-in');
            }
        },

        // Validar que el check-in no sea en el pasado (para nuevas reservas)
        checkInNotPast() {
            if (this.isNewRecord && new Date(this.check_in_date) < new Date()) {
                throw new Error('La fecha de check-in no puede ser en el pasado');
            }
        },

        // Validar que el monto pagado no exceda el total
        paidAmountValid() {
            if (this.paid_amount > this.total_amount) {
                throw new Error('El monto pagado no puede exceder el total');
            }
        },

        // Validar que si está cancelada tenga razón
        cancellationValid() {
            if (this.status === RESERVATION_STATUS.CANCELLED && !this.cancellation_reason) {
                throw new Error('Debe especificar la razón de cancelación');
            }
        }
    }
});

// Hooks del modelo

// Hook: Antes de crear una reserva
Reservation.beforeCreate(async (reservation, options) => {
    // Generar código de reserva único
    if (!reservation.reservation_code) {
        reservation.reservation_code = await Reservation.generateReservationCode();
    }
    
    // Calcular número de noches
    const checkIn = new Date(reservation.check_in_date);
    const checkOut = new Date(reservation.check_out_date);
    reservation.nights_count = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    // Calcular subtotal si no está definido
    if (!reservation.subtotal) {
        reservation.subtotal = reservation.base_price_per_night * reservation.nights_count;
    }
    
    // Calcular total si no está definido
    if (!reservation.total_amount) {
        reservation.total_amount = reservation.subtotal + reservation.tax_amount - reservation.discount_amount;
    }
    
    // Establecer fecha límite de pago (24 horas después de crear)
    if (!reservation.payment_deadline) {
        reservation.payment_deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
});

// Hook: Antes de actualizar una reserva
Reservation.beforeUpdate(async (reservation, options) => {
    // Recalcular totales si cambiaron los precios
    if (reservation.changed('base_price_per_night') || 
        reservation.changed('discount_amount') || 
        reservation.changed('tax_amount')) {
        
        reservation.subtotal = reservation.base_price_per_night * reservation.nights_count;
        reservation.total_amount = reservation.subtotal + reservation.tax_amount - reservation.discount_amount;
    }
    
    // Actualizar timestamps de estado
    if (reservation.changed('status')) {
        switch (reservation.status) {
            case RESERVATION_STATUS.CONFIRMED:
                if (!reservation.confirmed_at) {
                    reservation.confirmed_at = new Date();
                }
                break;
            case RESERVATION_STATUS.CANCELLED:
                if (!reservation.cancelled_at) {
                    reservation.cancelled_at = new Date();
                }
                break;
            case RESERVATION_STATUS.CHECKED_IN:
                if (!reservation.actual_check_in) {
                    reservation.actual_check_in = new Date();
                }
                break;
            case RESERVATION_STATUS.CHECKED_OUT:
                if (!reservation.actual_check_out) {
                    reservation.actual_check_out = new Date();
                }
                break;
        }
    }
});

// Métodos de instancia

/**
 * Verifica si la reserva puede ser cancelada
 */
Reservation.prototype.canBeCancelled = function() {
    return [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.CONFIRMED].includes(this.status);
};

/**
 * Verifica si la reserva puede hacer check-in
 */
Reservation.prototype.canCheckIn = function() {
    const today = new Date().toISOString().split('T')[0];
    return this.status === RESERVATION_STATUS.CONFIRMED && 
           this.check_in_date <= today;
};

/**
 * Verifica si la reserva puede hacer check-out
 */
Reservation.prototype.canCheckOut = function() {
    return this.status === RESERVATION_STATUS.CHECKED_IN;
};

/**
 * Verifica si la reserva está vencida para pago
 */
Reservation.prototype.isPaymentOverdue = function() {
    return this.payment_status === PAYMENT_STATUS.PENDING && 
           this.payment_deadline && 
           new Date() > this.payment_deadline;
};

/**
 * Calcula el saldo pendiente
 */
Reservation.prototype.getBalance = function() {
    return Math.max(0, this.total_amount - this.paid_amount);
};

/**
 * Confirma la reserva
 */
Reservation.prototype.confirm = async function(userId = null) {
    this.status = RESERVATION_STATUS.CONFIRMED;
    this.confirmed_at = new Date();
    if (userId) this.confirmed_by_user_id = userId;
    await this.save();
};

/**
 * Cancela la reserva
 */
Reservation.prototype.cancel = async function(reason, userId = null) {
    this.status = RESERVATION_STATUS.CANCELLED;
    this.cancelled_at = new Date();
    this.cancellation_reason = reason;
    if (userId) this.cancelled_by_user_id = userId;
    await this.save();
};

/**
 * Realiza check-in
 */
Reservation.prototype.checkIn = async function() {
    this.status = RESERVATION_STATUS.CHECKED_IN;
    this.actual_check_in = new Date();
    await this.save();
};

/**
 * Realiza check-out
 */
Reservation.prototype.checkOut = async function() {
    this.status = RESERVATION_STATUS.CHECKED_OUT;
    this.actual_check_out = new Date();
    await this.save();
};

/**
 * Registra un pago
 */
Reservation.prototype.addPayment = async function(amount) {
    this.paid_amount = Math.min(this.total_amount, this.paid_amount + amount);
    
    if (this.paid_amount >= this.total_amount) {
        this.payment_status = PAYMENT_STATUS.COMPLETED;
    } else {
        this.payment_status = PAYMENT_STATUS.PARTIAL;
    }
    
    await this.save();
};

/**
 * Obtiene información resumida de la reserva
 */
Reservation.prototype.getSummary = function() {
    return {
        id: this.id,
        reservation_code: this.reservation_code,
        status: this.status,
        payment_status: this.payment_status,
        check_in_date: this.check_in_date,
        check_out_date: this.check_out_date,
        nights_count: this.nights_count,
        adults_count: this.adults_count,
        children_count: this.children_count,
        total_amount: this.total_amount,
        paid_amount: this.paid_amount,
        balance: this.getBalance(),
        currency: this.currency,
        created_at: this.createdAt
    };
};

// Métodos estáticos (de clase)

/**
 * Genera un código único de reserva
 */
Reservation.generateReservationCode = async function() {
    let code;
    let exists = true;
    
    while (exists) {
        // Generar código: MA + año + mes + día + 4 dígitos random
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        code = `MA${year}${month}${day}${random}`;
        
        // Verificar si ya existe
        const existing = await this.findOne({ where: { reservation_code: code } });
        exists = !!existing;
    }
    
    return code;
};

/**
 * Busca reservas por rango de fechas
 */
Reservation.findByDateRange = async function(startDate, endDate, status = null) {
    const whereConditions = {
        [sequelize.Sequelize.Op.or]: [
            {
                check_in_date: {
                    [sequelize.Sequelize.Op.between]: [startDate, endDate]
                }
            },
            {
                check_out_date: {
                    [sequelize.Sequelize.Op.between]: [startDate, endDate]
                }
            },
            {
                [sequelize.Sequelize.Op.and]: [
                    { check_in_date: { [sequelize.Sequelize.Op.lte]: startDate } },
                    { check_out_date: { [sequelize.Sequelize.Op.gte]: endDate } }
                ]
            }
        ]
    };
    
    if (status) {
        whereConditions.status = status;
    }
    
    return await this.findAll({
        where: whereConditions,
        order: [['check_in_date', 'ASC']]
    });
};

/**
 * Obtiene estadísticas de reservas
 */
Reservation.getStats = async function(startDate = null, endDate = null) {
    const whereConditions = {};
    
    if (startDate && endDate) {
        whereConditions.check_in_date = {
            [sequelize.Sequelize.Op.between]: [startDate, endDate]
        };
    }
    
    const [total, byStatus, byPaymentStatus] = await Promise.all([
        this.count({ where: whereConditions }),
        this.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue']
            ],
            where: whereConditions,
            group: ['status'],
            raw: true
        }),
        this.findAll({
            attributes: [
                'payment_status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('paid_amount')), 'amount']
            ],
            where: whereConditions,
            group: ['payment_status'],
            raw: true
        })
    ]);
    
    return {
        total,
        by_status: byStatus,
        by_payment_status: byPaymentStatus
    };
};

module.exports = Reservation;