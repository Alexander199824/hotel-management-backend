/**
 * Servicio de Email - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 * 
 * Maneja el envío de correos electrónicos para confirmaciones de reserva,
 * notificaciones, facturas y comunicaciones con huéspedes
 */

const nodemailer = require('nodemailer');
const config = require('../config/environment');
const { logger } = require('../utils/logger');

/**
 * Configuración del transportador de email
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    /**
     * Inicializa el transportador de nodemailer
     */
    async initializeTransporter() {
        try {
            this.transporter = nodemailer.createTransporter({
                host: config.email.host,
                port: config.email.port,
                secure: false, // true para 465, false para otros puertos
                auth: {
                    user: config.email.auth.user,
                    pass: config.email.auth.pass
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Verificar la conexión
            await this.transporter.verify();
            logger.info('Servicio de email inicializado correctamente');
        } catch (error) {
            logger.error('Error inicializando servicio de email', error);
            this.transporter = null;
        }
    }

    /**
     * Método base para enviar emails
     */
    async sendEmail({ to, subject, html, text, attachments = [] }) {
        try {
            if (!this.transporter) {
                throw new Error('Transportador de email no disponible');
            }

            const mailOptions = {
                from: config.email.from,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject,
                html,
                text: text || this.stripHtml(html),
                attachments
            };

            const result = await this.transporter.sendMail(mailOptions);
            
            logger.info('Email enviado exitosamente', {
                to: mailOptions.to,
                subject,
                messageId: result.messageId
            });

            return {
                success: true,
                messageId: result.messageId,
                response: result.response
            };
        } catch (error) {
            logger.error('Error enviando email', error, {
                to,
                subject
            });
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Elimina tags HTML para generar texto plano
     */
    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    /**
     * Genera template base para emails del hotel
     */
    generateBaseTemplate(content, title = 'Hotel Mar Azul') {
        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .header {
                    background-color: #2c5aa0;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                }
                .content {
                    padding: 30px;
                }
                .footer {
                    background-color: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    border-top: 1px solid #dee2e6;
                }
                .button {
                    display: inline-block;
                    padding: 12px 30px;
                    background-color: #007bff;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 10px 0;
                }
                .highlight {
                    background-color: #e7f3ff;
                    padding: 15px;
                    border-left: 4px solid #007bff;
                    margin: 15px 0;
                }
                .reservation-details {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 15px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏨 Hotel Mar Azul</h1>
                    <p>Tu experiencia inolvidable nos espera</p>
                </div>
                <div class="content">
                    ${content}
                </div>
                <div class="footer">
                    <p><strong>Hotel Mar Azul</strong></p>
                    <p>📍 Salamá, Baja Verapaz, Guatemala</p>
                    <p>📞 +502 7940-0000 | ✉️ info@hotelmarazul.com</p>
                    <p>🌐 www.hotelmarazul.com</p>
                    <hr style="margin: 15px 0;">
                    <p>Este es un email automático, por favor no responder directamente.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Envía confirmación de reserva
     */
    async sendReservationConfirmation(reservation, guest, room) {
        const content = `
            <h2>¡Reserva Confirmada! 🎉</h2>
            <p>Estimado/a <strong>${guest.getFullName()}</strong>,</p>
            <p>Nos complace confirmar su reserva en Hotel Mar Azul. A continuación encontrará los detalles de su estadía:</p>
            
            <div class="reservation-details">
                <h3>📋 Detalles de la Reserva</h3>
                <p><strong>Código de Reserva:</strong> ${reservation.reservation_code}</p>
                <p><strong>Habitación:</strong> ${room.room_number} - ${room.category.toUpperCase()}</p>
                <p><strong>Check-in:</strong> ${new Date(reservation.check_in_date).toLocaleDateString('es-GT')}</p>
                <p><strong>Check-out:</strong> ${new Date(reservation.check_out_date).toLocaleDateString('es-GT')}</p>
                <p><strong>Número de noches:</strong> ${reservation.nights_count}</p>
                <p><strong>Huéspedes:</strong> ${reservation.adults_count} adulto(s), ${reservation.children_count} niño(s)</p>
                <p><strong>Total:</strong> ${reservation.currency} ${reservation.total_amount}</p>
            </div>

            ${reservation.special_requests ? `
            <div class="highlight">
                <h4>📝 Solicitudes Especiales</h4>
                <p>${reservation.special_requests}</p>
            </div>
            ` : ''}

            <h3>📋 Información Importante</h3>
            <ul>
                <li><strong>Check-in:</strong> A partir de las 3:00 PM</li>
                <li><strong>Check-out:</strong> Hasta las 12:00 PM</li>
                <li><strong>Políticas de cancelación:</strong> Consulte nuestros términos y condiciones</li>
                <li><strong>WiFi gratuito</strong> disponible en todo el hotel</li>
            </ul>

            <p>Si tiene alguna pregunta o necesita asistencia, no dude en contactarnos.</p>
            <p>¡Esperamos darle la bienvenida muy pronto!</p>
            
            <p>Cordialmente,<br>
            <strong>Equipo Hotel Mar Azul</strong></p>
        `;

        return await this.sendEmail({
            to: guest.email,
            subject: `Confirmación de Reserva - ${reservation.reservation_code} - Hotel Mar Azul`,
            html: this.generateBaseTemplate(content, 'Confirmación de Reserva')
        });
    }

    /**
     * Envía recordatorio de check-in
     */
    async sendCheckInReminder(reservation, guest, room) {
        const checkInDate = new Date(reservation.check_in_date);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const content = `
            <h2>¡Su estadía comienza mañana! 🗓️</h2>
            <p>Estimado/a <strong>${guest.getFullName()}</strong>,</p>
            <p>Le recordamos que su check-in en Hotel Mar Azul está programado para mañana.</p>
            
            <div class="reservation-details">
                <h3>📋 Resumen de su Reserva</h3>
                <p><strong>Código:</strong> ${reservation.reservation_code}</p>
                <p><strong>Check-in:</strong> ${checkInDate.toLocaleDateString('es-GT')} a partir de las 3:00 PM</p>
                <p><strong>Habitación:</strong> ${room.room_number} - ${room.category.toUpperCase()}</p>
            </div>

            <h3>📝 Información para su llegada</h3>
            <ul>
                <li>Tenga a mano su documento de identidad</li>
                <li>Si llega antes de las 3:00 PM, podrá dejar su equipaje</li>
                <li>El estacionamiento es gratuito para huéspedes</li>
                <li>Check-in express disponible con reserva confirmada</li>
            </ul>

            <div class="highlight">
                <h4>🚗 ¿Cómo llegar?</h4>
                <p>Estamos ubicados en el centro de Salamá, Baja Verapaz.<br>
                Coordenadas GPS: 15.1045° N, 90.3105° W</p>
            </div>

            <p>¡Nos emociona recibirle muy pronto!</p>
            
            <p>Cordialmente,<br>
            <strong>Equipo Hotel Mar Azul</strong></p>
        `;

        return await this.sendEmail({
            to: guest.email,
            subject: `Recordatorio: Check-in mañana - ${reservation.reservation_code} - Hotel Mar Azul`,
            html: this.generateBaseTemplate(content, 'Recordatorio Check-in')
        });
    }

    /**
     * Envía factura por email
     */
    async sendInvoice(invoice, guest, reservation) {
        const content = `
            <h2>Factura - Hotel Mar Azul 🧾</h2>
            <p>Estimado/a <strong>${guest.getFullName()}</strong>,</p>
            <p>Adjunto encontrará la factura correspondiente a su estadía en Hotel Mar Azul.</p>
            
            <div class="reservation-details">
                <h3>📋 Información de Facturación</h3>
                <p><strong>Número de Factura:</strong> ${invoice.invoice_number}</p>
                <p><strong>Fecha de Emisión:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('es-GT')}</p>
                <p><strong>Reserva:</strong> ${reservation.reservation_code}</p>
                <p><strong>Período:</strong> ${new Date(invoice.service_date_from).toLocaleDateString('es-GT')} - ${new Date(invoice.service_date_to).toLocaleDateString('es-GT')}</p>
            </div>

            <div class="highlight">
                <h4>💰 Resumen de Costos</h4>
                <p><strong>Subtotal:</strong> ${invoice.currency} ${invoice.subtotal}</p>
                ${invoice.discount_amount > 0 ? `<p><strong>Descuento:</strong> -${invoice.currency} ${invoice.discount_amount}</p>` : ''}
                ${invoice.tax_amount > 0 ? `<p><strong>Impuestos:</strong> ${invoice.currency} ${invoice.tax_amount}</p>` : ''}
                <p><strong style="font-size: 18px;">Total:</strong> <strong style="font-size: 18px;">${invoice.currency} ${invoice.total_amount}</strong></p>
            </div>

            ${invoice.notes ? `
            <div class="highlight">
                <h4>📝 Notas</h4>
                <p>${invoice.notes}</p>
            </div>
            ` : ''}

            <p>Si tiene alguna pregunta sobre esta factura, no dude en contactarnos.</p>
            <p>¡Gracias por elegir Hotel Mar Azul!</p>
            
            <p>Cordialmente,<br>
            <strong>Departamento de Facturación<br>Hotel Mar Azul</strong></p>
        `;

        return await this.sendEmail({
            to: guest.email,
            subject: `Factura ${invoice.invoice_number} - Hotel Mar Azul`,
            html: this.generateBaseTemplate(content, 'Factura Hotel')
        });
    }

    /**
     * Envía notificación de cancelación
     */
    async sendCancellationNotification(reservation, guest, reason) {
        const content = `
            <h2>Cancelación de Reserva ❌</h2>
            <p>Estimado/a <strong>${guest.getFullName()}</strong>,</p>
            <p>Lamentamos informarle que su reserva ha sido cancelada.</p>
            
            <div class="reservation-details">
                <h3>📋 Detalles de la Reserva Cancelada</h3>
                <p><strong>Código de Reserva:</strong> ${reservation.reservation_code}</p>
                <p><strong>Fechas:</strong> ${new Date(reservation.check_in_date).toLocaleDateString('es-GT')} - ${new Date(reservation.check_out_date).toLocaleDateString('es-GT')}</p>
                <p><strong>Fecha de Cancelación:</strong> ${new Date().toLocaleDateString('es-GT')}</p>
                ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
            </div>

            <div class="highlight">
                <h4>💰 Información de Reembolso</h4>
                <p>Si realizó algún pago, procesaremos el reembolso según nuestras políticas de cancelación.</p>
                <p>El tiempo de procesamiento puede ser de 5 a 10 días hábiles.</p>
            </div>

            <p>Si esta cancelación fue realizada por error o tiene alguna pregunta, por favor contáctenos inmediatamente.</p>
            <p>Esperamos poder servirle en una futura oportunidad.</p>
            
            <p>Cordialmente,<br>
            <strong>Equipo Hotel Mar Azul</strong></p>
        `;

        return await this.sendEmail({
            to: guest.email,
            subject: `Cancelación de Reserva - ${reservation.reservation_code} - Hotel Mar Azul`,
            html: this.generateBaseTemplate(content, 'Cancelación de Reserva')
        });
    }

    /**
     * Envía email de bienvenida post check-in
     */
    async sendWelcomeEmail(reservation, guest, room) {
        const content = `
            <h2>¡Bienvenido a Hotel Mar Azul! 🎉</h2>
            <p>Estimado/a <strong>${guest.getFullName()}</strong>,</p>
            <p>¡Es un placer tenerle como nuestro huésped! Esperamos que disfrute de una estadía memorable.</p>
            
            <div class="reservation-details">
                <h3>🏨 Información de su Habitación</h3>
                <p><strong>Habitación:</strong> ${room.room_number} - ${room.category.toUpperCase()}</p>
                <p><strong>Piso:</strong> ${room.floor}</p>
                <p><strong>Check-out:</strong> ${new Date(reservation.check_out_date).toLocaleDateString('es-GT')} hasta las 12:00 PM</p>
            </div>

            <h3>🌟 Servicios Disponibles</h3>
            <ul>
                <li><strong>WiFi gratuito:</strong> Red "HotelMarAzul" - Contraseña: bienvenido2024</li>
                <li><strong>Restaurante:</strong> Abierto de 6:00 AM a 10:00 PM</li>
                <li><strong>Spa:</strong> Disponible con cita previa</li>
                <li><strong>Servicio a la habitación:</strong> 24 horas</li>
                <li><strong>Recepción:</strong> 24 horas para cualquier consulta</li>
            </ul>

            <div class="highlight">
                <h4>📞 Contactos Importantes</h4>
                <p><strong>Recepción:</strong> Extensión 0</p>
                <p><strong>Restaurante:</strong> Extensión 1</p>
                <p><strong>Spa:</strong> Extensión 2</p>
                <p><strong>Servicio a la habitación:</strong> Extensión 3</p>
            </div>

            <h3>🎯 Recomendaciones Locales</h3>
            <ul>
                <li><strong>Centro Histórico de Salamá:</strong> A 5 minutos caminando</li>
                <li><strong>Mercado Local:</strong> Los mejores productos artesanales</li>
                <li><strong>Mirador del Valle:</strong> Vistas espectaculares al atardecer</li>
            </ul>

            <p>Si necesita cualquier cosa durante su estadía, no dude en contactar a nuestro equipo.</p>
            <p>¡Que disfrute su estadía!</p>
            
            <p>Cordialmente,<br>
            <strong>Equipo Hotel Mar Azul</strong></p>
        `;

        return await this.sendEmail({
            to: guest.email,
            subject: `¡Bienvenido a Hotel Mar Azul! - Habitación ${room.room_number}`,
            html: this.generateBaseTemplate(content, 'Bienvenida Hotel')
        });
    }

    /**
     * Envía notificación de incidencia al personal
     */
    async sendIncidentNotification(incident, staffEmails) {
        const priorityColors = {
            low: '#28a745',
            medium: '#ffc107',
            high: '#fd7e14',
            urgent: '#dc3545'
        };

        const content = `
            <h2>Nueva Incidencia Reportada 🚨</h2>
            <p>Se ha reportado una nueva incidencia que requiere atención:</p>
            
            <div class="reservation-details">
                <h3>📋 Detalles de la Incidencia</h3>
                <p><strong>Ticket:</strong> ${incident.ticket_number}</p>
                <p><strong>Título:</strong> ${incident.title}</p>
                <p><strong>Tipo:</strong> ${incident.incident_type.toUpperCase()}</p>
                <p><strong style="color: ${priorityColors[incident.priority]};">Prioridad:</strong> <strong style="color: ${priorityColors[incident.priority]};">${incident.priority.toUpperCase()}</strong></p>
                <p><strong>Ubicación:</strong> ${incident.location || 'No especificada'}</p>
                ${incident.room_id ? `<p><strong>Habitación:</strong> Afectada</p>` : ''}
                <p><strong>Reportado:</strong> ${new Date(incident.reported_at).toLocaleString('es-GT')}</p>
            </div>

            <div class="highlight">
                <h4>📝 Descripción</h4>
                <p>${incident.description}</p>
            </div>

            ${incident.affects_guest_experience ? '<p><strong style="color: #dc3545;">⚠️ Afecta la experiencia del huésped</strong></p>' : ''}
            ${incident.affects_safety ? '<p><strong style="color: #dc3545;">⚠️ Riesgo de seguridad</strong></p>' : ''}

            <p>Por favor, revise y atienda esta incidencia lo antes posible.</p>
        `;

        return await this.sendEmail({
            to: staffEmails,
            subject: `[${incident.priority.toUpperCase()}] Nueva Incidencia ${incident.ticket_number} - Hotel Mar Azul`,
            html: this.generateBaseTemplate(content, 'Notificación Incidencia')
        });
    }

    /**
     * Envía email de reseteo de contraseña
     */
    async sendPasswordReset(user, resetToken, resetUrl) {
        const content = `
            <h2>Recuperación de Contraseña 🔐</h2>
            <p>Estimado/a <strong>${user.getFullName()}</strong>,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de su cuenta.</p>
            
            <div class="highlight">
                <h4>🔗 Enlace de Recuperación</h4>
                <p>Haga clic en el siguiente enlace para crear una nueva contraseña:</p>
                <p><a href="${resetUrl}" class="button">Restablecer Contraseña</a></p>
                <p><small>Este enlace expirará en 1 hora por seguridad.</small></p>
            </div>

            <p><strong>Si no solicitó este cambio, puede ignorar este email.</strong> Su contraseña actual permanecerá sin cambios.</p>
            
            <h3>🛡️ Consejos de Seguridad</h3>
            <ul>
                <li>Use una contraseña única y segura</li>
                <li>Incluya mayúsculas, minúsculas y números</li>
                <li>No comparta su contraseña con nadie</li>
            </ul>

            <p>Si tiene problemas o no solicitó este cambio, contáctenos inmediatamente.</p>
            
            <p>Cordialmente,<br>
            <strong>Equipo de Seguridad<br>Hotel Mar Azul</strong></p>
        `;

        return await this.sendEmail({
            to: user.email,
            subject: 'Recuperación de Contraseña - Hotel Mar Azul',
            html: this.generateBaseTemplate(content, 'Recuperación de Contraseña')
        });
    }
}

// Crear instancia única del servicio
const emailService = new EmailService();

module.exports = emailService;