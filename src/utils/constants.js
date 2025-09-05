/**
 * Constantes del Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Este archivo contiene todas las constantes utilizadas en la aplicación
 * para mantener consistencia y facilitar el mantenimiento
 */

// Roles de usuario en el sistema
const USER_ROLES = {
    GUEST: 'guest',           // Huésped
    RECEPTIONIST: 'receptionist', // Recepcionista  
    CLEANING: 'cleaning',     // Personal de limpieza
    MANAGER: 'manager',       // Gerencia
    ADMIN: 'admin'           // Administrador del sistema
};

// Estados de las habitaciones
const ROOM_STATUS = {
    AVAILABLE: 'available',   // Disponible
    OCCUPIED: 'occupied',     // Ocupada
    CLEANING: 'cleaning',     // En limpieza
    MAINTENANCE: 'maintenance', // En mantenimiento
    OUT_OF_ORDER: 'out_of_order' // Fuera de servicio
};

// Categorías de habitaciones
const ROOM_CATEGORIES = {
    STANDARD: 'standard',     // Estándar
    DELUXE: 'deluxe',        // Deluxe
    SUITE: 'suite',          // Suite
    PRESIDENTIAL: 'presidential' // Presidencial
};

// Estados de las reservas
const RESERVATION_STATUS = {
    PENDING: 'pending',       // Pendiente de confirmación
    CONFIRMED: 'confirmed',   // Confirmada
    CHECKED_IN: 'checked_in', // Check-in realizado
    CHECKED_OUT: 'checked_out', // Check-out realizado
    CANCELLED: 'cancelled',   // Cancelada
    NO_SHOW: 'no_show'       // No se presentó
};

// Estados de los pagos
const PAYMENT_STATUS = {
    PENDING: 'pending',       // Pendiente
    COMPLETED: 'completed',   // Completado
    FAILED: 'failed',         // Fallido
    REFUNDED: 'refunded',     // Reembolsado
    PARTIAL: 'partial'        // Pago parcial
};

// Métodos de pago disponibles
const PAYMENT_METHODS = {
    CREDIT_CARD: 'credit_card', // Tarjeta de crédito
    DEBIT_CARD: 'debit_card',   // Tarjeta de débito
    CASH: 'cash',               // Efectivo
    BANK_TRANSFER: 'bank_transfer', // Transferencia bancaria
    STRIPE: 'stripe'            // Stripe
};

// Tipos de servicios adicionales
const SERVICE_TYPES = {
    RESTAURANT: 'restaurant',   // Restaurante
    SPA: 'spa',                // Spa
    TRANSPORT: 'transport',     // Transporte
    LAUNDRY: 'laundry',        // Lavandería
    ROOM_SERVICE: 'room_service', // Servicio a la habitación
    MINIBAR: 'minibar',        // Minibar
    PARKING: 'parking',        // Estacionamiento
    WIFI: 'wifi'               // Internet WiFi
};

// Estados de incidencias
const INCIDENT_STATUS = {
    REPORTED: 'reported',     // Reportada
    IN_PROGRESS: 'in_progress', // En progreso
    RESOLVED: 'resolved',     // Resuelta
    CANCELLED: 'cancelled'    // Cancelada
};

// Prioridades de incidencias
const INCIDENT_PRIORITY = {
    LOW: 'low',              // Baja
    MEDIUM: 'medium',        // Media
    HIGH: 'high',            // Alta
    URGENT: 'urgent'         // Urgente
};

// Tipos de incidencias
const INCIDENT_TYPES = {
    MAINTENANCE: 'maintenance', // Mantenimiento
    CLEANING: 'cleaning',      // Limpieza
    TECHNICAL: 'technical',    // Técnico
    SECURITY: 'security',      // Seguridad
    OTHER: 'other'            // Otro
};

// Idiomas soportados por el sistema
const SUPPORTED_LANGUAGES = {
    ES: 'es', // Español
    EN: 'en', // Inglés
    FR: 'fr', // Francés
    DE: 'de', // Alemán
    PT: 'pt'  // Portugués
};

// Tipos de reportes disponibles
const REPORT_TYPES = {
    OCCUPANCY: 'occupancy',   // Ocupación
    SALES: 'sales',           // Ventas
    GUESTS: 'guests',         // Huéspedes
    ROOMS: 'rooms',           // Habitaciones
    INCIDENTS: 'incidents',   // Incidencias
    FINANCIAL: 'financial'    // Financiero
};

// Formatos de exportación de reportes
const EXPORT_FORMATS = {
    PDF: 'pdf',
    EXCEL: 'excel', 
    CSV: 'csv',
    JSON: 'json'
};

// Estados de facturas
const INVOICE_STATUS = {
    DRAFT: 'draft',           // Borrador
    SENT: 'sent',            // Enviada
    PAID: 'paid',            // Pagada
    OVERDUE: 'overdue',      // Vencida
    CANCELLED: 'cancelled'    // Cancelada
};

// Tipos de notificaciones
const NOTIFICATION_TYPES = {
    RESERVATION: 'reservation', // Reserva
    CHECKIN: 'checkin',        // Check-in
    CHECKOUT: 'checkout',      // Check-out
    PAYMENT: 'payment',        // Pago
    INCIDENT: 'incident',      // Incidencia
    MAINTENANCE: 'maintenance', // Mantenimiento
    SYSTEM: 'system'          // Sistema
};

// Canales de notificación
const NOTIFICATION_CHANNELS = {
    EMAIL: 'email',           // Correo electrónico
    SMS: 'sms',              // SMS
    PUSH: 'push',            // Notificación push
    IN_APP: 'in_app'         // En la aplicación
};

// Configuración de paginación por defecto
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

// Configuración de validaciones
const VALIDATION = {
    PASSWORD_MIN_LENGTH: 8,
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 50,
    EMAIL_MAX_LENGTH: 100,
    PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
};

// Configuración de archivos
const FILE_CONFIG = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    UPLOAD_DIR: 'uploads/'
};

// Mensajes de error comunes
const ERROR_MESSAGES = {
    UNAUTHORIZED: 'No autorizado',
    FORBIDDEN: 'Acceso denegado',
    NOT_FOUND: 'Recurso no encontrado',
    VALIDATION_ERROR: 'Error de validación',
    SERVER_ERROR: 'Error interno del servidor',
    ROOM_NOT_AVAILABLE: 'Habitación no disponible',
    INVALID_DATES: 'Fechas inválidas',
    PAYMENT_FAILED: 'Error en el pago'
};

// Exportar todas las constantes
module.exports = {
    USER_ROLES,
    ROOM_STATUS,
    ROOM_CATEGORIES,
    RESERVATION_STATUS,
    PAYMENT_STATUS,
    PAYMENT_METHODS,
    SERVICE_TYPES,
    INCIDENT_STATUS,
    INCIDENT_PRIORITY,
    INCIDENT_TYPES,
    SUPPORTED_LANGUAGES,
    REPORT_TYPES,
    EXPORT_FORMATS,
    INVOICE_STATUS,
    NOTIFICATION_TYPES,
    NOTIFICATION_CHANNELS,
    PAGINATION,
    VALIDATION,
    FILE_CONFIG,
    ERROR_MESSAGES
};