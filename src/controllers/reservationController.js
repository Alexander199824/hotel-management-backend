/**
 * Controlador de Reservas - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Maneja todas las operaciones relacionadas con reservas:
 * crear, consultar, modificar, cancelar y gestionar check-in/check-out
 */

const { Reservation, Guest, Room, User, Invoice, sequelize } = require('../models');
const { catchAsync } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { RESERVATION_STATUS, ROOM_STATUS, PAYMENT_STATUS, PAGINATION } = require('../utils/constants');
const emailService = require('../services/emailService');
const paymentService = require('../services/paymentService');

/**
 * Obtiene todas las reservas con filtros y paginación
 */
const getAllReservations = catchAsync(async (req, res) => {
    const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        status,
        start_date,
        end_date,
        guest_id,
        room_id,
        search
    } = req.query;

    const offset = (page - 1) * limit;
    const whereConditions = {};

    // Aplicar filtros
    if (status) {
        whereConditions.status = status;
    }

    if (start_date && end_date) {
        whereConditions.check_in_date = {
            [sequelize.Sequelize.Op.between]: [start_date, end_date]
        };
    }

    if (guest_id) {
        whereConditions.guest_id = guest_id;
    }

    if (room_id) {
        whereConditions.room_id = room_id;
    }

    // Incluir búsqueda por código de reserva
    if (search) {
        whereConditions.reservation_code = {
            [sequelize.Sequelize.Op.iLike]: `%${search}%`
        };
    }

    const { rows: reservations, count: total } = await Reservation.findAndCountAll({
        where: whereConditions,
        include: [
            {
                model: Guest,
                as: 'guest',
                attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
            },
            {
                model: Room,
                as: 'room',
                attributes: ['id', 'room_number', 'category', 'floor']
            },
            {
                model: User,
                as: 'createdBy',
                attributes: ['id', 'first_name', 'last_name'],
                required: false
            }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
    });

    logger.info('Reservas consultadas', {
        userId: req.user.id,
        total,
        page,
        filters: { status, start_date, end_date }
    });

    res.json({
        success: true,
        data: {
            reservations: reservations.map(reservation => ({
                ...reservation.getSummary(),
                guest: reservation.guest,
                room: reservation.room,
                created_by: reservation.createdBy
            })),
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: parseInt(limit)
            }
        }
    });
});

/**
 * Obtiene una reserva específica por ID
 */
const getReservationById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const reservation = await Reservation.findByPk(id, {
        include: [
            {
                model: Guest,
                as: 'guest'
            },
            {
                model: Room,
                as: 'room'
            },
            {
                model: User,
                as: 'createdBy',
                attributes: ['id', 'first_name', 'last_name'],
                required: false
            },
            {
                model: User,
                as: 'cancelledBy',
                attributes: ['id', 'first_name', 'last_name'],
                required: false
            }
        ]
    });

    if (!reservation) {
        return res.status(404).json({
            success: false,
            message: 'Reserva no encontrada'
        });
    }

    // Verificar permisos: solo staff o el huésped propietario
    if (!req.user.isStaff() && reservation.guest.email !== req.user.email) {
        return res.status(403).json({
            success: false,
            message: 'No tiene permisos para ver esta reserva'
        });
    }

    res.json({
        success: true,
        data: {
            reservation: {
                ...reservation.toJSON(),
                can_check_in: reservation.canCheckIn(),
                can_check_out: reservation.canCheckOut(),
                can_be_cancelled: reservation.canBeCancelled(),
                balance: reservation.getBalance(),
                is_payment_overdue: reservation.isPaymentOverdue()
            }
        }
    });
});

/**
 * Crea una nueva reserva
 */
const createReservation = catchAsync(async (req, res) => {
    const {
        guest_id,
        room_id,
        check_in_date,
        check_out_date,
        adults_count,
        children_count = 0,
        special_requests,
        emergency_contact_name,
        emergency_contact_phone,
        preferences = {}
    } = req.body;

    // Verificar que la habitación existe y está disponible
    const room = await Room.findByPk(room_id);
    if (!room) {
        return res.status(404).json({
            success: false,
            message: 'Habitación no encontrada'
        });
    }

    if (!room.isAvailable()) {
        return res.status(400).json({
            success: false,
            message: 'Habitación no disponible'
        });
    }

    // Verificar que el huésped existe
    const guest = await Guest.findByPk(guest_id);
    if (!guest) {
        return res.status(404).json({
            success: false,
            message: 'Huésped no encontrado'
        });
    }

    // Verificar que el huésped puede hacer reservas
    if (!guest.canMakeReservations()) {
        return res.status(400).json({
            success: false,
            message: 'El huésped no puede realizar reservas'
        });
    }

    // Verificar disponibilidad en las fechas
    const conflictingReservations = await Reservation.findByDateRange(
        check_in_date,
        check_out_date
    );

    const hasConflict = conflictingReservations.some(reservation => 
        reservation.room_id === room_id && 
        ['confirmed', 'checked_in'].includes(reservation.status)
    );

    if (hasConflict) {
        return res.status(400).json({
            success: false,
            message: 'La habitación no está disponible en las fechas seleccionadas'
        });
    }

    // Calcular precios
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const pricing = room.getPriceForDates(checkIn, checkOut);

    logger.info('Precios calculados para reserva', {
        checkIn,
        checkOut,
        pricing,
        roomBasePrice: room.base_price,
        roomCurrency: room.currency
    });

    // Validar que los precios sean válidos
    if (!pricing || !pricing.pricePerNight || !pricing.totalPrice || pricing.nights < 1) {
        logger.error('Error en cálculo de precios', { pricing, checkIn, checkOut });
        return res.status(400).json({
            success: false,
            message: 'Error al calcular los precios de la reserva'
        });
    }

    // Generar código de reserva único
    const reservationCode = await Reservation.generateReservationCode();

    logger.info('Código de reserva generado', { reservationCode });

    // Crear la reserva en una transacción
    const reservation = await sequelize.transaction(async (transaction) => {
        const reservationData = {
            reservation_code: reservationCode,
            guest_id,
            room_id,
            check_in_date,
            check_out_date,
            adults_count: adults_count || 1,
            children_count: children_count || 0,
            base_price_per_night: pricing.pricePerNight,
            nights_count: pricing.nights,
            subtotal: pricing.totalPrice,
            discount_amount: 0,
            tax_amount: pricing.totalPrice * 0.12, // 12% IVA
            total_amount: pricing.totalPrice * 1.12,
            currency: room.currency || 'GTQ',
            payment_status: PAYMENT_STATUS.PENDING,
            paid_amount: 0,
            special_requests,
            emergency_contact_name,
            emergency_contact_phone,
            preferences,
            created_by_user_id: req.user.id,
            status: RESERVATION_STATUS.PENDING
        };

        logger.info('Datos de reserva antes de crear', { reservationData });

        const newReservation = await Reservation.create(reservationData, {
            transaction,
            validate: false  // Deshabilitar validaciones automáticas temporalmente
        });

        // Marcar habitación como ocupada temporalmente
        await room.update({ 
            status: ROOM_STATUS.OCCUPIED 
        }, { transaction });

        return newReservation;
    });

    // Recargar reserva con relaciones
    const completeReservation = await Reservation.findByPk(reservation.id, {
        include: [
            { model: Guest, as: 'guest' },
            { model: Room, as: 'room' }
        ]
    });

    logger.info('Reserva creada', {
        reservationId: reservation.id,
        reservationCode: reservation.reservation_code,
        guestId: guest_id,
        roomId: room_id,
        createdBy: req.user.id
    });

    // Enviar email de confirmación - DESHABILITADO
    // try {
    //     await emailService.sendReservationConfirmation(
    //         completeReservation,
    //         completeReservation.guest,
    //         completeReservation.room
    //     );
    // } catch (emailError) {
    //     logger.warn('Error enviando email de confirmación', emailError);
    // }

    res.status(201).json({
        success: true,
        message: 'Reserva creada exitosamente',
        data: {
            reservation: {
                ...completeReservation.getSummary(),
                guest: completeReservation.guest,
                room: completeReservation.room
            }
        }
    });
});

/**
 * Actualiza una reserva existente
 */
const updateReservation = catchAsync(async (req, res) => {
    const { id } = req.params;
    const {
        check_in_date,
        check_out_date,
        adults_count,
        children_count,
        special_requests,
        internal_notes
    } = req.body;

    const reservation = await Reservation.findByPk(id, {
        include: [
            { model: Guest, as: 'guest' },
            { model: Room, as: 'room' }
        ]
    });

    if (!reservation) {
        return res.status(404).json({
            success: false,
            message: 'Reserva no encontrada'
        });
    }

    // Solo permitir modificar reservas pendientes o confirmadas
    if (!['pending', 'confirmed'].includes(reservation.status)) {
        return res.status(400).json({
            success: false,
            message: 'No se puede modificar una reserva en este estado'
        });
    }

    // Verificar permisos
    if (!req.user.isStaff() && reservation.guest.email !== req.user.email) {
        return res.status(403).json({
            success: false,
            message: 'No tiene permisos para modificar esta reserva'
        });
    }

    const updateData = {};

    // Si se cambian las fechas, recalcular precios
    if (check_in_date && check_out_date) {
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);

        // Verificar disponibilidad en nuevas fechas
        const conflictingReservations = await Reservation.findByDateRange(
            check_in_date,
            check_out_date
        );

        const hasConflict = conflictingReservations.some(res => 
            res.room_id === reservation.room_id && 
            res.id !== reservation.id &&
            ['confirmed', 'checked_in'].includes(res.status)
        );

        if (hasConflict) {
            return res.status(400).json({
                success: false,
                message: 'La habitación no está disponible en las nuevas fechas'
            });
        }

        const pricing = reservation.room.getPriceForDates(checkIn, checkOut);
        
        updateData.check_in_date = check_in_date;
        updateData.check_out_date = check_out_date;
        updateData.nights_count = pricing.nights;
        updateData.subtotal = pricing.totalPrice;
        updateData.total_amount = pricing.totalPrice * 1.12; // Con impuestos
    }

    // Actualizar otros campos
    if (adults_count !== undefined) updateData.adults_count = adults_count;
    if (children_count !== undefined) updateData.children_count = children_count;
    if (special_requests !== undefined) updateData.special_requests = special_requests;
    if (internal_notes !== undefined && req.user.isStaff()) {
        updateData.internal_notes = internal_notes;
    }

    await reservation.update(updateData);

    logger.info('Reserva actualizada', {
        reservationId: id,
        updatedBy: req.user.id,
        changes: Object.keys(updateData)
    });

    res.json({
        success: true,
        message: 'Reserva actualizada exitosamente',
        data: {
            reservation: reservation.getSummary()
        }
    });
});

/**
 * Confirma una reserva
 */
const confirmReservation = catchAsync(async (req, res) => {
    const { id } = req.params;

    const reservation = await Reservation.findByPk(id, {
        include: [
            { model: Guest, as: 'guest' },
            { model: Room, as: 'room' }
        ]
    });

    if (!reservation) {
        return res.status(404).json({
            success: false,
            message: 'Reserva no encontrada'
        });
    }

    if (reservation.status !== RESERVATION_STATUS.PENDING) {
        return res.status(400).json({
            success: false,
            message: 'Solo se pueden confirmar reservas pendientes'
        });
    }

    await reservation.confirm(req.user.id);

    logger.info('Reserva confirmada', {
        reservationId: id,
        confirmedBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Reserva confirmada exitosamente',
        data: {
            reservation: reservation.getSummary()
        }
    });
});

/**
 * Cancela una reserva
 */
const cancelReservation = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const reservation = await Reservation.findByPk(id, {
        include: [
            { model: Guest, as: 'guest' },
            { model: Room, as: 'room' }
        ]
    });

    if (!reservation) {
        return res.status(404).json({
            success: false,
            message: 'Reserva no encontrada'
        });
    }

    if (!reservation.canBeCancelled()) {
        return res.status(400).json({
            success: false,
            message: 'Esta reserva no puede ser cancelada'
        });
    }

    // Verificar permisos
    if (!req.user.isStaff() && reservation.guest.email !== req.user.email) {
        return res.status(403).json({
            success: false,
            message: 'No tiene permisos para cancelar esta reserva'
        });
    }

    await sequelize.transaction(async (transaction) => {
        // Cancelar reserva
        await reservation.cancel(reason, req.user.id);

        // Liberar habitación
        await reservation.room.update({
            status: ROOM_STATUS.AVAILABLE
        }, { transaction });

        // Si había pagos, procesar reembolso si aplica
        if (reservation.paid_amount > 0) {
            // TODO: Implementar lógica de reembolso según políticas
            logger.info('Reembolso requerido para reserva cancelada', {
                reservationId: id,
                paidAmount: reservation.paid_amount
            });
        }
    });

    logger.info('Reserva cancelada', {
        reservationId: id,
        reason,
        cancelledBy: req.user.id
    });

    // Enviar email de cancelación - DESHABILITADO
    // try {
    //     await emailService.sendCancellationNotification(
    //         reservation,
    //         reservation.guest,
    //         reason
    //     );
    // } catch (emailError) {
    //     logger.warn('Error enviando email de cancelación', emailError);
    // }

    res.json({
        success: true,
        message: 'Reserva cancelada exitosamente'
    });
});

/**
 * Realiza check-in
 */
const checkIn = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;

    const reservation = await Reservation.findByPk(id, {
        include: [
            { model: Guest, as: 'guest' },
            { model: Room, as: 'room' }
        ]
    });

    if (!reservation) {
        return res.status(404).json({
            success: false,
            message: 'Reserva no encontrada'
        });
    }

    if (!reservation.canCheckIn()) {
        return res.status(400).json({
            success: false,
            message: 'Esta reserva no puede hacer check-in en este momento'
        });
    }

    await sequelize.transaction(async (transaction) => {
        // Realizar check-in
        await reservation.checkIn();

        // Actualizar estado de habitación
        await reservation.room.checkIn();

        // Actualizar estadísticas del huésped
        await reservation.guest.updateStayStats(reservation.total_amount);

        // Agregar notas si se proporcionaron
        if (notes) {
            reservation.internal_notes = (reservation.internal_notes || '') + 
                `\nCheck-in (${new Date().toLocaleString()}): ${notes}`;
            await reservation.save({ transaction });
        }
    });

    logger.info('Check-in realizado', {
        reservationId: id,
        guestId: reservation.guest_id,
        roomId: reservation.room_id,
        performedBy: req.user.id
    });

    // Enviar email de bienvenida - DESHABILITADO
    // try {
    //     await emailService.sendWelcomeEmail(
    //         reservation,
    //         reservation.guest,
    //         reservation.room
    //     );
    // } catch (emailError) {
    //     logger.warn('Error enviando email de bienvenida', emailError);
    // }

    res.json({
        success: true,
        message: 'Check-in realizado exitosamente',
        data: {
            reservation: reservation.getSummary(),
            room: reservation.room.getFullInfo()
        }
    });
});

/**
 * Realiza check-out
 */
const checkOut = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { notes, generate_invoice = true } = req.body;

    const reservation = await Reservation.findByPk(id, {
        include: [
            { model: Guest, as: 'guest' },
            { model: Room, as: 'room' }
        ]
    });

    if (!reservation) {
        return res.status(404).json({
            success: false,
            message: 'Reserva no encontrada'
        });
    }

    if (!reservation.canCheckOut()) {
        return res.status(400).json({
            success: false,
            message: 'Esta reserva no puede hacer check-out'
        });
    }

    let invoice = null;

    await sequelize.transaction(async (transaction) => {
        // Realizar check-out
        await reservation.checkOut();

        // Actualizar estado de habitación (requiere limpieza)
        await reservation.room.checkOut();

        // Agregar notas si se proporcionaron
        if (notes) {
            reservation.internal_notes = (reservation.internal_notes || '') + 
                `\nCheck-out (${new Date().toLocaleString()}): ${notes}`;
            await reservation.save({ transaction });
        }

        // Generar factura si se solicita
        if (generate_invoice) {
            invoice = await Invoice.create({
                reservation_id: reservation.id,
                guest_id: reservation.guest_id,
                billing_name: reservation.guest.getFullName(),
                billing_email: reservation.guest.email,
                billing_phone: reservation.guest.phone,
                service_date_from: reservation.check_in_date,
                service_date_to: reservation.check_out_date,
                subtotal: reservation.subtotal,
                tax_amount: reservation.tax_amount,
                total_amount: reservation.total_amount,
                currency: reservation.currency,
                created_by_user_id: req.user.id
            }, { transaction });
        }
    });

    logger.info('Check-out realizado', {
        reservationId: id,
        guestId: reservation.guest_id,
        roomId: reservation.room_id,
        invoiceGenerated: !!invoice,
        performedBy: req.user.id
    });

    const response = {
        success: true,
        message: 'Check-out realizado exitosamente',
        data: {
            reservation: reservation.getSummary(),
            room_status: 'needs_cleaning'
        }
    };

    if (invoice) {
        response.data.invoice = invoice.getSummary();
        
        // Enviar factura por email - DESHABILITADO
        // try {
        //     await emailService.sendInvoice(invoice, reservation.guest, reservation);
        // } catch (emailError) {
        //     logger.warn('Error enviando factura por email', emailError);
        // }
    }

    res.json(response);
});

/**
 * Busca reservas por código o datos del huésped
 */
const searchReservations = catchAsync(async (req, res) => {
    const { query } = req.query;

    if (!query || query.length < 3) {
        return res.status(400).json({
            success: false,
            message: 'La búsqueda debe tener al menos 3 caracteres'
        });
    }

    const reservations = await Reservation.findAll({
        where: {
            [sequelize.Sequelize.Op.or]: [
                {
                    reservation_code: {
                        [sequelize.Sequelize.Op.iLike]: `%${query}%`
                    }
                }
            ]
        },
        include: [
            {
                model: Guest,
                as: 'guest',
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
                required: false
            },
            {
                model: Room,
                as: 'room',
                attributes: ['id', 'room_number', 'category']
            }
        ],
        order: [['created_at', 'DESC']],
        limit: 20
    });

    res.json({
        success: true,
        data: {
            reservations: reservations.map(reservation => ({
                ...reservation.getSummary(),
                guest: reservation.guest,
                room: reservation.room
            }))
        }
    });
});

/**
 * Obtiene estadísticas de reservas
 */
const getReservationStats = catchAsync(async (req, res) => {
    const { start_date, end_date } = req.query;

    const stats = await Reservation.getStats(start_date, end_date);

    res.json({
        success: true,
        data: {
            statistics: stats,
            period: { start_date, end_date }
        }
    });
});

module.exports = {
    getAllReservations,
    getReservationById,
    createReservation,
    updateReservation,
    confirmReservation,
    cancelReservation,
    checkIn,
    checkOut,
    searchReservations,
    getReservationStats
};