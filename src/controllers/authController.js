/**
 * Controlador de Autenticación - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Maneja todas las operaciones de autenticación: login, registro, 
 * recuperación de contraseña y gestión de sesiones
 */

const { User, Guest } = require('../models');
const { generateToken } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { USER_ROLES, ERROR_MESSAGES } = require('../utils/constants');
const emailService = require('../services/emailService');
const config = require('../config/environment');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Controlador de login de usuario
 */
const login = catchAsync(async (req, res) => {
    const { credential, password } = req.body;
    const clientIP = req.ip;
    const userAgent = req.get('User-Agent');

    logger.auth('Intento de login', null, {
        credential,
        ip: clientIP,
        userAgent
    });

    // Buscar usuario por email o username
    const user = await User.findByCredential(credential);
    
    if (!user) {
        logger.warn('Intento de login con credenciales inexistentes', {
            credential,
            ip: clientIP
        });
        
        return res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
        });
    }

    // Verificar si la cuenta está bloqueada
    if (user.isLocked()) {
        logger.warn('Intento de login con cuenta bloqueada', {
            userId: user.id,
            email: user.email,
            lockedUntil: user.locked_until,
            ip: clientIP
        });
        
        return res.status(401).json({
            success: false,
            message: 'Cuenta temporalmente bloqueada por múltiples intentos fallidos'
        });
    }

    // Verificar contraseña
    const isPasswordValid = await user.validatePassword(password);
    
    if (!isPasswordValid) {
        // Incrementar intentos fallidos
        await user.incrementFailedLogins();
        
        logger.warn('Intento de login con contraseña incorrecta', {
            userId: user.id,
            email: user.email,
            failedAttempts: user.failed_login_attempts + 1,
            ip: clientIP
        });
        
        return res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
        });
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
        logger.warn('Intento de login con cuenta inactiva', {
            userId: user.id,
            email: user.email,
            ip: clientIP
        });
        
        return res.status(401).json({
            success: false,
            message: 'Cuenta inactiva. Contacte al administrador.'
        });
    }

    // Login exitoso - resetear intentos fallidos y actualizar información
    await user.resetFailedLogins();
    user.last_login_ip = clientIP;
    await user.save();

    // Generar token JWT
    const token = generateToken(user.id, user.role);

    // Si el usuario es un huésped, buscar su guest_id
    const userData = user.getPublicData();
    if (user.role === USER_ROLES.GUEST) {
        const guest = await Guest.findOne({
            where: { email: user.email },
            attributes: ['id']
        });

        if (guest) {
            userData.guest_id = guest.id;
            logger.info('Guest ID agregado al perfil del usuario', {
                userId: user.id,
                guestId: guest.id
            });
        }
    }

    logger.auth('Login exitoso', user.id, {
        email: user.email,
        role: user.role,
        ip: clientIP
    });

    res.json({
        success: true,
        message: 'Login exitoso',
        data: {
            user: userData,
            token,
            expires_in: config.jwt.expiresIn
        }
    });
});

/**
 * Controlador de registro de usuario
 */
const register = catchAsync(async (req, res) => {
    const { 
        first_name, 
        last_name, 
        email, 
        username, 
        password, 
        phone,
        role = USER_ROLES.GUEST,
        language = 'es'
    } = req.body;

    logger.info('Intento de registro de usuario', {
        email,
        username,
        role,
        ip: req.ip
    });

    // Verificar que el rol solicitado es válido
    if (![USER_ROLES.GUEST, USER_ROLES.RECEPTIONIST, USER_ROLES.CLEANING].includes(role)) {
        // Solo admin puede crear usuarios con otros roles
        if (!req.user || !req.user.isAdmin()) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para crear usuarios con este rol'
            });
        }
    }

    // Crear el usuario
    const user = await User.create({
        first_name,
        last_name,
        email,
        username,
        password,
        phone,
        role,
        language,
        is_active: true,
        is_verified: false
    });

    logger.auth('Usuario registrado exitosamente', user.id, {
        email: user.email,
        username: user.username,
        role: user.role
    });

    // Generar token de verificación de email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.email_verification_token = verificationToken;
    await user.save();

    // TODO: Enviar email de verificación
    // await emailService.sendEmailVerification(user, verificationToken);

    // Generar token JWT para login automático (opcional)
    const authToken = generateToken(user.id, user.role);

    res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
            user: user.getPublicData(),
            token: authToken,
            verification_email_sent: true
        }
    });
});

/**
 * Controlador de logout (invalidar token del lado cliente)
 */
const logout = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    logger.auth('Logout', userId, {
        email: req.user.email,
        ip: req.ip
    });

    // En una implementación con blacklist de tokens, añadiríamos el token aquí
    // await TokenBlacklist.create({ token: req.token, expires_at: new Date(...) });

    res.json({
        success: true,
        message: 'Logout exitoso'
    });
});

/**
 * Controlador para obtener perfil del usuario actual
 */
const getProfile = catchAsync(async (req, res) => {
    const user = req.user;
    
    res.json({
        success: true,
        data: {
            user: user.getPublicData()
        }
    });
});

/**
 * Controlador para actualizar perfil del usuario
 */
const updateProfile = catchAsync(async (req, res) => {
    const user = req.user;
    const allowedFields = ['first_name', 'last_name', 'phone', 'language', 'avatar_url'];
    
    // Filtrar solo campos permitidos
    const updateData = {};
    Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
            updateData[key] = req.body[key];
        }
    });

    // Actualizar usuario
    await user.update(updateData);

    logger.info('Perfil actualizado', {
        userId: user.id,
        updatedFields: Object.keys(updateData)
    });

    res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: {
            user: user.getPublicData()
        }
    });
});

/**
 * Controlador para cambio de contraseña
 */
const changePassword = catchAsync(async (req, res) => {
    const { current_password, new_password } = req.body;
    const user = req.user;

    // Verificar contraseña actual
    const isCurrentPasswordValid = await user.validatePassword(current_password);
    
    if (!isCurrentPasswordValid) {
        return res.status(400).json({
            success: false,
            message: 'Contraseña actual incorrecta'
        });
    }

    // Actualizar contraseña
    user.password = new_password;
    await user.save();

    logger.auth('Contraseña cambiada', user.id, {
        email: user.email,
        ip: req.ip
    });

    res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
    });
});

/**
 * Controlador para solicitar recuperación de contraseña
 */
const requestPasswordReset = catchAsync(async (req, res) => {
    const { email } = req.body;

    logger.info('Solicitud de recuperación de contraseña', {
        email,
        ip: req.ip
    });

    // Buscar usuario por email
    const user = await User.findOne({ where: { email } });

    // Siempre responder exitosamente por seguridad
    // (no revelar si el email existe o no)
    const successResponse = {
        success: true,
        message: 'Si el correo existe en nuestro sistema, recibirá un enlace de recuperación'
    };

    if (!user) {
        logger.warn('Solicitud de reset para email inexistente', { email });
        return res.json(successResponse);
    }

    if (!user.is_active) {
        logger.warn('Solicitud de reset para cuenta inactiva', {
            userId: user.id,
            email
        });
        return res.json(successResponse);
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    user.password_reset_token = resetToken;
    user.password_reset_expires = resetExpires;
    await user.save();

    // Crear URL de reset
    const resetUrl = `${config.server.frontendUrl}/reset-password/${resetToken}`;

    // Enviar email de recuperación - DESHABILITADO
    // try {
    //     await emailService.sendPasswordReset(user, resetToken, resetUrl);
    //
    //     logger.auth('Email de recuperación enviado', user.id, {
    //         email,
    //         resetToken
    //     });
    // } catch (error) {
    //     // Si falla el envío del email, limpiar token
    //     user.password_reset_token = null;
    //     user.password_reset_expires = null;
    //     await user.save();
    //
    //     logger.error('Error enviando email de recuperación', error, {
    //         userId: user.id,
    //         email
    //     });
    //
    //     return res.status(500).json({
    //         success: false,
    //         message: 'Error enviando email de recuperación'
    //     });
    // }

    logger.auth('Token de recuperación generado (email deshabilitado)', user.id, {
        email,
        resetToken
    });

    res.json(successResponse);
});

/**
 * Controlador para restablecer contraseña con token
 */
const resetPassword = catchAsync(async (req, res) => {
    const { token } = req.params;
    const { new_password } = req.body;

    logger.info('Intento de reset de contraseña', {
        token,
        ip: req.ip
    });

    // El middleware verifyResetToken ya validó el token y añadió el usuario
    const user = req.user;

    // Actualizar contraseña y limpiar tokens de reset
    user.password = new_password;
    user.password_reset_token = null;
    user.password_reset_expires = null;
    user.failed_login_attempts = 0; // Resetear intentos fallidos
    user.locked_until = null;
    await user.save();

    logger.auth('Contraseña restablecida exitosamente', user.id, {
        email: user.email,
        ip: req.ip
    });

    res.json({
        success: true,
        message: 'Contraseña restablecida exitosamente'
    });
});

/**
 * Controlador para verificar email con token
 */
const verifyEmail = catchAsync(async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({
        where: {
            email_verification_token: token,
            is_verified: false
        }
    });

    if (!user) {
        return res.status(400).json({
            success: false,
            message: 'Token de verificación inválido o expirado'
        });
    }

    // Verificar email
    user.is_verified = true;
    user.email_verification_token = null;
    await user.save();

    logger.auth('Email verificado', user.id, {
        email: user.email
    });

    res.json({
        success: true,
        message: 'Email verificado exitosamente',
        data: {
            user: user.getPublicData()
        }
    });
});

/**
 * Controlador para reenviar email de verificación
 */
const resendVerificationEmail = catchAsync(async (req, res) => {
    const user = req.user;

    if (user.is_verified) {
        return res.status(400).json({
            success: false,
            message: 'El email ya está verificado'
        });
    }

    // Generar nuevo token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.email_verification_token = verificationToken;
    await user.save();

    // TODO: Enviar email de verificación
    // await emailService.sendEmailVerification(user, verificationToken);

    logger.info('Email de verificación reenviado', {
        userId: user.id,
        email: user.email
    });

    res.json({
        success: true,
        message: 'Email de verificación enviado'
    });
});

/**
 * Controlador para validar token (verificar si es válido sin usarlo)
 */
const validateToken = catchAsync(async (req, res) => {
    // Si llegamos aquí, el token es válido (validado por middleware de autenticación)
    const user = req.user;

    res.json({
        success: true,
        message: 'Token válido',
        data: {
            user: user.getPublicData(),
            expires_in: config.jwt.expiresIn
        }
    });
});

/**
 * Controlador para obtener información de configuración pública
 */
const getPublicConfig = catchAsync(async (req, res) => {
    res.json({
        success: true,
        data: {
            hotel_name: 'Hotel Mar Azul',
            supported_languages: ['es', 'en'],
            default_language: 'es',
            contact: {
                phone: '+502 7940-0000',
                email: 'info@hotelmarazul.com',
                address: 'Salamá, Baja Verapaz, Guatemala'
            },
            features: {
                online_booking: true,
                mobile_checkin: true,
                multilingual: true,
                payment_methods: ['credit_card', 'debit_card', 'cash', 'bank_transfer']
            }
        }
    });
});

/**
 * Controlador para refrescar token (si se implementa)
 */
const refreshToken = catchAsync(async (req, res) => {
    const user = req.user;
    
    // Generar nuevo token
    const newToken = generateToken(user.id, user.role);

    logger.auth('Token refrescado', user.id, {
        email: user.email,
        ip: req.ip
    });

    res.json({
        success: true,
        message: 'Token refrescado exitosamente',
        data: {
            token: newToken,
            expires_in: config.jwt.expiresIn,
            user: user.getPublicData()
        }
    });
});

module.exports = {
    login,
    register,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    validateToken,
    getPublicConfig,
    refreshToken
};