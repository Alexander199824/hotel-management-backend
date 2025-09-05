/**
 * Sistema de logging para Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Este archivo configura un sistema de logging robusto que registra
 * diferentes niveles de información para debugging y monitoreo
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/environment');

// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Niveles de log disponibles
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

// Colores para logs en consola
const COLORS = {
    ERROR: '\x1b[31m',   // Rojo
    WARN: '\x1b[33m',    // Amarillo
    INFO: '\x1b[36m',    // Cyan
    DEBUG: '\x1b[35m',   // Magenta
    RESET: '\x1b[0m'     // Reset color
};

/**
 * Clase Logger personalizada para el sistema hotelero
 */
class Logger {
    constructor() {
        this.level = this.getLevelFromConfig(config.logging.level);
        this.logToFile = config.server.environment === 'production';
        this.logToConsole = config.server.environment === 'development';
        
        // Crear archivos de log separados por nivel
        this.errorLogPath = path.join(logsDir, 'error.log');
        this.combinedLogPath = path.join(logsDir, 'combined.log');
        this.accessLogPath = path.join(logsDir, 'access.log');
    }

    /**
     * Convierte el string de nivel de config a número
     */
    getLevelFromConfig(levelString) {
        const level = levelString.toUpperCase();
        return LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : LOG_LEVELS.INFO;
    }

    /**
     * Formatea el mensaje de log con timestamp y metadata
     */
    formatMessage(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const pid = process.pid;
        
        // Crear objeto de log estructurado
        const logObject = {
            timestamp,
            level,
            pid,
            message,
            ...metadata
        };

        // Para archivos, usar JSON
        const fileFormat = JSON.stringify(logObject);
        
        // Para consola, usar formato legible
        const consoleFormat = `${timestamp} [${level}] (${pid}): ${message}${
            Object.keys(metadata).length > 0 ? ' | ' + JSON.stringify(metadata) : ''
        }`;

        return { fileFormat, consoleFormat };
    }

    /**
     * Escribe el log al archivo correspondiente
     */
    writeToFile(level, formattedMessage) {
        if (!this.logToFile) return;

        try {
            // Escribir a log combinado
            fs.appendFileSync(this.combinedLogPath, formattedMessage + '\n');
            
            // Escribir errores a archivo separado
            if (level === 'ERROR') {
                fs.appendFileSync(this.errorLogPath, formattedMessage + '\n');
            }
        } catch (error) {
            console.error('Error escribiendo a archivo de log:', error.message);
        }
    }

    /**
     * Escribe el log a la consola con colores
     */
    writeToConsole(level, consoleMessage) {
        if (!this.logToConsole) return;

        const color = COLORS[level] || COLORS.RESET;
        console.log(`${color}${consoleMessage}${COLORS.RESET}`);
    }

    /**
     * Método genérico para registrar logs
     */
    log(level, message, metadata = {}) {
        const levelNum = LOG_LEVELS[level];
        
        // Solo registrar si el nivel es igual o menor al configurado
        if (levelNum > this.level) return;

        const { fileFormat, consoleFormat } = this.formatMessage(level, message, metadata);
        
        this.writeToFile(level, fileFormat);
        this.writeToConsole(level, consoleFormat);
    }

    /**
     * Log de errores críticos
     */
    error(message, error = null, metadata = {}) {
        const errorMetadata = {
            ...metadata,
            ...(error && {
                errorName: error.name,
                errorMessage: error.message,
                stack: error.stack
            })
        };
        
        this.log('ERROR', message, errorMetadata);
    }

    /**
     * Log de advertencias
     */
    warn(message, metadata = {}) {
        this.log('WARN', message, metadata);
    }

    /**
     * Log de información general
     */
    info(message, metadata = {}) {
        this.log('INFO', message, metadata);
    }

    /**
     * Log de debugging (solo en desarrollo)
     */
    debug(message, metadata = {}) {
        this.log('DEBUG', message, metadata);
    }

    /**
     * Log específico para requests HTTP
     */
    request(req, res, responseTime) {
        const logData = {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            userId: req.user ? req.user.id : null
        };

        // Escribir a archivo de acceso separado
        if (this.logToFile) {
            const accessLog = JSON.stringify({
                timestamp: new Date().toISOString(),
                ...logData
            });
            
            try {
                fs.appendFileSync(this.accessLogPath, accessLog + '\n');
            } catch (error) {
                this.error('Error escribiendo log de acceso', error);
            }
        }

        // Determinar nivel basado en status code
        const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
        this.log(level, `${req.method} ${req.originalUrl}`, logData);
    }

    /**
     * Log específico para operaciones de base de datos
     */
    database(operation, table, metadata = {}) {
        this.info(`DB ${operation.toUpperCase()}: ${table}`, {
            operation,
            table,
            ...metadata
        });
    }

    /**
     * Log específico para autenticación
     */
    auth(action, userId, metadata = {}) {
        this.info(`AUTH ${action.toUpperCase()}`, {
            action,
            userId,
            ...metadata
        });
    }

    /**
     * Log específico para pagos
     */
    payment(action, amount, currency, metadata = {}) {
        this.info(`PAYMENT ${action.toUpperCase()}`, {
            action,
            amount,
            currency,
            ...metadata
        });
    }

    /**
     * Limpia logs antiguos (ejecutar periódicamente)
     */
    cleanOldLogs(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const logFiles = [this.errorLogPath, this.combinedLogPath, this.accessLogPath];
        
        logFiles.forEach(logFile => {
            try {
                if (fs.existsSync(logFile)) {
                    const stats = fs.statSync(logFile);
                    if (stats.mtime < cutoffDate) {
                        fs.unlinkSync(logFile);
                        this.info(`Log antiguo eliminado: ${logFile}`);
                    }
                }
            } catch (error) {
                this.error('Error limpiando logs antiguos', error);
            }
        });
    }
}

// Crear instancia única de logger (singleton)
const logger = new Logger();

// Middleware para Express que registra requests
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // Hook para capturar cuando la respuesta termine
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        logger.request(req, res, responseTime);
    });
    
    next();
};

// Exportar logger y middleware
module.exports = {
    logger,
    requestLogger
};