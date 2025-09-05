/**
 * Modelo Guest - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Define el modelo de huéspedes que realizan reservas en el hotel
 * Incluye información personal, contacto y preferencias
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { VALIDATION } = require('../utils/constants');

const Guest = sequelize.define('Guest', {
    // Identificador único del huésped
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: 'Identificador único del huésped'
    },

    // Información personal básica
    first_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El nombre es requerido'
            },
            len: {
                args: [2, 50],
                msg: 'El nombre debe tener entre 2 y 50 caracteres'
            }
        },
        comment: 'Nombre del huésped'
    },

    last_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El apellido es requerido'
            },
            len: {
                args: [2, 50],
                msg: 'El apellido debe tener entre 2 y 50 caracteres'
            }
        },
        comment: 'Apellido del huésped'
    },

    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            name: 'guest_email_unique',
            msg: 'El correo electrónico ya está registrado'
        },
        validate: {
            isEmail: {
                msg: 'Debe proporcionar un correo electrónico válido'
            },
            len: {
                args: [5, 100],
                msg: 'El correo debe tener entre 5 y 100 caracteres'
            }
        },
        comment: 'Correo electrónico del huésped'
    },

    phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El teléfono es requerido'
            },
            is: {
                args: VALIDATION.PHONE_REGEX,
                msg: 'Formato de teléfono inválido'
            }
        },
        comment: 'Número de teléfono principal'
    },

    alternative_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
            is: {
                args: VALIDATION.PHONE_REGEX,
                msg: 'Formato de teléfono alternativo inválido'
            }
        },
        comment: 'Número de teléfono alternativo'
    },

    // Información de identificación
    document_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: {
                args: [['passport', 'national_id', 'driver_license', 'other']],
                msg: 'Tipo de documento inválido'
            }
        },
        comment: 'Tipo de documento de identificación'
    },

    document_number: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El número de documento es requerido'
            },
            len: {
                args: [5, 30],
                msg: 'El número de documento debe tener entre 5 y 30 caracteres'
            }
        },
        comment: 'Número del documento de identificación'
    },

    document_country: {
        type: DataTypes.STRING(3),
        allowNull: false,
        validate: {
            len: {
                args: [2, 3],
                msg: 'El código de país debe tener 2 o 3 caracteres'
            },
            isUppercase: {
                msg: 'El código de país debe estar en mayúsculas'
            }
        },
        comment: 'País emisor del documento (código ISO)'
    },

    // Información demográfica
    date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: {
                msg: 'Fecha de nacimiento inválida'
            },
            isBefore: {
                args: new Date().toISOString().split('T')[0],
                msg: 'La fecha de nacimiento debe ser anterior a hoy'
            }
        },
        comment: 'Fecha de nacimiento'
    },

    gender: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
            isIn: {
                args: [['male', 'female', 'other', 'prefer_not_to_say']],
                msg: 'Género inválido'
            }
        },
        comment: 'Género del huésped'
    },

    nationality: {
        type: DataTypes.STRING(3),
        allowNull: true,
        validate: {
            len: {
                args: [2, 3],
                msg: 'El código de nacionalidad debe tener 2 o 3 caracteres'
            },
            isUppercase: {
                msg: 'El código de nacionalidad debe estar en mayúsculas'
            }
        },
        comment: 'Nacionalidad (código ISO)'
    },

    // Información de dirección
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: {
                args: [0, 500],
                msg: 'La dirección no puede exceder 500 caracteres'
            }
        },
        comment: 'Dirección completa'
    },

    city: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: {
                args: [0, 100],
                msg: 'La ciudad no puede exceder 100 caracteres'
            }
        },
        comment: 'Ciudad de residencia'
    },

    state_province: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: {
                args: [0, 100],
                msg: 'El estado/provincia no puede exceder 100 caracteres'
            }
        },
        comment: 'Estado o provincia'
    },

    postal_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
            len: {
                args: [0, 20],
                msg: 'El código postal no puede exceder 20 caracteres'
            }
        },
        comment: 'Código postal'
    },

    country: {
        type: DataTypes.STRING(3),
        allowNull: true,
        validate: {
            len: {
                args: [2, 3],
                msg: 'El código de país debe tener 2 o 3 caracteres'
            },
            isUppercase: {
                msg: 'El código de país debe estar en mayúsculas'
            }
        },
        comment: 'País de residencia (código ISO)'
    },

    // Preferencias del huésped
    language: {
        type: DataTypes.STRING(2),
        allowNull: false,
        defaultValue: 'es',
        validate: {
            isIn: {
                args: [['es', 'en', 'fr', 'de', 'pt']],
                msg: 'Idioma no soportado'
            }
        },
        comment: 'Idioma preferido'
    },

    dietary_restrictions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Restricciones dietéticas en formato JSON'
    },

    special_needs: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: {
                args: [0, 1000],
                msg: 'Las necesidades especiales no pueden exceder 1000 caracteres'
            }
        },
        comment: 'Necesidades especiales o discapacidades'
    },

    preferences: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: 'Preferencias del huésped en formato JSON'
    },

    // Información de marketing
    newsletter_subscription: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Suscripción a newsletter'
    },

    marketing_emails: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Acepta recibir emails de marketing'
    },

    how_did_you_hear: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Cómo se enteró del hotel'
    },

    // Información de lealtad
    loyalty_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: {
            name: 'loyalty_number_unique',
            msg: 'El número de lealtad ya existe'
        },
        comment: 'Número de programa de lealtad'
    },

    vip_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Estatus VIP del huésped'
    },

    // Información de emergencia
    emergency_contact_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Nombre del contacto de emergencia'
    },

    emergency_contact_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
            is: {
                args: VALIDATION.PHONE_REGEX,
                msg: 'Formato de teléfono de emergencia inválido'
            }
        },
        comment: 'Teléfono del contacto de emergencia'
    },

    emergency_contact_relationship: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Relación con el contacto de emergencia'
    },

    // Notas internas
    internal_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas internas del staff sobre el huésped'
    },

    // Estado del huésped
    is_blacklisted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si el huésped está en lista negra'
    },

    blacklist_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Razón de estar en lista negra'
    },

    // Información de estadía anterior
    last_stay_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha de la última estadía'
    },

    total_stays: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Total de estadías realizadas'
    },

    total_spent: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        comment: 'Total gastado en el hotel'
    }
}, {
    tableName: 'guests',
    timestamps: true,
    
    // Índices para mejorar rendimiento
    indexes: [
        {
            fields: ['email'],
            unique: true
        },
        {
            fields: ['document_number', 'document_country'],
            unique: true
        },
        {
            fields: ['loyalty_number'],
            unique: true,
            where: {
                loyalty_number: {
                    [sequelize.Sequelize.Op.ne]: null
                }
            }
        },
        {
            fields: ['last_name', 'first_name']
        },
        {
            fields: ['phone']
        },
        {
            fields: ['nationality']
        },
        {
            fields: ['vip_status']
        },
        {
            fields: ['last_stay_date']
        }
    ],

    // Configuración de validación a nivel de modelo
    validate: {
        // Validar que si está en lista negra tenga una razón
        blacklistValidation() {
            if (this.is_blacklisted && !this.blacklist_reason) {
                throw new Error('Debe especificar la razón para estar en lista negra');
            }
        },

        // Validar que la fecha de nacimiento sea coherente
        ageValidation() {
            if (this.date_of_birth) {
                const today = new Date();
                const birthDate = new Date(this.date_of_birth);
                const age = today.getFullYear() - birthDate.getFullYear();
                
                if (age > 120) {
                    throw new Error('La edad no puede ser mayor a 120 años');
                }
            }
        }
    }
});

// Hooks del modelo

// Hook: Antes de crear un huésped
Guest.beforeCreate(async (guest, options) => {
    // Convertir email a minúsculas
    guest.email = guest.email.toLowerCase();
    
    // Convertir códigos de país a mayúsculas
    if (guest.document_country) {
        guest.document_country = guest.document_country.toUpperCase();
    }
    if (guest.nationality) {
        guest.nationality = guest.nationality.toUpperCase();
    }
    if (guest.country) {
        guest.country = guest.country.toUpperCase();
    }
    
    // Generar número de lealtad si es VIP
    if (guest.vip_status && !guest.loyalty_number) {
        guest.loyalty_number = await Guest.generateLoyaltyNumber();
    }
});

// Hook: Antes de actualizar un huésped
Guest.beforeUpdate(async (guest, options) => {
    // Actualizar email a minúsculas si cambió
    if (guest.changed('email')) {
        guest.email = guest.email.toLowerCase();
    }
    
    // Convertir códigos de país a mayúsculas si cambiaron
    if (guest.changed('document_country') && guest.document_country) {
        guest.document_country = guest.document_country.toUpperCase();
    }
    if (guest.changed('nationality') && guest.nationality) {
        guest.nationality = guest.nationality.toUpperCase();
    }
    if (guest.changed('country') && guest.country) {
        guest.country = guest.country.toUpperCase();
    }
    
    // Generar número de lealtad si se volvió VIP
    if (guest.changed('vip_status') && guest.vip_status && !guest.loyalty_number) {
        guest.loyalty_number = await Guest.generateLoyaltyNumber();
    }
});

// Métodos de instancia

/**
 * Obtiene el nombre completo del huésped
 */
Guest.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
};

/**
 * Calcula la edad del huésped
 */
Guest.prototype.getAge = function() {
    if (!this.date_of_birth) return null;
    
    const today = new Date();
    const birthDate = new Date(this.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
};

/**
 * Verifica si el huésped puede hacer reservas
 */
Guest.prototype.canMakeReservations = function() {
    return !this.is_blacklisted;
};

/**
 * Actualiza estadísticas después de una estadía
 */
Guest.prototype.updateStayStats = async function(amount) {
    this.total_stays += 1;
    this.total_spent += amount;
    this.last_stay_date = new Date();
    
    // Considerar para estatus VIP si ha gastado mucho
    if (this.total_spent >= 10000 && !this.vip_status) {
        this.vip_status = true;
        if (!this.loyalty_number) {
            this.loyalty_number = await Guest.generateLoyaltyNumber();
        }
    }
    
    await this.save();
};

/**
 * Obtiene las preferencias como objeto
 */
Guest.prototype.getPreferences = function() {
    return {
        language: this.language,
        dietary_restrictions: this.dietary_restrictions || [],
        special_needs: this.special_needs,
        preferences: this.preferences || {},
        newsletter_subscription: this.newsletter_subscription,
        marketing_emails: this.marketing_emails
    };
};

/**
 * Obtiene información de contacto completa
 */
Guest.prototype.getContactInfo = function() {
    return {
        email: this.email,
        phone: this.phone,
        alternative_phone: this.alternative_phone,
        address: this.address,
        city: this.city,
        state_province: this.state_province,
        postal_code: this.postal_code,
        country: this.country,
        emergency_contact: {
            name: this.emergency_contact_name,
            phone: this.emergency_contact_phone,
            relationship: this.emergency_contact_relationship
        }
    };
};

/**
 * Obtiene los datos públicos del huésped (sin información sensible)
 */
Guest.prototype.getPublicData = function() {
    return {
        id: this.id,
        first_name: this.first_name,
        last_name: this.last_name,
        email: this.email,
        phone: this.phone,
        language: this.language,
        vip_status: this.vip_status,
        total_stays: this.total_stays,
        created_at: this.createdAt
    };
};

// Métodos estáticos (de clase)

/**
 * Genera un número único de lealtad
 */
Guest.generateLoyaltyNumber = async function() {
    let loyaltyNumber;
    let exists = true;
    
    while (exists) {
        // Generar número: VIP + año + 6 dígitos random
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        loyaltyNumber = `VIP${year}${random}`;
        
        // Verificar si ya existe
        const existing = await this.findOne({ where: { loyalty_number: loyaltyNumber } });
        exists = !!existing;
    }
    
    return loyaltyNumber;
};

/**
 * Busca huéspedes por nombre o email
 */
Guest.searchByNameOrEmail = async function(query) {
    return await this.findAll({
        where: {
            [sequelize.Sequelize.Op.or]: [
                {
                    first_name: {
                        [sequelize.Sequelize.Op.iLike]: `%${query}%`
                    }
                },
                {
                    last_name: {
                        [sequelize.Sequelize.Op.iLike]: `%${query}%`
                    }
                },
                {
                    email: {
                        [sequelize.Sequelize.Op.iLike]: `%${query}%`
                    }
                }
            ]
        },
        order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });
};

/**
 * Obtiene huéspedes VIP
 */
Guest.getVipGuests = async function() {
    return await this.findAll({
        where: { vip_status: true },
        order: [['total_spent', 'DESC']]
    });
};

/**
 * Obtiene estadísticas de huéspedes
 */
Guest.getStats = async function() {
    const [total, vipCount, byNationality] = await Promise.all([
        this.count(),
        this.count({ where: { vip_status: true } }),
        this.findAll({
            attributes: [
                'nationality',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                nationality: {
                    [sequelize.Sequelize.Op.ne]: null
                }
            },
            group: ['nationality'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
            limit: 10,
            raw: true
        })
    ]);
    
    return {
        total,
        vip_count: vipCount,
        vip_percentage: total > 0 ? (vipCount / total * 100).toFixed(2) : 0,
        top_nationalities: byNationality
    };
};

module.exports = Guest;