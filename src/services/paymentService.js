/**
 * Servicio de Pagos - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Maneja la integración con pasarelas de pago, procesamiento de transacciones
 * y gestión de pagos para reservas y servicios adicionales
 */

const config = require('../config/environment');
const { logger } = require('../utils/logger');
const { PAYMENT_STATUS, PAYMENT_METHODS } = require('../utils/constants');

/**
 * Simulador de Stripe (reemplazar con la integración real)
 * En un entorno real, usar: const stripe = require('stripe')(config.payment.stripe.secretKey);
 */
class StripeSimulator {
    constructor() {
        this.apiKey = config.payment.stripe.secretKey;
    }

    async createPaymentIntent(amount, currency, metadata = {}) {
        // Simulación de respuesta de Stripe
        await this.simulateDelay(1000);
        
        if (Math.random() < 0.05) { // 5% de probabilidad de fallo
            throw new Error('Simulated payment failure');
        }

        return {
            id: `pi_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: amount * 100, // Stripe maneja centavos
            currency: currency.toLowerCase(),
            status: 'succeeded',
            metadata,
            created: Math.floor(Date.now() / 1000),
            client_secret: `pi_sim_${Date.now()}_secret_${Math.random().toString(36).substr(2)}`,
            payment_method: 'card'
        };
    }

    async confirmPaymentIntent(paymentIntentId) {
        await this.simulateDelay(500);
        
        return {
            id: paymentIntentId,
            status: 'succeeded',
            amount_received: Math.floor(Math.random() * 100000) + 5000
        };
    }

    async createRefund(paymentIntentId, amount) {
        await this.simulateDelay(800);
        
        return {
            id: `re_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            payment_intent: paymentIntentId,
            amount: amount * 100,
            status: 'succeeded',
            created: Math.floor(Date.now() / 1000)
        };
    }

    async simulateDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Clase principal del servicio de pagos
 */
class PaymentService {
    constructor() {
        // En producción, usar la integración real de Stripe
        // this.stripe = require('stripe')(config.payment.stripe.secretKey);
        this.stripe = new StripeSimulator();
        this.supportedMethods = Object.values(PAYMENT_METHODS);
    }

    /**
     * Procesa un pago para una reserva
     */
    async processReservationPayment(reservation, paymentData) {
        try {
            const { 
                amount, 
                currency = 'GTQ', 
                payment_method = PAYMENT_METHODS.STRIPE,
                card_token,
                customer_info 
            } = paymentData;

            logger.info('Iniciando procesamiento de pago para reserva', {
                reservationId: reservation.id,
                reservationCode: reservation.reservation_code,
                amount,
                currency,
                payment_method
            });

            // Validar que el monto coincida con el total de la reserva
            if (amount > reservation.getBalance()) {
                throw new Error('El monto del pago excede el saldo pendiente');
            }

            let paymentResult;

            switch (payment_method) {
                case PAYMENT_METHODS.STRIPE:
                case PAYMENT_METHODS.CREDIT_CARD:
                case PAYMENT_METHODS.DEBIT_CARD:
                    paymentResult = await this.processCardPayment(
                        amount, 
                        currency, 
                        card_token,
                        {
                            reservation_id: reservation.id,
                            reservation_code: reservation.reservation_code,
                            customer_email: customer_info?.email
                        }
                    );
                    break;

                case PAYMENT_METHODS.CASH:
                    paymentResult = await this.processCashPayment(amount, currency);
                    break;

                case PAYMENT_METHODS.BANK_TRANSFER:
                    paymentResult = await this.processBankTransferPayment(amount, currency);
                    break;

                default:
                    throw new Error(`Método de pago ${payment_method} no soportado`);
            }

            // Registrar el pago en la reserva
            await reservation.addPayment(amount);

            // Crear registro de transacción
            const transaction = await this.createTransactionRecord({
                reservation_id: reservation.id,
                payment_intent_id: paymentResult.id,
                amount,
                currency,
                payment_method,
                status: PAYMENT_STATUS.COMPLETED,
                gateway_response: paymentResult
            });

            logger.payment('Pago procesado exitosamente', amount, currency, {
                reservationId: reservation.id,
                transactionId: transaction.id,
                paymentIntentId: paymentResult.id
            });

            return {
                success: true,
                transaction_id: transaction.id,
                payment_intent_id: paymentResult.id,
                amount_paid: amount,
                status: PAYMENT_STATUS.COMPLETED,
                gateway_response: paymentResult
            };

        } catch (error) {
            logger.error('Error procesando pago de reserva', error, {
                reservationId: reservation.id,
                amount: paymentData.amount
            });

            // Crear registro de transacción fallida
            await this.createTransactionRecord({
                reservation_id: reservation.id,
                amount: paymentData.amount,
                currency: paymentData.currency || 'GTQ',
                payment_method: paymentData.payment_method,
                status: PAYMENT_STATUS.FAILED,
                error_message: error.message
            });

            return {
                success: false,
                error: error.message,
                status: PAYMENT_STATUS.FAILED
            };
        }
    }

    /**
     * Procesa pago con tarjeta a través de Stripe
     */
    async processCardPayment(amount, currency, cardToken, metadata = {}) {
        try {
            // Crear Payment Intent en Stripe
            const paymentIntent = await this.stripe.createPaymentIntent(
                amount,
                currency,
                {
                    ...metadata,
                    hotel: 'Mar Azul',
                    timestamp: new Date().toISOString()
                }
            );

            // Confirmar el pago
            const confirmedPayment = await this.stripe.confirmPaymentIntent(paymentIntent.id);

            if (confirmedPayment.status !== 'succeeded') {
                throw new Error(`Pago no exitoso: ${confirmedPayment.status}`);
            }

            return {
                id: paymentIntent.id,
                amount: amount,
                currency,
                status: 'succeeded',
                payment_method: 'card',
                created: paymentIntent.created,
                client_secret: paymentIntent.client_secret
            };

        } catch (error) {
            logger.error('Error en pago con tarjeta', error);
            throw new Error(`Error procesando pago con tarjeta: ${error.message}`);
        }
    }

    /**
     * Procesa pago en efectivo
     */
    async processCashPayment(amount, currency) {
        // Para pagos en efectivo, crear un registro simple
        return {
            id: `cash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount,
            currency,
            status: 'succeeded',
            payment_method: 'cash',
            created: Math.floor(Date.now() / 1000),
            notes: 'Pago recibido en efectivo en recepción'
        };
    }

    /**
     * Procesa pago por transferencia bancaria
     */
    async processBankTransferPayment(amount, currency) {
        // Para transferencias, el pago queda pendiente hasta confirmación
        return {
            id: `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount,
            currency,
            status: 'pending',
            payment_method: 'bank_transfer',
            created: Math.floor(Date.now() / 1000),
            notes: 'Transferencia bancaria pendiente de confirmación'
        };
    }

    /**
     * Procesa reembolso
     */
    async processRefund(transactionId, amount, reason = '') {
        try {
            const transaction = await this.getTransactionById(transactionId);
            
            if (!transaction) {
                throw new Error('Transacción no encontrada');
            }

            if (transaction.status !== PAYMENT_STATUS.COMPLETED) {
                throw new Error('Solo se pueden reembolsar transacciones completadas');
            }

            let refundResult;

            switch (transaction.payment_method) {
                case PAYMENT_METHODS.STRIPE:
                case PAYMENT_METHODS.CREDIT_CARD:
                case PAYMENT_METHODS.DEBIT_CARD:
                    refundResult = await this.stripe.createRefund(
                        transaction.payment_intent_id,
                        amount
                    );
                    break;

                case PAYMENT_METHODS.CASH:
                    refundResult = {
                        id: `refund_cash_${Date.now()}`,
                        amount: amount,
                        status: 'succeeded',
                        payment_intent: transaction.payment_intent_id,
                        created: Math.floor(Date.now() / 1000)
                    };
                    break;

                default:
                    throw new Error(`Reembolso no soportado para método ${transaction.payment_method}`);
            }

            // Actualizar la transacción original
            await this.updateTransactionStatus(transactionId, PAYMENT_STATUS.REFUNDED);

            // Crear registro de reembolso
            const refundTransaction = await this.createTransactionRecord({
                reservation_id: transaction.reservation_id,
                payment_intent_id: refundResult.id,
                amount: -amount, // Negativo para reembolsos
                currency: transaction.currency,
                payment_method: transaction.payment_method,
                status: PAYMENT_STATUS.COMPLETED,
                transaction_type: 'refund',
                reference_transaction_id: transactionId,
                notes: reason
            });

            logger.payment('Reembolso procesado', amount, transaction.currency, {
                originalTransactionId: transactionId,
                refundTransactionId: refundTransaction.id,
                reason
            });

            return {
                success: true,
                refund_id: refundResult.id,
                transaction_id: refundTransaction.id,
                amount_refunded: amount,
                status: PAYMENT_STATUS.COMPLETED
            };

        } catch (error) {
            logger.error('Error procesando reembolso', error, {
                transactionId,
                amount
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verifica el estado de un pago
     */
    async verifyPaymentStatus(paymentIntentId) {
        try {
            // En implementación real, consultar a Stripe
            // const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            
            // Simulación
            await new Promise(resolve => setTimeout(resolve, 300));
            
            return {
                id: paymentIntentId,
                status: 'succeeded',
                amount_received: Math.floor(Math.random() * 100000) + 5000
            };

        } catch (error) {
            logger.error('Error verificando estado de pago', error, { paymentIntentId });
            throw error;
        }
    }

    /**
     * Crea un registro de transacción en la base de datos
     */
    async createTransactionRecord(transactionData) {
        try {
            // En implementación real, guardar en modelo Transaction
            // const Transaction = require('../models/Transaction');
            // return await Transaction.create(transactionData);
            
            // Simulación simple
            const transaction = {
                id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...transactionData,
                created_at: new Date(),
                updated_at: new Date()
            };

            logger.database('CREATE', 'transactions', transaction);
            
            return transaction;

        } catch (error) {
            logger.error('Error creando registro de transacción', error);
            throw error;
        }
    }

    /**
     * Obtiene una transacción por ID
     */
    async getTransactionById(transactionId) {
        try {
            // En implementación real, consultar desde base de datos
            // const Transaction = require('../models/Transaction');
            // return await Transaction.findByPk(transactionId);
            
            // Simulación
            return {
                id: transactionId,
                payment_intent_id: `pi_sim_${Date.now()}`,
                amount: 1000,
                currency: 'GTQ',
                payment_method: PAYMENT_METHODS.STRIPE,
                status: PAYMENT_STATUS.COMPLETED
            };

        } catch (error) {
            logger.error('Error obteniendo transacción', error, { transactionId });
            throw error;
        }
    }

    /**
     * Actualiza el estado de una transacción
     */
    async updateTransactionStatus(transactionId, newStatus) {
        try {
            // En implementación real, actualizar en base de datos
            // const Transaction = require('../models/Transaction');
            // return await Transaction.update({ status: newStatus }, { where: { id: transactionId } });
            
            logger.database('UPDATE', 'transactions', { 
                id: transactionId, 
                status: newStatus 
            });
            
            return true;

        } catch (error) {
            logger.error('Error actualizando estado de transacción', error, {
                transactionId,
                newStatus
            });
            throw error;
        }
    }

    /**
     * Obtiene el historial de pagos de una reserva
     */
    async getReservationPaymentHistory(reservationId) {
        try {
            // En implementación real, consultar desde base de datos
            // const Transaction = require('../models/Transaction');
            // return await Transaction.findAll({ where: { reservation_id: reservationId } });
            
            // Simulación
            return [
                {
                    id: `txn_${Date.now()}_1`,
                    reservation_id: reservationId,
                    amount: 500,
                    currency: 'GTQ',
                    payment_method: PAYMENT_METHODS.STRIPE,
                    status: PAYMENT_STATUS.COMPLETED,
                    created_at: new Date()
                }
            ];

        } catch (error) {
            logger.error('Error obteniendo historial de pagos', error, { reservationId });
            throw error;
        }
    }

    /**
     * Valida los datos de una tarjeta de crédito
     */
    validateCardData(cardData) {
        const { number, cvc, exp_month, exp_year, name } = cardData;
        
        const errors = [];

        // Validar número de tarjeta (algoritmo Luhn básico)
        if (!number || !this.isValidCardNumber(number)) {
            errors.push('Número de tarjeta inválido');
        }

        // Validar CVC
        if (!cvc || !/^\d{3,4}$/.test(cvc)) {
            errors.push('CVC inválido');
        }

        // Validar fecha de expiración
        if (!exp_month || !exp_year || 
            exp_month < 1 || exp_month > 12 || 
            exp_year < new Date().getFullYear()) {
            errors.push('Fecha de expiración inválida');
        }

        // Validar nombre
        if (!name || name.trim().length < 2) {
            errors.push('Nombre del titular requerido');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validación básica de número de tarjeta usando algoritmo Luhn
     */
    isValidCardNumber(number) {
        const cleaned = number.replace(/\D/g, '');
        
        if (cleaned.length < 13 || cleaned.length > 19) {
            return false;
        }

        let sum = 0;
        let isEven = false;

        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned[i]);

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    }

    /**
     * Obtiene las tarifas de procesamiento
     */
    getProcessingFees(amount, paymentMethod) {
        const feeRates = {
            [PAYMENT_METHODS.STRIPE]: 0.035, // 3.5%
            [PAYMENT_METHODS.CREDIT_CARD]: 0.035,
            [PAYMENT_METHODS.DEBIT_CARD]: 0.025, // 2.5%
            [PAYMENT_METHODS.CASH]: 0, // Sin tarifa
            [PAYMENT_METHODS.BANK_TRANSFER]: 0.01 // 1%
        };

        const rate = feeRates[paymentMethod] || 0;
        const fee = amount * rate;

        return {
            fee_rate: rate,
            fee_amount: Math.round(fee * 100) / 100, // Redondear a 2 decimales
            total_amount: amount + fee
        };
    }

    /**
     * Genera reporte de transacciones
     */
    async generatePaymentReport(startDate, endDate, filters = {}) {
        try {
            // En implementación real, consultar desde base de datos con filtros
            logger.info('Generando reporte de pagos', {
                startDate,
                endDate,
                filters
            });

            // Simulación de datos
            const transactions = [
                {
                    date: new Date(),
                    amount: 1500,
                    currency: 'GTQ',
                    payment_method: PAYMENT_METHODS.STRIPE,
                    status: PAYMENT_STATUS.COMPLETED
                }
            ];

            const summary = {
                total_transactions: transactions.length,
                total_amount: transactions.reduce((sum, t) => sum + t.amount, 0),
                by_method: transactions.reduce((acc, t) => {
                    acc[t.payment_method] = (acc[t.payment_method] || 0) + t.amount;
                    return acc;
                }, {}),
                by_status: transactions.reduce((acc, t) => {
                    acc[t.status] = (acc[t.status] || 0) + 1;
                    return acc;
                }, {})
            };

            return {
                transactions,
                summary,
                period: { startDate, endDate },
                generated_at: new Date()
            };

        } catch (error) {
            logger.error('Error generando reporte de pagos', error);
            throw error;
        }
    }
}

// Crear instancia única del servicio
const paymentService = new PaymentService();

module.exports = paymentService;