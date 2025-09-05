/**
 * Rutas de Autenticación - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Define todas las rutas relacionadas con autenticación, registro,
 * recuperación de contraseña y gestión de perfil de usuario
 */

const express = require('express');
const router = express.Router();

// Importar controladores
const authController = require('../controllers/authController');

// Importar middlewares
const { 
    authenticateToken, 
    loginRateLimit, 
    verifyResetToken 
} = require('../middleware/auth');

const {
    validateLogin,
    validateRegister,
    validatePasswordChange,
    handleValidationErrors
} = require('../middleware/validation');

// Rutas públicas (sin autenticación)

/**
 * POST /api/auth/login
 * Login de usuario con email/username y contraseña
 */
router.post('/login', 
    loginRateLimit,  // Limitar intentos de login
    validateLogin,   // Validar datos de entrada
    authController.login
);

/**
 * POST /api/auth/register
 * Registro de nuevo usuario
 */
router.post('/register', 
    validateRegister,
    authController.register
);

/**
 * POST /api/auth/forgot-password
 * Solicitar recuperación de contraseña
 */
router.post('/forgot-password', 
    [
        require('express-validator').body('email')
            .isEmail()
            .withMessage('Email válido requerido')
            .normalizeEmail(),
        handleValidationErrors
    ],
    authController.requestPasswordReset
);

/**
 * POST /api/auth/reset-password/:token
 * Restablecer contraseña con token
 */
router.post('/reset-password/:token', 
    [
        require('express-validator').param('token')
            .notEmpty()
            .withMessage('Token requerido'),
        require('express-validator').body('new_password')
            .isLength({ min: 8 })
            .withMessage('La contraseña debe tener al menos 8 caracteres')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
        handleValidationErrors
    ],
    verifyResetToken,  // Verificar que el token sea válido
    authController.resetPassword
);

/**
 * GET /api/auth/verify-email/:token
 * Verificar email con token
 */
router.get('/verify-email/:token', 
    [
        require('express-validator').param('token')
            .notEmpty()
            .withMessage('Token de verificación requerido'),
        handleValidationErrors
    ],
    authController.verifyEmail
);

/**
 * GET /api/auth/config
 * Obtener configuración pública del sistema
 */
router.get('/config', authController.getPublicConfig);

// Rutas protegidas (requieren autenticación)

/**
 * POST /api/auth/logout
 * Logout de usuario (invalidar token)
 */
router.post('/logout', 
    authenticateToken,
    authController.logout
);

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario actual
 */
router.get('/profile', 
    authenticateToken,
    authController.getProfile
);

/**
 * PUT /api/auth/profile
 * Actualizar perfil del usuario actual
 */
router.put('/profile', 
    authenticateToken,
    [
        require('express-validator').body('first_name')
            .optional()
            .isLength({ min: 2, max: 50 })
            .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
        require('express-validator').body('last_name')
            .optional()
            .isLength({ min: 2, max: 50 })
            .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
        require('express-validator').body('phone')
            .optional()
            .matches(/^\+?[\d\s\-\(\)]+$/)
            .withMessage('Formato de teléfono inválido'),
        require('express-validator').body('language')
            .optional()
            .isIn(['es', 'en', 'fr', 'de', 'pt'])
            .withMessage('Idioma no soportado'),
        handleValidationErrors
    ],
    authController.updateProfile
);

/**
 * POST /api/auth/change-password
 * Cambiar contraseña del usuario actual
 */
router.post('/change-password', 
    authenticateToken,
    validatePasswordChange,
    authController.changePassword
);

/**
 * POST /api/auth/resend-verification
 * Reenviar email de verificación
 */
router.post('/resend-verification', 
    authenticateToken,
    authController.resendVerificationEmail
);

/**
 * GET /api/auth/validate-token
 * Validar si el token actual es válido
 */
router.get('/validate-token', 
    authenticateToken,
    authController.validateToken
);

/**
 * POST /api/auth/refresh-token
 * Refrescar token de acceso
 */
router.post('/refresh-token', 
    authenticateToken,
    authController.refreshToken
);

module.exports = router;