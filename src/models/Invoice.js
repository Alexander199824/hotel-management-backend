/**
 * Modelo Invoice - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Define el modelo de facturas para hospedaje y servicios adicionales
 * Incluye información de facturación, líneas de items y pagos
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { INVOICE_STATUS, PAYMENT_STATUS } = require('../utils/constants');

const Invoice = sequelize.define('Invoice', {
    // Identificador único de la factura
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: 'Identificador único de la factura'
    },

    // Número de factura visible para el cliente
    invoice_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: {
            name: 'invoice_number_unique',
            msg: 'El número de factura ya existe'
        },
        comment: 'Número único de factura'
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
        comment: 'ID del huésped facturado'
    },

    created_by_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'ID del usuario que creó la factura'
    },

    // Información de fechas
    invoice_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Fecha de emisión de la factura'
    },

    due_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha de vencimiento para pago'
    },

    service_date_from: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Fecha de inicio del servicio facturado'
    },

    service_date_to: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Fecha de fin del servicio facturado'
    },

    // Estado de la factura - Cambiado de ENUM a STRING
    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: INVOICE_STATUS.DRAFT,
        validate: {
            isIn: {
                args: [Object.values(INVOICE_STATUS)],
                msg: 'Estado de factura inválido'
            }
        },
        comment: 'Estado actual de la factura'
    },

    // Información del cliente en la factura
    billing_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El nombre de facturación es requerido'
            }
        },
        comment: 'Nombre completo para facturación'
    },

    billing_email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            isEmail: {
                msg: 'Email de facturación inválido'
            }
        },
        comment: 'Email para envío de factura'
    },

    billing_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Teléfono de facturación'
    },

    billing_address: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Dirección completa de facturación'
    },

    billing_city: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Ciudad de facturación'
    },

    billing_state: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Estado/provincia de facturación'
    },

    billing_postal_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Código postal de facturación'
    },

    billing_country: {
        type: DataTypes.STRING(3),
        allowNull: true,
        comment: 'País de facturación (código ISO)'
    },

    // Información fiscal
    tax_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'NIT o número de identificación fiscal'
    },

    tax_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: 'Nombre fiscal o razón social'
    },

    // Montos de la factura
    subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: 0,
                msg: 'El subtotal no puede ser negativo'
            }
        },
        comment: 'Subtotal antes de impuestos'
    },

    discount_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: 0,
                msg: 'El descuento no puede ser negativo'
            }
        },
        comment: 'Monto total de descuentos'
    },

    tax_amount: {
        type: DataTypes.DECIMAL(12, 2),
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
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: {
                args: 0,
                msg: 'El total no puede ser negativo'
            }
        },
        comment: 'Monto total de la factura'
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
        comment: 'Estado del pago de la factura'
    },

    paid_amount: {
        type: DataTypes.DECIMAL(12, 2),
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

    payment_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha del último pago'
    },

    payment_method: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Método de pago utilizado'
    },

    payment_reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Referencia o ID de transacción'
    },

    // Líneas de items (almacenadas como JSON para flexibilidad)
    line_items: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        comment: 'Líneas de items de la factura en formato JSON'
    },

    // Notas y observaciones
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas adicionales en la factura'
    },

    internal_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas internas del staff'
    },

    // Información de envío
    sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha y hora de envío de la factura'
    },

    sent_to_email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Email al que se envió la factura'
    },

    // Información de anulación
    voided_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha y hora de anulación'
    },

    voided_by_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'ID del usuario que anuló la factura'
    },

    void_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Razón de la anulación'
    }
}, {
    tableName: 'invoices',
    timestamps: true,
    
    // Índices para mejorar rendimiento
    indexes: [
        {
            fields: ['invoice_number'],
            unique: true
        },
        {
            fields: ['reservation_id']
        },
        {
            fields: ['guest_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['payment_status']
        },
        {
            fields: ['invoice_date']
        },
        {
            fields: ['due_date']
        },
        {
            fields: ['billing_email']
        }
    ],

    // Configuración de validación a nivel de modelo
    validate: {
        // Validar que el periodo de servicio sea válido
        servicePeriodValid() {
            if (this.service_date_from >= this.service_date_to) {
                throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
            }
        },

        // Validar que el monto pagado no exceda el total
        paidAmountValid() {
            if (this.paid_amount > this.total_amount) {
                throw new Error('El monto pagado no puede exceder el total');
            }
        },

        // Validar que si está anulada tenga razón
        voidValidation() {
            if (this.voided_at && !this.void_reason) {
                throw new Error('Debe especificar la razón de anulación');
            }
        }
    }
});

// Hooks del modelo

// Hook: Antes de crear una factura
Invoice.beforeCreate(async (invoice, options) => {
    // Generar número de factura único
    if (!invoice.invoice_number) {
        invoice.invoice_number = await Invoice.generateInvoiceNumber();
    }
    
    // Calcular total si no está definido
    if (invoice.total_amount === 0) {
        invoice.total_amount = invoice.subtotal + invoice.tax_amount - invoice.discount_amount;
    }
    
    // Establecer fecha de vencimiento por defecto (30 días)
    if (!invoice.due_date) {
        invoice.due_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
});

// Hook: Antes de actualizar una factura
Invoice.beforeUpdate(async (invoice, options) => {
    // Recalcular total si cambiaron los montos
    if (invoice.changed('subtotal') || 
        invoice.changed('tax_amount') || 
        invoice.changed('discount_amount')) {
        
        invoice.total_amount = invoice.subtotal + invoice.tax_amount - invoice.discount_amount;
    }
    
    // Actualizar estado de pago basado en monto pagado
    if (invoice.changed('paid_amount')) {
        if (invoice.paid_amount === 0) {
            invoice.payment_status = PAYMENT_STATUS.PENDING;
        } else if (invoice.paid_amount >= invoice.total_amount) {
            invoice.payment_status = PAYMENT_STATUS.COMPLETED;
            if (!invoice.payment_date) {
                invoice.payment_date = new Date();
            }
        } else {
            invoice.payment_status = PAYMENT_STATUS.PARTIAL;
        }
    }
    
    // Marcar como enviada si se estableció sent_at
    if (invoice.changed('sent_at') && invoice.sent_at && invoice.status === INVOICE_STATUS.DRAFT) {
        invoice.status = INVOICE_STATUS.SENT;
    }
});

// Métodos de instancia

/**
 * Verifica si la factura puede ser editada
 */
Invoice.prototype.canBeEdited = function() {
    return this.status === INVOICE_STATUS.DRAFT && !this.voided_at;
};

/**
 * Verifica si la factura puede ser anulada
 */
Invoice.prototype.canBeVoided = function() {
    return [INVOICE_STATUS.DRAFT, INVOICE_STATUS.SENT].includes(this.status) && !this.voided_at;
};

/**
 * Verifica si la factura está vencida
 */
Invoice.prototype.isOverdue = function() {
    return this.due_date && 
           new Date() > this.due_date && 
           this.payment_status !== PAYMENT_STATUS.COMPLETED;
};

/**
 * Calcula el saldo pendiente
 */
Invoice.prototype.getBalance = function() {
    return Math.max(0, this.total_amount - this.paid_amount);
};

/**
 * Calcula los días de vencimiento
 */
Invoice.prototype.getDaysOverdue = function() {
    if (!this.isOverdue()) return 0;
    
    const today = new Date();
    const diffTime = today - this.due_date;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Añade una línea de item a la factura
 */
Invoice.prototype.addLineItem = function(item) {
    const lineItems = this.line_items || [];
    
    const newItem = {
        id: Date.now().toString(),
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: item.unit_price,
        total: (item.quantity || 1) * item.unit_price,
        tax_rate: item.tax_rate || 0,
        service_date: item.service_date || new Date()
    };
    
    lineItems.push(newItem);
    this.line_items = lineItems;
    
    // Recalcular subtotal
    this.recalculateAmounts();
};

/**
 * Elimina una línea de item
 */
Invoice.prototype.removeLineItem = function(itemId) {
    const lineItems = this.line_items || [];
    this.line_items = lineItems.filter(item => item.id !== itemId);
    this.recalculateAmounts();
};

/**
 * Recalcula todos los montos basado en las líneas de items
 */
Invoice.prototype.recalculateAmounts = function() {
    const lineItems = this.line_items || [];
    
    let subtotal = 0;
    let taxAmount = 0;
    
    lineItems.forEach(item => {
        const itemTotal = item.quantity * item.unit_price;
        subtotal += itemTotal;
        
        if (item.tax_rate > 0) {
            taxAmount += itemTotal * (item.tax_rate / 100);
        }
    });
    
    this.subtotal = subtotal;
    this.tax_amount = taxAmount;
    this.total_amount = subtotal + taxAmount - this.discount_amount;
};

/**
 * Marca la factura como enviada
 */
Invoice.prototype.markAsSent = async function(email = null) {
    this.status = INVOICE_STATUS.SENT;
    this.sent_at = new Date();
    this.sent_to_email = email || this.billing_email;
    await this.save();
};

/**
 * Registra un pago en la factura
 */
Invoice.prototype.addPayment = async function(amount, method = null, reference = null) {
    const previousPaid = this.paid_amount;
    this.paid_amount = Math.min(this.total_amount, this.paid_amount + amount);
    
    if (this.paid_amount >= this.total_amount) {
        this.payment_status = PAYMENT_STATUS.COMPLETED;
        this.status = INVOICE_STATUS.PAID;
    } else {
        this.payment_status = PAYMENT_STATUS.PARTIAL;
    }
    
    this.payment_date = new Date();
    if (method) this.payment_method = method;
    if (reference) this.payment_reference = reference;
    
    await this.save();
    
    return this.paid_amount - previousPaid; // Retorna el monto realmente pagado
};

/**
 * Anula la factura
 */
Invoice.prototype.void = async function(reason, userId = null) {
    this.status = INVOICE_STATUS.CANCELLED;
    this.voided_at = new Date();
    this.void_reason = reason;
    if (userId) this.voided_by_user_id = userId;
    await this.save();
};

/**
 * Obtiene un resumen de la factura
 */
Invoice.prototype.getSummary = function() {
    return {
        id: this.id,
        invoice_number: this.invoice_number,
        status: this.status,
        payment_status: this.payment_status,
        invoice_date: this.invoice_date,
        due_date: this.due_date,
        billing_name: this.billing_name,
        subtotal: this.subtotal,
        tax_amount: this.tax_amount,
        discount_amount: this.discount_amount,
        total_amount: this.total_amount,
        paid_amount: this.paid_amount,
        balance: this.getBalance(),
        currency: this.currency,
        is_overdue: this.isOverdue(),
        days_overdue: this.getDaysOverdue()
    };
};

// Métodos estáticos (de clase)

/**
 * Genera un número único de factura
 */
Invoice.generateInvoiceNumber = async function() {
    let invoiceNumber;
    let exists = true;
    
    while (exists) {
        // Generar número: INV + año + mes + día + 4 dígitos secuenciales
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        
        // Contar facturas del día actual
        const startOfDay = new Date(year, now.getMonth(), now.getDate());
        const endOfDay = new Date(year, now.getMonth(), now.getDate() + 1);
        
        const count = await this.count({
            where: {
                createdAt: {
                    [sequelize.Sequelize.Op.between]: [startOfDay, endOfDay]
                }
            }
        });
        
        const sequence = (count + 1).toString().padStart(4, '0');
        invoiceNumber = `INV${year}${month}${day}${sequence}`;
        
        // Verificar si ya existe
        const existing = await this.findOne({ where: { invoice_number: invoiceNumber } });
        exists = !!existing;
    }
    
    return invoiceNumber;
};

/**
 * Busca facturas por estado de pago
 */
Invoice.findByPaymentStatus = async function(paymentStatus) {
    return await this.findAll({
        where: { payment_status: paymentStatus },
        order: [['invoice_date', 'DESC']]
    });
};

/**
 * Busca facturas vencidas
 */
Invoice.findOverdue = async function() {
    return await this.findAll({
        where: {
            due_date: {
                [sequelize.Sequelize.Op.lt]: new Date()
            },
            payment_status: {
                [sequelize.Sequelize.Op.ne]: PAYMENT_STATUS.COMPLETED
            },
            voided_at: null
        },
        order: [['due_date', 'ASC']]
    });
};

/**
 * Obtiene estadísticas de facturación
 */
Invoice.getStats = async function(startDate = null, endDate = null) {
    const whereConditions = { voided_at: null };
    
    if (startDate && endDate) {
        whereConditions.invoice_date = {
            [sequelize.Sequelize.Op.between]: [startDate, endDate]
        };
    }
    
    const [total, byStatus, byPaymentStatus, totals] = await Promise.all([
        this.count({ where: whereConditions }),
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
                'payment_status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'amount']
            ],
            where: whereConditions,
            group: ['payment_status'],
            raw: true
        }),
        this.findOne({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_invoiced'],
                [sequelize.fn('SUM', sequelize.col('paid_amount')), 'total_paid'],
                [sequelize.fn('SUM', 
                    sequelize.literal('total_amount - paid_amount')
                ), 'total_pending']
            ],
            where: whereConditions,
            raw: true
        })
    ]);
    
    return {
        total_invoices: total,
        by_status: byStatus,
        by_payment_status: byPaymentStatus,
        financial_summary: totals
    };
};

module.exports = Invoice;