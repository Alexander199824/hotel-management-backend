/**
 * Índice de Modelos - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Este archivo centraliza todos los modelos y define las relaciones entre ellos
 * Importa todos los modelos y configura las asociaciones de Sequelize
 */

const { sequelize } = require('../config/database');

// Importar todos los modelos
const User = require('./User');
const Guest = require('./Guest');
const Room = require('./Room');
const Reservation = require('./Reservation');
const Invoice = require('./Invoice');
const AdditionalService = require('./AdditionalService');
const Incident = require('./Incident');

// Definir todas las relaciones entre modelos

// Relaciones de User
User.hasMany(Reservation, { 
    foreignKey: 'created_by_user_id', 
    as: 'createdReservations' 
});
User.hasMany(Reservation, { 
    foreignKey: 'confirmed_by_user_id', 
    as: 'confirmedReservations' 
});
User.hasMany(Reservation, { 
    foreignKey: 'cancelled_by_user_id', 
    as: 'cancelledReservations' 
});
User.hasMany(Invoice, { 
    foreignKey: 'created_by_user_id', 
    as: 'createdInvoices' 
});
User.hasMany(Invoice, { 
    foreignKey: 'voided_by_user_id', 
    as: 'voidedInvoices' 
});
User.hasMany(AdditionalService, { 
    foreignKey: 'registered_by_user_id', 
    as: 'registeredServices' 
});
User.hasMany(AdditionalService, { 
    foreignKey: 'cancelled_by_user_id', 
    as: 'cancelledServices' 
});
User.hasMany(AdditionalService, { 
    foreignKey: 'completed_by_user_id', 
    as: 'completedServices' 
});
User.hasMany(Incident, { 
    foreignKey: 'reported_by_user_id', 
    as: 'reportedIncidents' 
});
User.hasMany(Incident, { 
    foreignKey: 'assigned_to_user_id', 
    as: 'assignedIncidents' 
});
User.hasMany(Incident, { 
    foreignKey: 'resolved_by_user_id', 
    as: 'resolvedIncidents' 
});

// Relaciones de Guest
Guest.hasMany(Reservation, { 
    foreignKey: 'guest_id', 
    as: 'reservations' 
});
Guest.hasMany(Invoice, { 
    foreignKey: 'guest_id', 
    as: 'invoices' 
});
Guest.hasMany(AdditionalService, { 
    foreignKey: 'guest_id', 
    as: 'additionalServices' 
});

// Relaciones de Room
Room.hasMany(Reservation, { 
    foreignKey: 'room_id', 
    as: 'reservations' 
});
Room.hasMany(AdditionalService, { 
    foreignKey: 'room_id', 
    as: 'additionalServices' 
});
Room.hasMany(Incident, { 
    foreignKey: 'room_id', 
    as: 'incidents' 
});

// Relaciones de Reservation
Reservation.belongsTo(Guest, { 
    foreignKey: 'guest_id', 
    as: 'guest' 
});
Reservation.belongsTo(Room, { 
    foreignKey: 'room_id', 
    as: 'room' 
});
Reservation.belongsTo(User, { 
    foreignKey: 'created_by_user_id', 
    as: 'createdBy' 
});
Reservation.belongsTo(User, { 
    foreignKey: 'confirmed_by_user_id', 
    as: 'confirmedBy' 
});
Reservation.belongsTo(User, { 
    foreignKey: 'cancelled_by_user_id', 
    as: 'cancelledBy' 
});
Reservation.hasMany(Invoice, { 
    foreignKey: 'reservation_id', 
    as: 'invoices' 
});
Reservation.hasMany(AdditionalService, { 
    foreignKey: 'reservation_id', 
    as: 'additionalServices' 
});

// Relaciones de Invoice
Invoice.belongsTo(Reservation, { 
    foreignKey: 'reservation_id', 
    as: 'reservation' 
});
Invoice.belongsTo(Guest, { 
    foreignKey: 'guest_id', 
    as: 'guest' 
});
Invoice.belongsTo(User, { 
    foreignKey: 'created_by_user_id', 
    as: 'createdBy' 
});
Invoice.belongsTo(User, { 
    foreignKey: 'voided_by_user_id', 
    as: 'voidedBy' 
});
Invoice.hasMany(AdditionalService, { 
    foreignKey: 'invoice_id', 
    as: 'additionalServices' 
});

// Relaciones de AdditionalService
AdditionalService.belongsTo(Reservation, { 
    foreignKey: 'reservation_id', 
    as: 'reservation' 
});
AdditionalService.belongsTo(Guest, { 
    foreignKey: 'guest_id', 
    as: 'guest' 
});
AdditionalService.belongsTo(Room, { 
    foreignKey: 'room_id', 
    as: 'room' 
});
AdditionalService.belongsTo(Invoice, { 
    foreignKey: 'invoice_id', 
    as: 'invoice' 
});
AdditionalService.belongsTo(User, { 
    foreignKey: 'registered_by_user_id', 
    as: 'registeredBy' 
});
AdditionalService.belongsTo(User, { 
    foreignKey: 'cancelled_by_user_id', 
    as: 'cancelledBy' 
});
AdditionalService.belongsTo(User, { 
    foreignKey: 'completed_by_user_id', 
    as: 'completedBy' 
});

// Relaciones de Incident
Incident.belongsTo(Room, { 
    foreignKey: 'room_id', 
    as: 'room' 
});
Incident.belongsTo(User, { 
    foreignKey: 'reported_by_user_id', 
    as: 'reportedBy' 
});
Incident.belongsTo(User, { 
    foreignKey: 'assigned_to_user_id', 
    as: 'assignedTo' 
});
Incident.belongsTo(User, { 
    foreignKey: 'resolved_by_user_id', 
    as: 'resolvedBy' 
});
Incident.belongsTo(User, { 
    foreignKey: 'cancelled_by_user_id', 
    as: 'cancelledBy' 
});
// Relación de incidencias relacionadas
Incident.belongsTo(Incident, { 
    foreignKey: 'related_incident_id', 
    as: 'relatedIncident' 
});
Incident.hasMany(Incident, { 
    foreignKey: 'related_incident_id', 
    as: 'relatedIncidents' 
});

// Exportar todos los modelos y sequelize
module.exports = {
    sequelize,
    User,
    Guest,
    Room,
    Reservation,
    Invoice,
    AdditionalService,
    Incident
};