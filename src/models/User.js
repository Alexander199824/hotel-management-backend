/**
 * Modelo User - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Define el modelo de usuarios del sistema (huéspedes, recepcionistas, limpieza, gerencia)
 * Incluye métodos para autenticación y validación de permisos
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { USER_ROLES, VALIDATION } = require('../utils/constants');

const User = sequelize.define('User', {
    // Identificador único del usuario
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: 'Identificador único del usuario'
    },

    // Información básica del usuario
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
        comment: 'Nombre del usuario'
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
        comment: 'Apellido del usuario'
    },

    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            name: 'email_unique',
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
        comment: 'Correo electrónico único del usuario'
    },

    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            name: 'username_unique',
            msg: 'El nombre de usuario ya está en uso'
        },
        validate: {
            len: {
                args: [VALIDATION.USERNAME_MIN_LENGTH, VALIDATION.USERNAME_MAX_LENGTH],
                msg: `El nombre de usuario debe tener entre ${VALIDATION.USERNAME_MIN_LENGTH} y ${VALIDATION.USERNAME_MAX_LENGTH} caracteres`
            },
            isAlphanumeric: {
                msg: 'El nombre de usuario solo puede contener letras y números'
            }
        },
        comment: 'Nombre de usuario único para login'
    },

    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: {
                args: [VALIDATION.PASSWORD_MIN_LENGTH, 255],
                msg: `La contraseña debe tener al menos ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`
            }
        },
        comment: 'Contraseña hasheada del usuario'
    },

    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
            is: {
                args: VALIDATION.PHONE_REGEX,
                msg: 'Formato de teléfono inválido'
            }
        },
        comment: 'Número de teléfono del usuario'
    },

    // Rol y permisos - Cambiado de ENUM a STRING con validación
    role: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: USER_ROLES.GUEST,
        validate: {
            isIn: {
                args: [Object.values(USER_ROLES)],
                msg: 'Rol de usuario inválido'
            }
        },
        comment: 'Rol del usuario en el sistema'
    },

    // Estado del usuario
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Indica si el usuario está activo en el sistema'
    },

    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si el usuario ha verificado su correo electrónico'
    },

    // Información adicional
    language: {
        type: DataTypes.STRING(2),
        defaultValue: 'es',
        validate: {
            isIn: {
                args: [['es', 'en', 'fr', 'de', 'pt']],
                msg: 'Idioma no soportado'
            }
        },
        comment: 'Idioma preferido del usuario'
    },

    avatar_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isUrl: {
                msg: 'URL de avatar inválida'
            }
        },
        comment: 'URL del avatar del usuario'
    },

    // Campos de auditoría para seguridad
    last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha y hora del último login'
    },

    last_login_ip: {
        type: DataTypes.INET,
        allowNull: true,
        comment: 'IP del último login'
    },

    failed_login_attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Número de intentos fallidos de login'
    },

    locked_until: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha hasta la cual la cuenta está bloqueada'
    },

    password_reset_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Token para reseteo de contraseña'
    },

    password_reset_expires: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha de expiración del token de reseteo'
    },

    email_verification_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Token para verificación de correo'
    }
}, {
    tableName: 'users',
    timestamps: true,
    
    // Índices para mejorar rendimiento
    indexes: [
        {
            fields: ['email'],
            unique: true
        },
        {
            fields: ['username'],
            unique: true
        },
        {
            fields: ['role']
        },
        {
            fields: ['is_active']
        },
        {
            fields: ['last_login_at']
        }
    ],

    // Configuración de validación a nivel de modelo
    validate: {
        // Validar que el email y username no sean iguales
        emailUsernameNotSame() {
            if (this.email === this.username) {
                throw new Error('El correo y nombre de usuario no pueden ser iguales');
            }
        }
    }
});

// Hooks del modelo (ejecutados automáticamente)

// Hook: Antes de crear un usuario
User.beforeCreate(async (user, options) => {
    // Hash de la contraseña antes de guardar
    if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
    }
    
    // Convertir email y username a minúsculas
    user.email = user.email.toLowerCase();
    user.username = user.username.toLowerCase();
});

// Hook: Antes de actualizar un usuario
User.beforeUpdate(async (user, options) => {
    // Si se cambió la contraseña, hashearla
    if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
    }
    
    // Actualizar email y username a minúsculas si cambiaron
    if (user.changed('email')) {
        user.email = user.email.toLowerCase();
    }
    if (user.changed('username')) {
        user.username = user.username.toLowerCase();
    }
});

// Métodos de instancia

/**
 * Verifica si la contraseña proporcionada coincide con la del usuario
 */
User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

/**
 * Verifica si el usuario tiene un rol específico
 */
User.prototype.hasRole = function(role) {
    return this.role === role;
};

/**
 * Verifica si el usuario tiene permisos de administrador
 */
User.prototype.isAdmin = function() {
    return this.role === USER_ROLES.ADMIN;
};

/**
 * Verifica si el usuario es gerente o administrador
 */
User.prototype.isManager = function() {
    return [USER_ROLES.MANAGER, USER_ROLES.ADMIN].includes(this.role);
};

/**
 * Verifica si el usuario es personal del hotel
 */
User.prototype.isStaff = function() {
    return [USER_ROLES.RECEPTIONIST, USER_ROLES.CLEANING, USER_ROLES.MANAGER, USER_ROLES.ADMIN].includes(this.role);
};

/**
 * Verifica si la cuenta está bloqueada
 */
User.prototype.isLocked = function() {
    return this.locked_until && this.locked_until > new Date();
};

/**
 * Incrementa los intentos fallidos de login
 */
User.prototype.incrementFailedLogins = async function() {
    this.failed_login_attempts += 1;
    
    // Bloquear cuenta después de 5 intentos fallidos
    if (this.failed_login_attempts >= 5) {
        this.locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    }
    
    await this.save();
};

/**
 * Resetea los intentos fallidos de login
 */
User.prototype.resetFailedLogins = async function() {
    this.failed_login_attempts = 0;
    this.locked_until = null;
    this.last_login_at = new Date();
    await this.save();
};

/**
 * Obtiene el nombre completo del usuario
 */
User.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
};

/**
 * Obtiene los datos públicos del usuario (sin información sensible)
 */
User.prototype.getPublicData = function() {
    return {
        id: this.id,
        first_name: this.first_name,
        last_name: this.last_name,
        email: this.email,
        username: this.username,
        role: this.role,
        language: this.language,
        avatar_url: this.avatar_url,
        is_active: this.is_active,
        is_verified: this.is_verified,
        created_at: this.createdAt,
        updated_at: this.updatedAt
    };
};

// Métodos estáticos (de clase)

/**
 * Busca un usuario por email o username
 */
User.findByCredential = async function(credential) {
    return await this.findOne({
        where: {
            [sequelize.Sequelize.Op.or]: [
                { email: credential.toLowerCase() },
                { username: credential.toLowerCase() }
            ]
        }
    });
};

/**
 * Crea un usuario administrador por defecto
 */
User.createDefaultAdmin = async function() {
    const adminExists = await this.findOne({ where: { role: USER_ROLES.ADMIN } });
    
    if (!adminExists) {
        return await this.create({
            first_name: 'Administrador',
            last_name: 'Sistema',
            email: 'admin@hotelmarazul.com',
            username: 'admin',
            password: 'Admin123!',
            role: USER_ROLES.ADMIN,
            is_active: true,
            is_verified: true
        });
    }
    
    return adminExists;
};

module.exports = User;