/**
 * Controlador de Habitaciones - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Maneja todas las operaciones relacionadas con habitaciones:
 * consulta, creación, actualización, gestión de estado y disponibilidad
 */

const { Room, Reservation, Incident, sequelize } = require('../models');
const { catchAsync } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { ROOM_STATUS, ROOM_CATEGORIES, PAGINATION } = require('../utils/constants');

/**
 * Obtiene todas las habitaciones con filtros y paginación
 */
const getAllRooms = catchAsync(async (req, res) => {
    const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        status,
        category,
        floor,
        available_only = false,
        min_capacity,
        max_price,
        search
    } = req.query;

    const offset = (page - 1) * limit;
    const whereConditions = {};

    // Aplicar filtros
    if (status) {
        whereConditions.status = status;
    }

    if (category) {
        whereConditions.category = category;
    }

    if (floor) {
        whereConditions.floor = parseInt(floor);
    }

    if (available_only === 'true') {
        whereConditions.status = ROOM_STATUS.AVAILABLE;
        whereConditions.is_active = true;
        whereConditions.is_out_of_order = false;
    }

    if (min_capacity) {
        whereConditions.capacity = {
            [sequelize.Sequelize.Op.gte]: parseInt(min_capacity)
        };
    }

    if (max_price) {
        whereConditions.base_price = {
            [sequelize.Sequelize.Op.lte]: parseFloat(max_price)
        };
    }

    if (search) {
        whereConditions[sequelize.Sequelize.Op.or] = [
            {
                room_number: {
                    [sequelize.Sequelize.Op.iLike]: `%${search}%`
                }
            },
            {
                description: {
                    [sequelize.Sequelize.Op.iLike]: `%${search}%`
                }
            }
        ];
    }

    const { rows: rooms, count: total } = await Room.findAndCountAll({
        where: whereConditions,
        order: [['floor', 'ASC'], ['room_number', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
    });

    logger.info('Habitaciones consultadas', {
        userId: req.user?.id,
        total,
        page,
        filters: { status, category, floor, available_only }
    });

    res.json({
        success: true,
        data: {
            rooms: rooms.map(room => room.getFullInfo()),
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
 * Obtiene una habitación específica por ID
 */
const getRoomById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const room = await Room.findByPk(id);

    if (!room) {
        return res.status(404).json({
            success: false,
            message: 'Habitación no encontrada'
        });
    }

    // Obtener reservas actuales y futuras
    const currentReservations = await Reservation.findAll({
        where: {
            room_id: id,
            status: {
                [sequelize.Sequelize.Op.in]: ['confirmed', 'checked_in']
            },
            check_out_date: {
                [sequelize.Sequelize.Op.gte]: new Date()
            }
        },
        include: [
            {
                model: require('../models/Guest'),
                as: 'guest',
                attributes: ['id', 'first_name', 'last_name', 'email']
            }
        ],
        order: [['check_in_date', 'ASC']]
    });

    // Obtener incidencias abiertas
    const openIncidents = await Incident.findByRoom(id, false);

    res.json({
        success: true,
        data: {
            room: {
                ...room.getFullInfo(),
                needs_maintenance: room.needsMaintenance(),
                needs_cleaning: room.needsCleaning(),
                amenities_list: room.getAmenities()
            },
            current_reservations: currentReservations.map(reservation => ({
                id: reservation.id,
                reservation_code: reservation.reservation_code,
                guest: reservation.guest,
                check_in_date: reservation.check_in_date,
                check_out_date: reservation.check_out_date,
                status: reservation.status
            })),
            open_incidents: openIncidents.map(incident => incident.getSummary())
        }
    });
});

/**
 * Crea una nueva habitación
 */
const createRoom = catchAsync(async (req, res) => {
    const {
        room_number,
        category,
        floor,
        capacity,
        beds_count,
        bed_type,
        base_price,
        currency = 'GTQ',
        amenities = [],
        description,
        has_balcony = false,
        has_ocean_view = false,
        has_wifi = true,
        has_air_conditioning = true,
        has_minibar = false,
        has_safe = false,
        images = []
    } = req.body;

    // Verificar que el número de habitación no existe
    const existingRoom = await Room.findOne({
        where: { room_number: room_number.toUpperCase() }
    });

    if (existingRoom) {
        return res.status(400).json({
            success: false,
            message: 'Ya existe una habitación con ese número'
        });
    }

    const room = await Room.create({
        room_number,
        category,
        floor,
        capacity,
        beds_count,
        bed_type,
        base_price,
        currency,
        amenities,
        description,
        has_balcony,
        has_ocean_view,
        has_wifi,
        has_air_conditioning,
        has_minibar,
        has_safe,
        images,
        status: ROOM_STATUS.AVAILABLE,
        is_active: true
    });

    logger.info('Habitación creada', {
        roomId: room.id,
        roomNumber: room.room_number,
        category: room.category,
        createdBy: req.user.id
    });

    res.status(201).json({
        success: true,
        message: 'Habitación creada exitosamente',
        data: {
            room: room.getFullInfo()
        }
    });
});

/**
 * Actualiza una habitación existente
 */
const updateRoom = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const room = await Room.findByPk(id);

    if (!room) {
        return res.status(404).json({
            success: false,
            message: 'Habitación no encontrada'
        });
    }

    // Campos que se pueden actualizar
    const allowedFields = [
        'category', 'capacity', 'beds_count', 'bed_type', 'base_price',
        'amenities', 'description', 'has_balcony', 'has_ocean_view',
        'has_wifi', 'has_air_conditioning', 'has_minibar', 'has_safe',
        'images', 'maintenance_notes', 'cleaning_notes', 'is_active'
    ];

    // Filtrar solo campos permitidos
    const filteredData = {};
    Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
            filteredData[key] = updateData[key];
        }
    });

    // Actualizar habitación
    await room.update(filteredData);

    logger.info('Habitación actualizada', {
        roomId: id,
        roomNumber: room.room_number,
        updatedFields: Object.keys(filteredData),
        updatedBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Habitación actualizada exitosamente',
        data: {
            room: room.getFullInfo()
        }
    });
});

/**
 * Cambia el estado de una habitación
 */
const changeRoomStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const room = await Room.findByPk(id);

    if (!room) {
        return res.status(404).json({
            success: false,
            message: 'Habitación no encontrada'
        });
    }

    // Verificar que el estado es válido
    if (!Object.values(ROOM_STATUS).includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Estado de habitación inválido'
        });
    }

    // Si está ocupada, verificar que no tenga reservas activas (excepto staff autorizado)
    if (status !== ROOM_STATUS.OCCUPIED && room.status === ROOM_STATUS.OCCUPIED) {
        const activeReservations = await Reservation.count({
            where: {
                room_id: id,
                status: {
                    [sequelize.Sequelize.Op.in]: ['confirmed', 'checked_in']
                },
                check_out_date: {
                    [sequelize.Sequelize.Op.gte]: new Date()
                }
            }
        });

        if (activeReservations > 0 && !req.user.isManager()) {
            return res.status(400).json({
                success: false,
                message: 'No se puede cambiar el estado de una habitación con reservas activas'
            });
        }
    }

    const oldStatus = room.status;
    await room.changeStatus(status, notes);

    logger.info('Estado de habitación cambiado', {
        roomId: id,
        roomNumber: room.room_number,
        oldStatus,
        newStatus: status,
        notes,
        changedBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Estado de habitación actualizado exitosamente',
        data: {
            room: {
                id: room.id,
                room_number: room.room_number,
                status: room.status,
                previous_status: oldStatus
            }
        }
    });
});

/**
 * Marca habitación como fuera de servicio
 */
const setOutOfOrder = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({
            success: false,
            message: 'Debe especificar la razón por la cual está fuera de servicio'
        });
    }

    const room = await Room.findByPk(id);

    if (!room) {
        return res.status(404).json({
            success: false,
            message: 'Habitación no encontrada'
        });
    }

    await room.update({
        is_out_of_order: true,
        out_of_order_reason: reason,
        status: ROOM_STATUS.OUT_OF_ORDER
    });

    logger.info('Habitación marcada como fuera de servicio', {
        roomId: id,
        roomNumber: room.room_number,
        reason,
        setBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Habitación marcada como fuera de servicio',
        data: {
            room: room.getFullInfo()
        }
    });
});

/**
 * Vuelve a poner habitación en servicio
 */
const setInService = catchAsync(async (req, res) => {
    const { id } = req.params;

    const room = await Room.findByPk(id);

    if (!room) {
        return res.status(404).json({
            success: false,
            message: 'Habitación no encontrada'
        });
    }

    if (!room.is_out_of_order) {
        return res.status(400).json({
            success: false,
            message: 'La habitación no está fuera de servicio'
        });
    }

    await room.update({
        is_out_of_order: false,
        out_of_order_reason: null,
        status: ROOM_STATUS.AVAILABLE
    });

    logger.info('Habitación puesta en servicio', {
        roomId: id,
        roomNumber: room.room_number,
        setBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Habitación puesta en servicio exitosamente',
        data: {
            room: room.getFullInfo()
        }
    });
});

/**
 * Busca habitaciones disponibles por criterios
 */
const searchAvailableRooms = catchAsync(async (req, res) => {
    const {
        check_in_date,
        check_out_date,
        capacity,
        category,
        max_price
    } = req.query;

    if (!check_in_date || !check_out_date) {
        return res.status(400).json({
            success: false,
            message: 'Fechas de check-in y check-out son requeridas'
        });
    }

    // Buscar habitaciones disponibles
    const availableRooms = await Room.findAvailableRooms(
        check_in_date,
        check_out_date,
        category,
        capacity ? parseInt(capacity) : null
    );

    // Filtrar por precio si se especifica
    let filteredRooms = availableRooms;
    if (max_price) {
        filteredRooms = availableRooms.filter(room => 
            parseFloat(room.base_price) <= parseFloat(max_price)
        );
    }

    // Calcular precios para las fechas especificadas
    const roomsWithPricing = filteredRooms.map(room => {
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);
        const pricing = room.getPriceForDates(checkIn, checkOut);

        return {
            ...room.getFullInfo(),
            pricing
        };
    });

    res.json({
        success: true,
        data: {
            rooms: roomsWithPricing,
            search_criteria: {
                check_in_date,
                check_out_date,
                capacity,
                category,
                max_price
            },
            total_available: roomsWithPricing.length
        }
    });
});

/**
 * Obtiene el calendario de ocupación de una habitación
 */
const getRoomCalendar = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    const room = await Room.findByPk(id);

    if (!room) {
        return res.status(404).json({
            success: false,
            message: 'Habitación no encontrada'
        });
    }

    // Si no se especifican fechas, usar próximos 30 días
    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = end_date ? new Date(end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Obtener reservas en el período
    const reservations = await Reservation.findAll({
        where: {
            room_id: id,
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
            ],
            status: {
                [sequelize.Sequelize.Op.ne]: 'cancelled'
            }
        },
        include: [
            {
                model: require('../models/Guest'),
                as: 'guest',
                attributes: ['id', 'first_name', 'last_name']
            }
        ],
        order: [['check_in_date', 'ASC']]
    });

    // Generar calendario día por día
    const calendar = [];
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayStr = new Date(date).toISOString().split('T')[0];
        
        // Buscar reserva para este día
        const dayReservation = reservations.find(reservation => {
            const checkIn = new Date(reservation.check_in_date);
            const checkOut = new Date(reservation.check_out_date);
            const currentDay = new Date(date);
            
            return currentDay >= checkIn && currentDay < checkOut;
        });

        calendar.push({
            date: dayStr,
            status: dayReservation ? 'occupied' : (room.isAvailable() ? 'available' : room.status),
            reservation: dayReservation ? {
                id: dayReservation.id,
                reservation_code: dayReservation.reservation_code,
                guest_name: dayReservation.guest ? 
                    `${dayReservation.guest.first_name} ${dayReservation.guest.last_name}` : 
                    'Desconocido',
                status: dayReservation.status
            } : null
        });
    }

    res.json({
        success: true,
        data: {
            room: {
                id: room.id,
                room_number: room.room_number,
                category: room.category
            },
            calendar,
            period: {
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            }
        }
    });
});

/**
 * Obtiene estadísticas de habitaciones
 */
const getRoomStats = catchAsync(async (req, res) => {
    const stats = await Room.getOccupancyStats();
    const roomsNeedingAttention = await Room.getRoomsNeedingAttention();

    // Estadísticas por categoría
    const categoryStats = await Room.findAll({
        attributes: [
            'category',
            [sequelize.fn('COUNT', sequelize.col('id')), 'total_rooms'],
            [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN status = '${ROOM_STATUS.AVAILABLE}' THEN 1 END`)), 'available_rooms'],
            [sequelize.fn('AVG', sequelize.col('base_price')), 'average_price']
        ],
        where: { is_active: true },
        group: ['category'],
        raw: true
    });

    res.json({
        success: true,
        data: {
            occupancy_statistics: stats,
            rooms_needing_attention: roomsNeedingAttention.map(room => ({
                id: room.id,
                room_number: room.room_number,
                status: room.status,
                needs_maintenance: room.needsMaintenance(),
                needs_cleaning: room.needsCleaning(),
                is_out_of_order: room.is_out_of_order,
                next_maintenance_date: room.next_maintenance_date
            })),
            category_statistics: categoryStats,
            summary: {
                total_rooms: stats.total,
                available_rooms: stats.by_status[ROOM_STATUS.AVAILABLE] || 0,
                occupied_rooms: stats.by_status[ROOM_STATUS.OCCUPIED] || 0,
                rooms_needing_attention: roomsNeedingAttention.length,
                occupancy_rate: stats.occupancy_rate
            }
        }
    });
});

/**
 * Programa mantenimiento para una habitación
 */
const scheduleMaintenanceWork = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { maintenance_date, notes } = req.body;

    const room = await Room.findByPk(id);

    if (!room) {
        return res.status(404).json({
            success: false,
            message: 'Habitación no encontrada'
        });
    }

    await room.update({
        next_maintenance_date: maintenance_date,
        maintenance_notes: notes || room.maintenance_notes
    });

    logger.info('Mantenimiento programado', {
        roomId: id,
        roomNumber: room.room_number,
        maintenanceDate: maintenance_date,
        scheduledBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Mantenimiento programado exitosamente',
        data: {
            room: {
                id: room.id,
                room_number: room.room_number,
                next_maintenance_date: room.next_maintenance_date,
                maintenance_notes: room.maintenance_notes
            }
        }
    });
});

module.exports = {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    changeRoomStatus,
    setOutOfOrder,
    setInService,
    searchAvailableRooms,
    getRoomCalendar,
    getRoomStats,
    scheduleMaintenanceWork
};