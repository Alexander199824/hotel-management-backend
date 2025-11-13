/**
 * Controlador de Huéspedes - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Maneja todas las operaciones relacionadas con huéspedes:
 * registro, consulta, actualización, historial y análisis demográfico
 */

const { Guest, Reservation, AdditionalService, sequelize } = require('../models');
const { catchAsync } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { PAGINATION } = require('../utils/constants');

/**
 * Obtiene todos los huéspedes con filtros y paginación
 */
const getAllGuests = catchAsync(async (req, res) => {
    const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        search,
        nationality,
        vip_status,
        min_stays,
        sort_by = 'created_at',
        sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereConditions = {};

    // Aplicar filtros
    if (nationality) {
        whereConditions.nationality = nationality;
    }

    if (vip_status !== undefined) {
        whereConditions.vip_status = vip_status === 'true';
    }

    if (min_stays) {
        whereConditions.total_stays = {
            [sequelize.Sequelize.Op.gte]: parseInt(min_stays)
        };
    }

    // Búsqueda por nombre o email
    if (search) {
        whereConditions[sequelize.Sequelize.Op.or] = [
            {
                first_name: {
                    [sequelize.Sequelize.Op.iLike]: `%${search}%`
                }
            },
            {
                last_name: {
                    [sequelize.Sequelize.Op.iLike]: `%${search}%`
                }
            },
            {
                email: {
                    [sequelize.Sequelize.Op.iLike]: `%${search}%`
                }
            },
            {
                phone: {
                    [sequelize.Sequelize.Op.iLike]: `%${search}%`
                }
            }
        ];
    }

    // Configurar ordenamiento
    const validSortFields = ['created_at', 'last_name', 'total_stays', 'total_spent', 'last_stay_date'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = ['ASC', 'DESC'].includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    const { rows: guests, count: total } = await Guest.findAndCountAll({
        where: whereConditions,
        order: [[sortField, sortDirection]],
        limit: parseInt(limit),
        offset: parseInt(offset)
    });

    logger.info('Huéspedes consultados', {
        userId: req.user.id,
        total,
        page,
        filters: { search, nationality, vip_status, min_stays }
    });

    res.json({
        success: true,
        data: {
            guests: guests.map(guest => ({
                ...guest.getPublicData(),
                age: guest.getAge(),
                full_name: guest.getFullName(),
                contact_info: guest.getContactInfo()
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
 * Obtiene un huésped específico por ID
 */
const getGuestById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const guest = await Guest.findByPk(id);

    if (!guest) {
        return res.status(404).json({
            success: false,
            message: 'Huésped no encontrado'
        });
    }

    // Obtener historial de reservas
    const reservations = await Reservation.findAll({
        where: { guest_id: id },
        include: [
            {
                model: require('../models/Room'),
                as: 'room',
                attributes: ['id', 'room_number', 'category']
            }
        ],
        order: [['check_in_date', 'DESC']],
        limit: 10
    });

    // Obtener servicios adicionales utilizados
    const additionalServices = await AdditionalService.findAll({
        where: { guest_id: id },
        order: [['service_date', 'DESC']],
        limit: 10
    });

    res.json({
        success: true,
        data: {
            guest: {
                ...guest.toJSON(),
                age: guest.getAge(),
                full_name: guest.getFullName(),
                contact_info: guest.getContactInfo(),
                preferences: guest.getPreferences(),
                can_make_reservations: guest.canMakeReservations()
            },
            recent_reservations: reservations.map(reservation => ({
                ...reservation.getSummary(),
                room: reservation.room
            })),
            recent_services: additionalServices.map(service => service.getSummary()),
            statistics: {
                total_reservations: reservations.length,
                total_services: additionalServices.length,
                lifetime_value: guest.total_spent,
                loyalty_tier: this.calculateLoyaltyTier(guest)
            }
        }
    });
});

/**
 * Crea un nuevo huésped
 */
const createGuest = catchAsync(async (req, res) => {
    const {
        first_name,
        last_name,
        email,
        phone,
        alternative_phone,
        document_type,
        document_number,
        document_country,
        date_of_birth,
        gender,
        nationality,
        address,
        city,
        state_province,
        postal_code,
        country,
        language = 'es',
        dietary_restrictions = [],
        special_needs,
        preferences = {},
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        newsletter_subscription = false,
        marketing_emails = false,
        how_did_you_hear
    } = req.body;

    // Verificar que no existe un huésped con el mismo email
    const existingGuest = await Guest.findOne({ where: { email } });
    if (existingGuest) {
        return res.status(400).json({
            success: false,
            message: 'Ya existe un huésped registrado con este correo electrónico'
        });
    }

    // Verificar que no existe un huésped con el mismo documento
    const existingDocument = await Guest.findOne({
        where: {
            document_number,
            document_country
        }
    });
    if (existingDocument) {
        return res.status(400).json({
            success: false,
            message: 'Ya existe un huésped registrado con este documento'
        });
    }

    const guest = await Guest.create({
        first_name,
        last_name,
        email,
        phone,
        alternative_phone,
        document_type,
        document_number,
        document_country,
        date_of_birth,
        gender,
        nationality,
        address,
        city,
        state_province,
        postal_code,
        country,
        language,
        dietary_restrictions,
        special_needs,
        preferences,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        newsletter_subscription,
        marketing_emails,
        how_did_you_hear
    });

    logger.info('Huésped creado', {
        guestId: guest.id,
        email: guest.email,
        name: guest.getFullName(),
        createdBy: req.user.id
    });

    res.status(201).json({
        success: true,
        message: 'Huésped registrado exitosamente',
        data: {
            guest: guest.getPublicData()
        }
    });
});

/**
 * Actualiza un huésped existente
 */
const updateGuest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const guest = await Guest.findByPk(id);

    if (!guest) {
        return res.status(404).json({
            success: false,
            message: 'Huésped no encontrado'
        });
    }

    // Campos que se pueden actualizar
    const allowedFields = [
        'first_name', 'last_name', 'phone', 'alternative_phone',
        'date_of_birth', 'gender', 'nationality', 'address', 'city',
        'state_province', 'postal_code', 'country', 'language',
        'dietary_restrictions', 'special_needs', 'preferences',
        'emergency_contact_name', 'emergency_contact_phone',
        'emergency_contact_relationship', 'newsletter_subscription',
        'marketing_emails'
    ];

    // Campos que solo el staff puede actualizar
    const staffOnlyFields = ['internal_notes', 'vip_status'];

    // Filtrar campos permitidos
    const filteredData = {};
    Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
            filteredData[key] = updateData[key];
        } else if (staffOnlyFields.includes(key) && req.user.isStaff()) {
            filteredData[key] = updateData[key];
        }
    });

    // Verificar email único si se está actualizando
    if (filteredData.email && filteredData.email !== guest.email) {
        const existingEmail = await Guest.findOne({
            where: {
                email: filteredData.email,
                id: { [sequelize.Sequelize.Op.ne]: id }
            }
        });

        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está en uso'
            });
        }
    }

    await guest.update(filteredData);

    logger.info('Huésped actualizado', {
        guestId: id,
        updatedFields: Object.keys(filteredData),
        updatedBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Huésped actualizado exitosamente',
        data: {
            guest: guest.getPublicData()
        }
    });
});

/**
 * Busca huéspedes por nombre o email
 */
const searchGuests = catchAsync(async (req, res) => {
    const { query } = req.query;

    if (!query || query.length < 2) {
        return res.status(400).json({
            success: false,
            message: 'La búsqueda debe tener al menos 2 caracteres'
        });
    }

    const guests = await Guest.searchByNameOrEmail(query);

    res.json({
        success: true,
        data: {
            guests: guests.map(guest => ({
                id: guest.id,
                full_name: guest.getFullName(),
                email: guest.email,
                phone: guest.phone,
                document_number: guest.document_number,
                total_stays: guest.total_stays,
                vip_status: guest.vip_status
            }))
        }
    });
});

/**
 * Obtiene el historial completo de un huésped
 */
const getGuestHistory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const guest = await Guest.findByPk(id);

    if (!guest) {
        return res.status(404).json({
            success: false,
            message: 'Huésped no encontrado'
        });
    }

    const offset = (page - 1) * limit;

    // Obtener historial completo de reservas
    const { rows: reservations, count: totalReservations } = await Reservation.findAndCountAll({
        where: { guest_id: id },
        include: [
            {
                model: require('../models/Room'),
                as: 'room',
                attributes: ['id', 'room_number', 'category', 'floor']
            }
        ],
        order: [['check_in_date', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
    });

    // Obtener servicios adicionales
    const additionalServices = await AdditionalService.findAll({
        where: { guest_id: id },
        order: [['service_date', 'DESC']]
    });

    // Calcular estadísticas
    const stats = {
        total_reservations: totalReservations,
        total_services: additionalServices.length,
        total_nights: reservations.reduce((sum, res) => sum + res.nights_count, 0),
        average_stay_duration: totalReservations > 0 ? 
            reservations.reduce((sum, res) => sum + res.nights_count, 0) / totalReservations : 0,
        favorite_room_category: this.calculateFavoriteCategory(reservations),
        total_spent: guest.total_spent,
        average_spending_per_stay: guest.total_stays > 0 ? guest.total_spent / guest.total_stays : 0
    };

    res.json({
        success: true,
        data: {
            guest: guest.getPublicData(),
            reservations: reservations.map(reservation => ({
                ...reservation.getSummary(),
                room: reservation.room
            })),
            additional_services: additionalServices.map(service => service.getSummary()),
            statistics: stats,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(totalReservations / limit),
                total_items: totalReservations,
                items_per_page: parseInt(limit)
            }
        }
    });
});

/**
 * Marca un huésped como VIP
 */
const promoteToVIP = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const guest = await Guest.findByPk(id);

    if (!guest) {
        return res.status(404).json({
            success: false,
            message: 'Huésped no encontrado'
        });
    }

    if (guest.vip_status) {
        return res.status(400).json({
            success: false,
            message: 'El huésped ya tiene estatus VIP'
        });
    }

    // Generar número de lealtad si no lo tiene
    if (!guest.loyalty_number) {
        guest.loyalty_number = await Guest.generateLoyaltyNumber();
    }

    await guest.update({
        vip_status: true,
        internal_notes: (guest.internal_notes || '') + 
            `\nPromovido a VIP (${new Date().toLocaleDateString()}): ${reason || 'Sin razón especificada'}`
    });

    logger.info('Huésped promovido a VIP', {
        guestId: id,
        guestName: guest.getFullName(),
        loyaltyNumber: guest.loyalty_number,
        reason,
        promotedBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Huésped promovido a VIP exitosamente',
        data: {
            guest: guest.getPublicData(),
            loyalty_number: guest.loyalty_number
        }
    });
});

/**
 * Remueve estatus VIP de un huésped
 */
const removeVIPStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const guest = await Guest.findByPk(id);

    if (!guest) {
        return res.status(404).json({
            success: false,
            message: 'Huésped no encontrado'
        });
    }

    if (!guest.vip_status) {
        return res.status(400).json({
            success: false,
            message: 'El huésped no tiene estatus VIP'
        });
    }

    await guest.update({
        vip_status: false,
        internal_notes: (guest.internal_notes || '') + 
            `\nEstatus VIP removido (${new Date().toLocaleDateString()}): ${reason || 'Sin razón especificada'}`
    });

    logger.info('Estatus VIP removido', {
        guestId: id,
        guestName: guest.getFullName(),
        reason,
        removedBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Estatus VIP removido exitosamente',
        data: {
            guest: guest.getPublicData()
        }
    });
});

/**
 * Agrega un huésped a la lista negra
 */
const addToBlacklist = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({
            success: false,
            message: 'Debe especificar la razón para agregar a la lista negra'
        });
    }

    const guest = await Guest.findByPk(id);

    if (!guest) {
        return res.status(404).json({
            success: false,
            message: 'Huésped no encontrado'
        });
    }

    if (guest.is_blacklisted) {
        return res.status(400).json({
            success: false,
            message: 'El huésped ya está en la lista negra'
        });
    }

    await guest.update({
        is_blacklisted: true,
        blacklist_reason: reason
    });

    logger.warn('Huésped agregado a lista negra', {
        guestId: id,
        guestName: guest.getFullName(),
        reason,
        addedBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Huésped agregado a la lista negra',
        data: {
            guest: guest.getPublicData()
        }
    });
});

/**
 * Remueve un huésped de la lista negra
 */
const removeFromBlacklist = catchAsync(async (req, res) => {
    const { id } = req.params;

    const guest = await Guest.findByPk(id);

    if (!guest) {
        return res.status(404).json({
            success: false,
            message: 'Huésped no encontrado'
        });
    }

    if (!guest.is_blacklisted) {
        return res.status(400).json({
            success: false,
            message: 'El huésped no está en la lista negra'
        });
    }

    await guest.update({
        is_blacklisted: false,
        blacklist_reason: null
    });

    logger.info('Huésped removido de lista negra', {
        guestId: id,
        guestName: guest.getFullName(),
        removedBy: req.user.id
    });

    res.json({
        success: true,
        message: 'Huésped removido de la lista negra exitosamente',
        data: {
            guest: guest.getPublicData()
        }
    });
});

/**
 * Obtiene estadísticas de huéspedes
 */
const getGuestStats = catchAsync(async (req, res) => {
    const stats = await Guest.getStats();
    const vipGuests = await Guest.getVipGuests();

    // Estadísticas adicionales
    const recentGuests = await Guest.findAll({
        where: {
            createdAt: {
                [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
        },
        order: [['createdAt', 'DESC']],
        limit: 10
    });

    res.json({
        success: true,
        data: {
            overview: stats,
            vip_guests: vipGuests.slice(0, 10).map(guest => ({
                id: guest.id,
                name: guest.getFullName(),
                total_stays: guest.total_stays,
                total_spent: guest.total_spent,
                loyalty_number: guest.loyalty_number
            })),
            recent_registrations: recentGuests.map(guest => ({
                id: guest.id,
                name: guest.getFullName(),
                email: guest.email,
                registered_at: guest.createdAt,
                nationality: guest.nationality
            }))
        }
    });
});

/**
 * Funciones auxiliares
 */
function calculateLoyaltyTier(guest) {
    if (guest.vip_status) return 'VIP';
    if (guest.total_stays >= 10) return 'Gold';
    if (guest.total_stays >= 5) return 'Silver';
    if (guest.total_stays >= 2) return 'Bronze';
    return 'New';
}

function calculateFavoriteCategory(reservations) {
    if (reservations.length === 0) return null;

    const categoryCount = reservations.reduce((acc, reservation) => {
        if (reservation.room) {
            const category = reservation.room.category;
            acc[category] = (acc[category] || 0) + 1;
        }
        return acc;
    }, {});

    return Object.keys(categoryCount).reduce((a, b) =>
        categoryCount[a] > categoryCount[b] ? a : b
    );
}

/**
 * Obtener o crear el perfil de huésped del usuario autenticado
 */
const getOrCreateMyProfile = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Obtener información del usuario
    const { User } = require('../models');
    const user = await User.findByPk(userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }

    // Buscar si ya existe un guest con el email del usuario
    let guest = await Guest.findOne({
        where: { email: user.email }
    });

    // Si no existe, crearlo automáticamente
    if (!guest) {
        logger.info('Creando perfil de huésped automáticamente para usuario', {
            userId: user.id,
            email: user.email
        });

        try {
            // Generar número de documento único usando primeros 8 caracteres del UUID
            const shortId = user.id.substring(0, 8).toUpperCase();

            guest = await Guest.create({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone || '+502 0000-0000', // Placeholder si no tiene teléfono
                document_type: 'other',
                document_number: `USR-${shortId}`, // Usar primeros 8 caracteres del UUID (12 caracteres total)
                document_country: 'GT'
            });

            logger.info('Perfil de huésped creado exitosamente', {
                guestId: guest.id,
                userId: user.id
            });
        } catch (createError) {
            logger.error('Error al crear perfil de huésped automáticamente', {
                userId: user.id,
                error: createError.message,
                stack: createError.stack
            });
            return res.status(500).json({
                success: false,
                message: 'Error al crear perfil de huésped: ' + createError.message
            });
        }
    }

    res.json({
        success: true,
        message: 'Perfil de huésped obtenido exitosamente',
        data: {
            guest: guest
        }
    });
});

module.exports = {
    getAllGuests,
    getGuestById,
    createGuest,
    updateGuest,
    searchGuests,
    getGuestHistory,
    promoteToVIP,
    removeVIPStatus,
    addToBlacklist,
    removeFromBlacklist,
    getGuestStats,
    getOrCreateMyProfile
};