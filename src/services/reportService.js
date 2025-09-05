/**
 * Servicio de Reportes - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Genera reportes de ocupación, ventas, huéspedes y análisis financiero
 * Incluye exportación en diferentes formatos (PDF, Excel, CSV)
 */

const { logger } = require('../utils/logger');
const { REPORT_TYPES, EXPORT_FORMATS } = require('../utils/constants');
const { sequelize } = require('../config/database');

/**
 * Clase principal del servicio de reportes
 */
class ReportService {
    constructor() {
        this.supportedFormats = Object.values(EXPORT_FORMATS);
        this.supportedTypes = Object.values(REPORT_TYPES);
    }

    /**
     * Genera reporte de ocupación del hotel
     */
    async generateOccupancyReport(startDate, endDate, filters = {}) {
        try {
            logger.info('Generando reporte de ocupación', {
                startDate,
                endDate,
                filters
            });

            // Importar modelos necesarios
            const Room = require('../models/Room');
            const Reservation = require('../models/Reservation');

            // Obtener total de habitaciones disponibles
            const totalRooms = await Room.count({
                where: { is_active: true }
            });

            // Obtener reservas en el período
            const reservations = await Reservation.findByDateRange(
                startDate,
                endDate,
                filters.status
            );

            // Calcular estadísticas por día
            const dailyStats = await this.calculateDailyOccupancy(
                startDate,
                endDate,
                totalRooms
            );

            // Estadísticas por categoría de habitación
            const categoryStats = await this.getOccupancyByCategory(
                startDate,
                endDate
            );

            // Calcular métricas principales
            const totalNights = this.calculateTotalNights(startDate, endDate);
            const occupiedRoomNights = reservations.reduce((sum, reservation) => {
                return sum + reservation.nights_count;
            }, 0);

            const occupancyRate = totalRooms > 0 ? 
                (occupiedRoomNights / (totalRooms * totalNights)) * 100 : 0;

            const reportData = {
                type: REPORT_TYPES.OCCUPANCY,
                period: {
                    start_date: startDate,
                    end_date: endDate,
                    total_days: totalNights
                },
                summary: {
                    total_rooms: totalRooms,
                    total_reservations: reservations.length,
                    occupied_room_nights: occupiedRoomNights,
                    available_room_nights: (totalRooms * totalNights) - occupiedRoomNights,
                    occupancy_rate: Math.round(occupancyRate * 100) / 100,
                    average_daily_rate: this.calculateADR(reservations),
                    revenue_per_available_room: this.calculateRevPAR(reservations, totalRooms, totalNights)
                },
                daily_statistics: dailyStats,
                category_statistics: categoryStats,
                trends: this.analyzeTrends(dailyStats),
                generated_at: new Date(),
                filters: filters
            };

            logger.info('Reporte de ocupación generado exitosamente', {
                occupancyRate: reportData.summary.occupancy_rate,
                totalReservations: reportData.summary.total_reservations
            });

            return reportData;

        } catch (error) {
            logger.error('Error generando reporte de ocupación', error);
            throw error;
        }
    }

    /**
     * Genera reporte de ventas y ingresos
     */
    async generateSalesReport(startDate, endDate, filters = {}) {
        try {
            logger.info('Generando reporte de ventas', {
                startDate,
                endDate,
                filters
            });

            const Reservation = require('../models/Reservation');
            const AdditionalService = require('../models/AdditionalService');
            const Invoice = require('../models/Invoice');

            // Obtener datos de reservas
            const reservations = await Reservation.findByDateRange(startDate, endDate);
            
            // Obtener servicios adicionales
            const additionalServices = await AdditionalService.findAll({
                where: {
                    service_date: {
                        [sequelize.Sequelize.Op.between]: [startDate, endDate]
                    },
                    status: 'completed'
                }
            });

            // Obtener facturas del período
            const invoices = await Invoice.findAll({
                where: {
                    invoice_date: {
                        [sequelize.Sequelize.Op.between]: [startDate, endDate]
                    },
                    voided_at: null
                }
            });

            // Calcular ingresos por hospedaje
            const accommodationRevenue = reservations.reduce((sum, reservation) => {
                return sum + parseFloat(reservation.total_amount);
            }, 0);

            // Calcular ingresos por servicios adicionales
            const servicesRevenue = additionalServices.reduce((sum, service) => {
                return sum + parseFloat(service.total_amount);
            }, 0);

            // Análisis por fuente de ingresos
            const revenueBySource = {
                accommodation: accommodationRevenue,
                additional_services: servicesRevenue,
                total: accommodationRevenue + servicesRevenue
            };

            // Análisis por tipo de servicio
            const serviceTypeRevenue = await this.getRevenueByServiceType(
                additionalServices
            );

            // Análisis por método de pago
            const paymentMethodAnalysis = await this.getRevenueByPaymentMethod(
                startDate,
                endDate
            );

            // Tendencias diarias
            const dailyRevenue = await this.calculateDailyRevenue(
                startDate,
                endDate
            );

            const reportData = {
                type: REPORT_TYPES.SALES,
                period: {
                    start_date: startDate,
                    end_date: endDate
                },
                summary: {
                    total_revenue: revenueBySource.total,
                    accommodation_revenue: accommodationRevenue,
                    services_revenue: servicesRevenue,
                    total_reservations: reservations.length,
                    total_services: additionalServices.length,
                    average_reservation_value: reservations.length > 0 ? 
                        accommodationRevenue / reservations.length : 0,
                    services_penetration_rate: reservations.length > 0 ? 
                        (additionalServices.length / reservations.length) * 100 : 0
                },
                revenue_by_source: revenueBySource,
                service_type_revenue: serviceTypeRevenue,
                payment_method_analysis: paymentMethodAnalysis,
                daily_revenue: dailyRevenue,
                top_performing_services: await this.getTopPerformingServices(
                    additionalServices
                ),
                generated_at: new Date(),
                filters: filters
            };

            logger.info('Reporte de ventas generado exitosamente', {
                totalRevenue: reportData.summary.total_revenue,
                totalReservations: reportData.summary.total_reservations
            });

            return reportData;

        } catch (error) {
            logger.error('Error generando reporte de ventas', error);
            throw error;
        }
    }

    /**
     * Genera reporte de huéspedes
     */
    async generateGuestsReport(startDate, endDate, filters = {}) {
        try {
            logger.info('Generando reporte de huéspedes', {
                startDate,
                endDate,
                filters
            });

            const Guest = require('../models/Guest');
            const Reservation = require('../models/Reservation');

            // Obtener huéspedes que tuvieron reservas en el período
            const reservationsInPeriod = await Reservation.findByDateRange(
                startDate,
                endDate
            );

            const guestIds = [...new Set(reservationsInPeriod.map(r => r.guest_id))];
            
            const guests = await Guest.findAll({
                where: {
                    id: {
                        [sequelize.Sequelize.Op.in]: guestIds
                    }
                }
            });

            // Análisis demográfico
            const demographicAnalysis = this.analyzeDemographics(guests);

            // Análisis de nacionalidades
            const nationalityAnalysis = this.analyzeNationalities(guests);

            // Análisis de lealtad
            const loyaltyAnalysis = this.analyzeLoyalty(guests);

            // Huéspedes frecuentes
            const frequentGuests = guests
                .filter(guest => guest.total_stays > 1)
                .sort((a, b) => b.total_stays - a.total_stays)
                .slice(0, 20);

            // Análisis de satisfacción (si hay datos disponibles)
            const satisfactionAnalysis = await this.analyzeSatisfaction(guestIds);

            const reportData = {
                type: REPORT_TYPES.GUESTS,
                period: {
                    start_date: startDate,
                    end_date: endDate
                },
                summary: {
                    total_unique_guests: guests.length,
                    new_guests: guests.filter(g => g.total_stays === 1).length,
                    returning_guests: guests.filter(g => g.total_stays > 1).length,
                    vip_guests: guests.filter(g => g.vip_status).length,
                    average_stays_per_guest: guests.length > 0 ? 
                        guests.reduce((sum, g) => sum + g.total_stays, 0) / guests.length : 0
                },
                demographic_analysis: demographicAnalysis,
                nationality_analysis: nationalityAnalysis,
                loyalty_analysis: loyaltyAnalysis,
                frequent_guests: frequentGuests.map(guest => ({
                    id: guest.id,
                    name: guest.getFullName(),
                    email: guest.email,
                    total_stays: guest.total_stays,
                    total_spent: guest.total_spent,
                    vip_status: guest.vip_status
                })),
                satisfaction_analysis: satisfactionAnalysis,
                generated_at: new Date(),
                filters: filters
            };

            logger.info('Reporte de huéspedes generado exitosamente', {
                totalGuests: reportData.summary.total_unique_guests,
                vipGuests: reportData.summary.vip_guests
            });

            return reportData;

        } catch (error) {
            logger.error('Error generando reporte de huéspedes', error);
            throw error;
        }
    }

    /**
     * Genera reporte financiero detallado
     */
    async generateFinancialReport(startDate, endDate, filters = {}) {
        try {
            logger.info('Generando reporte financiero', {
                startDate,
                endDate,
                filters
            });

            // Obtener datos de múltiples fuentes
            const [
                reservationStats,
                serviceStats,
                invoiceStats,
                incidentCosts
            ] = await Promise.all([
                this.getReservationFinancials(startDate, endDate),
                this.getServiceFinancials(startDate, endDate),
                this.getInvoiceFinancials(startDate, endDate),
                this.getIncidentCosts(startDate, endDate)
            ]);

            // Calcular ingresos totales
            const totalRevenue = reservationStats.total_revenue + serviceStats.total_revenue;

            // Calcular costos operativos estimados
            const operatingCosts = {
                incident_costs: incidentCosts.total_cost,
                maintenance_estimate: totalRevenue * 0.05, // 5% estimado
                utilities_estimate: totalRevenue * 0.08, // 8% estimado
                staff_estimate: totalRevenue * 0.25, // 25% estimado
                total: 0
            };

            operatingCosts.total = Object.values(operatingCosts)
                .filter(cost => typeof cost === 'number')
                .reduce((sum, cost) => sum + cost, 0);

            // Calcular beneficio bruto estimado
            const grossProfit = totalRevenue - operatingCosts.total;
            const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

            // Análisis de flujo de caja
            const cashFlowAnalysis = await this.analyzeCashFlow(startDate, endDate);

            const reportData = {
                type: REPORT_TYPES.FINANCIAL,
                period: {
                    start_date: startDate,
                    end_date: endDate
                },
                revenue_summary: {
                    accommodation_revenue: reservationStats.total_revenue,
                    services_revenue: serviceStats.total_revenue,
                    total_revenue: totalRevenue,
                    taxes_collected: reservationStats.total_taxes + serviceStats.total_taxes
                },
                cost_summary: operatingCosts,
                profitability: {
                    gross_profit: grossProfit,
                    profit_margin: Math.round(profitMargin * 100) / 100,
                    revenue_per_guest: reservationStats.guest_count > 0 ? 
                        totalRevenue / reservationStats.guest_count : 0
                },
                cash_flow: cashFlowAnalysis,
                payment_analysis: {
                    total_invoiced: invoiceStats.total_invoiced,
                    total_paid: invoiceStats.total_paid,
                    outstanding_balance: invoiceStats.total_invoiced - invoiceStats.total_paid,
                    collection_rate: invoiceStats.total_invoiced > 0 ? 
                        (invoiceStats.total_paid / invoiceStats.total_invoiced) * 100 : 0
                },
                key_metrics: {
                    average_daily_rate: reservationStats.adr,
                    revenue_per_available_room: reservationStats.revpar,
                    cost_per_occupied_room: reservationStats.occupied_rooms > 0 ? 
                        operatingCosts.total / reservationStats.occupied_rooms : 0
                },
                generated_at: new Date(),
                filters: filters
            };

            logger.info('Reporte financiero generado exitosamente', {
                totalRevenue: reportData.revenue_summary.total_revenue,
                grossProfit: reportData.profitability.gross_profit
            });

            return reportData;

        } catch (error) {
            logger.error('Error generando reporte financiero', error);
            throw error;
        }
    }

    /**
     * Calcula ocupación diaria
     */
    async calculateDailyOccupancy(startDate, endDate, totalRooms) {
        const Reservation = require('../models/Reservation');
        const dailyStats = [];
        
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dayStart = new Date(date);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const reservationsOnDay = await Reservation.count({
                where: {
                    check_in_date: {
                        [sequelize.Sequelize.Op.lte]: dayEnd
                    },
                    check_out_date: {
                        [sequelize.Sequelize.Op.gt]: dayStart
                    },
                    status: {
                        [sequelize.Sequelize.Op.in]: ['confirmed', 'checked_in', 'checked_out']
                    }
                }
            });

            const occupancyRate = totalRooms > 0 ? (reservationsOnDay / totalRooms) * 100 : 0;

            dailyStats.push({
                date: new Date(date).toISOString().split('T')[0],
                occupied_rooms: reservationsOnDay,
                available_rooms: totalRooms - reservationsOnDay,
                occupancy_rate: Math.round(occupancyRate * 100) / 100
            });
        }

        return dailyStats;
    }

    /**
     * Obtiene ocupación por categoría de habitación
     */
    async getOccupancyByCategory(startDate, endDate) {
        try {
            const query = `
                SELECT 
                    r.category,
                    COUNT(DISTINCT r.id) as total_rooms,
                    COUNT(DISTINCT res.id) as occupied_reservations,
                    ROUND(
                        (COUNT(DISTINCT res.id)::float / COUNT(DISTINCT r.id)) * 100, 2
                    ) as occupancy_rate
                FROM rooms r
                LEFT JOIN reservations res ON r.id = res.room_id 
                    AND res.check_in_date <= $2 
                    AND res.check_out_date > $1
                    AND res.status IN ('confirmed', 'checked_in', 'checked_out')
                WHERE r.is_active = true
                GROUP BY r.category
                ORDER BY occupancy_rate DESC
            `;

            const results = await sequelize.query(query, {
                bind: [startDate, endDate],
                type: sequelize.QueryTypes.SELECT
            });

            return results;
        } catch (error) {
            logger.error('Error obteniendo ocupación por categoría', error);
            return [];
        }
    }

    /**
     * Calcula Average Daily Rate (ADR)
     */
    calculateADR(reservations) {
        if (reservations.length === 0) return 0;
        
        const totalRevenue = reservations.reduce((sum, res) => sum + parseFloat(res.total_amount), 0);
        const totalNights = reservations.reduce((sum, res) => sum + res.nights_count, 0);
        
        return totalNights > 0 ? Math.round((totalRevenue / totalNights) * 100) / 100 : 0;
    }

    /**
     * Calcula Revenue Per Available Room (RevPAR)
     */
    calculateRevPAR(reservations, totalRooms, totalNights) {
        if (totalRooms === 0 || totalNights === 0) return 0;
        
        const totalRevenue = reservations.reduce((sum, res) => sum + parseFloat(res.total_amount), 0);
        const availableRoomNights = totalRooms * totalNights;
        
        return Math.round((totalRevenue / availableRoomNights) * 100) / 100;
    }

    /**
     * Calcula el número total de noches entre dos fechas
     */
    calculateTotalNights(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Analiza tendencias en los datos diarios
     */
    analyzeTrends(dailyStats) {
        if (dailyStats.length < 2) return { trend: 'insufficient_data' };

        const firstWeek = dailyStats.slice(0, 7);
        const lastWeek = dailyStats.slice(-7);

        const firstWeekAvg = firstWeek.reduce((sum, day) => sum + day.occupancy_rate, 0) / firstWeek.length;
        const lastWeekAvg = lastWeek.reduce((sum, day) => sum + day.occupancy_rate, 0) / lastWeek.length;

        const trendDirection = lastWeekAvg > firstWeekAvg ? 'increasing' : 
                              lastWeekAvg < firstWeekAvg ? 'decreasing' : 'stable';

        return {
            trend: trendDirection,
            first_week_avg: Math.round(firstWeekAvg * 100) / 100,
            last_week_avg: Math.round(lastWeekAvg * 100) / 100,
            change_percentage: Math.round(((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 10000) / 100
        };
    }

    /**
     * Exporta reporte a formato específico
     */
    async exportReport(reportData, format = EXPORT_FORMATS.JSON) {
        try {
            logger.info('Exportando reporte', {
                type: reportData.type,
                format
            });

            switch (format) {
                case EXPORT_FORMATS.JSON:
                    return {
                        data: JSON.stringify(reportData, null, 2),
                        filename: `${reportData.type}_report_${new Date().toISOString().split('T')[0]}.json`,
                        contentType: 'application/json'
                    };

                case EXPORT_FORMATS.CSV:
                    return this.exportToCSV(reportData);

                case EXPORT_FORMATS.PDF:
                    return this.exportToPDF(reportData);

                case EXPORT_FORMATS.EXCEL:
                    return this.exportToExcel(reportData);

                default:
                    throw new Error(`Formato de exportación ${format} no soportado`);
            }

        } catch (error) {
            logger.error('Error exportando reporte', error);
            throw error;
        }
    }

    /**
     * Métodos auxiliares para diferentes análisis
     */
    async getRevenueByServiceType(services) {
        const serviceTypeRevenue = services.reduce((acc, service) => {
            const type = service.service_type;
            acc[type] = (acc[type] || 0) + parseFloat(service.total_amount);
            return acc;
        }, {});

        return serviceTypeRevenue;
    }

    async getRevenueByPaymentMethod(startDate, endDate) {
        // Simulación de análisis por método de pago
        return {
            credit_card: 15000,
            cash: 8000,
            bank_transfer: 5000,
            stripe: 12000
        };
    }

    async calculateDailyRevenue(startDate, endDate) {
        // Simulación de ingresos diarios
        const dailyRevenue = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            dailyRevenue.push({
                date: new Date(date).toISOString().split('T')[0],
                accommodation: Math.floor(Math.random() * 5000) + 1000,
                services: Math.floor(Math.random() * 2000) + 500,
                total: 0
            });
            
            const lastEntry = dailyRevenue[dailyRevenue.length - 1];
            lastEntry.total = lastEntry.accommodation + lastEntry.services;
        }

        return dailyRevenue;
    }

    async getTopPerformingServices(services) {
        const servicePerformance = services.reduce((acc, service) => {
            const name = service.service_name;
            if (!acc[name]) {
                acc[name] = {
                    name,
                    count: 0,
                    revenue: 0,
                    avg_rating: 0,
                    total_ratings: 0
                };
            }
            
            acc[name].count += 1;
            acc[name].revenue += parseFloat(service.total_amount);
            
            if (service.guest_rating) {
                acc[name].total_ratings += 1;
                acc[name].avg_rating = (
                    (acc[name].avg_rating * (acc[name].total_ratings - 1)) + service.guest_rating
                ) / acc[name].total_ratings;
            }
            
            return acc;
        }, {});

        return Object.values(servicePerformance)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
    }

    // Métodos auxiliares para análisis de huéspedes
    analyzeDemographics(guests) {
        const ageGroups = {
            '18-25': 0,
            '26-35': 0,
            '36-45': 0,
            '46-55': 0,
            '56-65': 0,
            '65+': 0,
            'unknown': 0
        };

        const genderDistribution = {
            male: 0,
            female: 0,
            other: 0,
            unknown: 0
        };

        guests.forEach(guest => {
            // Análisis de edad
            const age = guest.getAge();
            if (age === null) {
                ageGroups.unknown++;
            } else if (age >= 18 && age <= 25) {
                ageGroups['18-25']++;
            } else if (age >= 26 && age <= 35) {
                ageGroups['26-35']++;
            } else if (age >= 36 && age <= 45) {
                ageGroups['36-45']++;
            } else if (age >= 46 && age <= 55) {
                ageGroups['46-55']++;
            } else if (age >= 56 && age <= 65) {
                ageGroups['56-65']++;
            } else if (age > 65) {
                ageGroups['65+']++;
            }

            // Análisis de género
            if (guest.gender) {
                genderDistribution[guest.gender]++;
            } else {
                genderDistribution.unknown++;
            }
        });

        return {
            age_groups: ageGroups,
            gender_distribution: genderDistribution
        };
    }

    analyzeNationalities(guests) {
        return guests.reduce((acc, guest) => {
            const nationality = guest.nationality || 'unknown';
            acc[nationality] = (acc[nationality] || 0) + 1;
            return acc;
        }, {});
    }

    analyzeLoyalty(guests) {
        const loyaltyTiers = {
            new: guests.filter(g => g.total_stays === 1).length,
            returning: guests.filter(g => g.total_stays > 1 && g.total_stays <= 5).length,
            frequent: guests.filter(g => g.total_stays > 5 && g.total_stays <= 10).length,
            vip: guests.filter(g => g.total_stays > 10 || g.vip_status).length
        };

        return loyaltyTiers;
    }

    async analyzeSatisfaction(guestIds) {
        // Simulación de análisis de satisfacción
        return {
            average_rating: 4.2,
            total_reviews: Math.floor(guestIds.length * 0.6),
            rating_distribution: {
                5: 45,
                4: 30,
                3: 15,
                2: 7,
                1: 3
            }
        };
    }

    // Métodos para reporte financiero
    async getReservationFinancials(startDate, endDate) {
        // Simulación de datos financieros de reservas
        return {
            total_revenue: 85000,
            total_taxes: 8500,
            guest_count: 156,
            occupied_rooms: 89,
            adr: 485.50,
            revpar: 324.75
        };
    }

    async getServiceFinancials(startDate, endDate) {
        // Simulación de datos financieros de servicios
        return {
            total_revenue: 25000,
            total_taxes: 2500
        };
    }

    async getInvoiceFinancials(startDate, endDate) {
        // Simulación de datos de facturación
        return {
            total_invoiced: 110000,
            total_paid: 98500,
            pending_amount: 11500
        };
    }

    async getIncidentCosts(startDate, endDate) {
        // Simulación de costos de incidencias
        return {
            total_cost: 12500,
            incident_count: 24
        };
    }

    async analyzeCashFlow(startDate, endDate) {
        // Simulación de análisis de flujo de caja
        return {
            cash_inflow: 98500,
            cash_outflow: 45000,
            net_cash_flow: 53500,
            receivables: 11500
        };
    }

    // Métodos de exportación (implementaciones básicas)
    exportToCSV(reportData) {
        const csvData = this.convertToCSV(reportData);
        return {
            data: csvData,
            filename: `${reportData.type}_report_${new Date().toISOString().split('T')[0]}.csv`,
            contentType: 'text/csv'
        };
    }

    exportToPDF(reportData) {
        // En implementación real, usar librerías como jsPDF o Puppeteer
        return {
            data: `PDF placeholder for ${reportData.type} report`,
            filename: `${reportData.type}_report_${new Date().toISOString().split('T')[0]}.pdf`,
            contentType: 'application/pdf'
        };
    }

    exportToExcel(reportData) {
        // En implementación real, usar librerías como ExcelJS
        return {
            data: `Excel placeholder for ${reportData.type} report`,
            filename: `${reportData.type}_report_${new Date().toISOString().split('T')[0]}.xlsx`,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
    }

    convertToCSV(data) {
        // Implementación básica de conversión a CSV
        let csv = '';
        
        if (data.summary) {
            csv += 'Summary\n';
            Object.entries(data.summary).forEach(([key, value]) => {
                csv += `${key},${value}\n`;
            });
            csv += '\n';
        }

        return csv;
    }
}

// Crear instancia única del servicio
const reportService = new ReportService();

module.exports = reportService;