-- ================================================================
-- Migración Inicial - Sistema de Gestión Hotelera "Mar Azul"
-- Desarrollador: Alexander Echeverria
-- 
-- Este script inicializa la base de datos con todas las tablas,
-- índices, constraints y datos iniciales necesarios
-- ================================================================

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================================================
-- TABLA: users
-- Usuarios del sistema (staff y huéspedes)
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'guest' CHECK (role IN ('guest', 'receptionist', 'cleaning', 'manager', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    language VARCHAR(2) NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en', 'fr', 'de', 'pt')),
    avatar_url VARCHAR(255),
    
    -- Campos de auditoría de seguridad
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Campos para recuperación de contraseña
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    email_verification_token VARCHAR(255),
    
    -- Timestamps automáticos
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para tabla users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_last_login ON users(last_login_at);

-- ================================================================
-- TABLA: rooms
-- Habitaciones del hotel
-- ================================================================
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number VARCHAR(10) UNIQUE NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('standard', 'deluxe', 'suite', 'presidential')),
    floor INTEGER NOT NULL CHECK (floor >= 1 AND floor <= 50),
    capacity INTEGER NOT NULL DEFAULT 2 CHECK (capacity >= 1 AND capacity <= 10),
    beds_count INTEGER NOT NULL DEFAULT 1 CHECK (beds_count >= 1 AND beds_count <= 5),
    bed_type VARCHAR(50) NOT NULL DEFAULT 'individual' CHECK (bed_type IN ('individual', 'doble', 'queen', 'king', 'sofa_cama')),
    
    -- Estado y disponibilidad
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance', 'out_of_order')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_out_of_order BOOLEAN NOT NULL DEFAULT false,
    out_of_order_reason TEXT,
    
    -- Precios
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'GTQ',
    
    -- Características físicas
    amenities JSON DEFAULT '[]'::json,
    has_balcony BOOLEAN NOT NULL DEFAULT false,
    has_ocean_view BOOLEAN NOT NULL DEFAULT false,
    has_wifi BOOLEAN NOT NULL DEFAULT true,
    has_air_conditioning BOOLEAN NOT NULL DEFAULT true,
    has_minibar BOOLEAN NOT NULL DEFAULT false,
    has_safe BOOLEAN NOT NULL DEFAULT false,
    
    -- Información descriptiva
    description TEXT,
    images JSON DEFAULT '[]'::json,
    
    -- Mantenimiento
    last_maintenance_date TIMESTAMP WITH TIME ZONE,
    next_maintenance_date TIMESTAMP WITH TIME ZONE,
    maintenance_notes TEXT,
    
    -- Limpieza
    last_cleaning_date TIMESTAMP WITH TIME ZONE,
    cleaning_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_out_of_order_reason CHECK (
        (is_out_of_order = false) OR 
        (is_out_of_order = true AND out_of_order_reason IS NOT NULL)
    )
);

-- Índices para tabla rooms
CREATE INDEX idx_rooms_room_number ON rooms(room_number);
CREATE INDEX idx_rooms_category ON rooms(category);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_floor ON rooms(floor);
CREATE INDEX idx_rooms_is_active ON rooms(is_active);
CREATE INDEX idx_rooms_capacity ON rooms(capacity);
CREATE INDEX idx_rooms_base_price ON rooms(base_price);

-- ================================================================
-- TABLA: guests
-- Huéspedes del hotel
-- ================================================================
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Información personal básica
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternative_phone VARCHAR(20),
    
    -- Identificación
    document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('passport', 'national_id', 'driver_license', 'other')),
    document_number VARCHAR(30) NOT NULL,
    document_country VARCHAR(3) NOT NULL,
    
    -- Información demográfica
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    nationality VARCHAR(3),
    
    -- Dirección
    address TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(3),
    
    -- Preferencias
    language VARCHAR(2) NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en', 'fr', 'de', 'pt')),
    dietary_restrictions JSON DEFAULT '[]'::json,
    special_needs TEXT,
    preferences JSON DEFAULT '{}'::json,
    
    -- Marketing
    newsletter_subscription BOOLEAN NOT NULL DEFAULT false,
    marketing_emails BOOLEAN NOT NULL DEFAULT false,
    how_did_you_hear VARCHAR(100),
    
    -- Lealtad
    loyalty_number VARCHAR(20) UNIQUE,
    vip_status BOOLEAN NOT NULL DEFAULT false,
    
    -- Contacto de emergencia
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    
    -- Notas internas y estado
    internal_notes TEXT,
    is_blacklisted BOOLEAN NOT NULL DEFAULT false,
    blacklist_reason TEXT,
    
    -- Estadísticas
    last_stay_date TIMESTAMP WITH TIME ZONE,
    total_stays INTEGER NOT NULL DEFAULT 0,
    total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT uq_guest_document UNIQUE (document_number, document_country),
    CONSTRAINT check_blacklist_reason CHECK (
        (is_blacklisted = false) OR 
        (is_blacklisted = true AND blacklist_reason IS NOT NULL)
    )
);

-- Índices para tabla guests
CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_guests_document ON guests(document_number, document_country);
CREATE INDEX idx_guests_loyalty_number ON guests(loyalty_number) WHERE loyalty_number IS NOT NULL;
CREATE INDEX idx_guests_name ON guests(last_name, first_name);
CREATE INDEX idx_guests_phone ON guests(phone);
CREATE INDEX idx_guests_nationality ON guests(nationality);
CREATE INDEX idx_guests_vip_status ON guests(vip_status);
CREATE INDEX idx_guests_last_stay ON guests(last_stay_date);
CREATE INDEX idx_guests_search ON guests USING gin(to_tsvector('spanish', first_name || ' ' || last_name || ' ' || email));

-- ================================================================
-- TABLA: reservations
-- Reservas de habitaciones
-- ================================================================
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_code VARCHAR(20) UNIQUE NOT NULL,
    
    -- Relaciones
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Fechas
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    actual_check_in TIMESTAMP WITH TIME ZONE,
    actual_check_out TIMESTAMP WITH TIME ZONE,
    
    -- Huéspedes
    adults_count INTEGER NOT NULL DEFAULT 1 CHECK (adults_count >= 1 AND adults_count <= 10),
    children_count INTEGER NOT NULL DEFAULT 0 CHECK (children_count >= 0 AND children_count <= 10),
    
    -- Estado
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
    
    -- Precios
    base_price_per_night DECIMAL(10,2) NOT NULL CHECK (base_price_per_night >= 0),
    nights_count INTEGER NOT NULL CHECK (nights_count >= 1),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'GTQ',
    
    -- Pago
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'partial')),
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    payment_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Solicitudes y notas
    special_requests TEXT,
    internal_notes TEXT,
    
    -- Información de cancelación
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    
    -- Información de confirmación
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Contacto de emergencia
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    
    -- Preferencias
    preferences JSON DEFAULT '{}'::json,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_checkout_after_checkin CHECK (check_out_date > check_in_date),
    CONSTRAINT check_paid_amount_valid CHECK (paid_amount <= total_amount),
    CONSTRAINT check_cancellation_reason CHECK (
        (status != 'cancelled') OR 
        (status = 'cancelled' AND cancellation_reason IS NOT NULL)
    )
);

-- Índices para tabla reservations
CREATE INDEX idx_reservations_code ON reservations(reservation_code);
CREATE INDEX idx_reservations_guest ON reservations(guest_id);
CREATE INDEX idx_reservations_room ON reservations(room_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_payment_status ON reservations(payment_status);
CREATE INDEX idx_reservations_checkin_date ON reservations(check_in_date);
CREATE INDEX idx_reservations_checkout_date ON reservations(check_out_date);
CREATE INDEX idx_reservations_date_range ON reservations(check_in_date, check_out_date);
CREATE INDEX idx_reservations_created ON reservations(created_at);

-- ================================================================
-- TABLA: invoices
-- Facturas de hospedaje y servicios
-- ================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(20) UNIQUE NOT NULL,
    
    -- Relaciones
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Fechas
    invoice_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    service_date_from TIMESTAMP WITH TIME ZONE NOT NULL,
    service_date_to TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Estado
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    
    -- Información de facturación
    billing_name VARCHAR(200) NOT NULL,
    billing_email VARCHAR(100) NOT NULL,
    billing_phone VARCHAR(20),
    billing_address TEXT,
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(3),
    
    -- Información fiscal
    tax_id VARCHAR(50),
    tax_name VARCHAR(200),
    
    -- Montos
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'GTQ',
    
    -- Pago
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'partial')),
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    
    -- Líneas de items
    line_items JSON NOT NULL DEFAULT '[]'::json,
    
    -- Notas
    notes TEXT,
    internal_notes TEXT,
    
    -- Envío
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_to_email VARCHAR(100),
    
    -- Anulación
    voided_at TIMESTAMP WITH TIME ZONE,
    voided_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    void_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_service_period CHECK (service_date_to > service_date_from),
    CONSTRAINT check_paid_amount_invoice CHECK (paid_amount <= total_amount),
    CONSTRAINT check_void_reason CHECK (
        (voided_at IS NULL) OR 
        (voided_at IS NOT NULL AND void_reason IS NOT NULL)
    )
);

-- Índices para tabla invoices
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_reservation ON invoices(reservation_id);
CREATE INDEX idx_invoices_guest ON invoices(guest_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_billing_email ON invoices(billing_email);

-- ================================================================
-- TABLA: additional_services
-- Servicios adicionales (restaurante, spa, transporte, etc.)
-- ================================================================
CREATE TABLE IF NOT EXISTS additional_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relaciones
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    registered_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Información del servicio
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('restaurant', 'spa', 'transport', 'laundry', 'room_service', 'minibar', 'parking', 'wifi')),
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Fecha y hora
    service_date TIMESTAMP WITH TIME ZONE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER CHECK (duration_minutes > 0 AND duration_minutes <= 1440),
    
    -- Cantidad y precios
    quantity DECIMAL(8,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit VARCHAR(20) NOT NULL DEFAULT 'unidad' CHECK (unit IN ('unidad', 'hora', 'persona', 'noche', 'kg', 'litro', 'minuto')),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    
    -- Descuentos e impuestos
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    tax_percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (tax_percentage >= 0 AND tax_percentage <= 50),
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    
    -- Totales
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'GTQ',
    
    -- Estado
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    is_paid BOOLEAN NOT NULL DEFAULT false,
    is_complimentary BOOLEAN NOT NULL DEFAULT false,
    
    -- Proveedor
    department VARCHAR(50),
    provider_name VARCHAR(100),
    location VARCHAR(100),
    
    -- Notas
    special_instructions TEXT,
    guest_notes TEXT,
    staff_notes TEXT,
    
    -- Cancelación
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    
    -- Finalización
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Rating
    guest_rating INTEGER CHECK (guest_rating >= 1 AND guest_rating <= 5),
    guest_feedback TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_time_range CHECK (
        (start_time IS NULL AND end_time IS NULL) OR 
        (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
    ),
    CONSTRAINT check_service_cancellation CHECK (
        (status != 'cancelled') OR 
        (status = 'cancelled' AND cancellation_reason IS NOT NULL)
    )
);

-- Índices para tabla additional_services
CREATE INDEX idx_additional_services_reservation ON additional_services(reservation_id);
CREATE INDEX idx_additional_services_guest ON additional_services(guest_id);
CREATE INDEX idx_additional_services_room ON additional_services(room_id);
CREATE INDEX idx_additional_services_invoice ON additional_services(invoice_id);
CREATE INDEX idx_additional_services_type ON additional_services(service_type);
CREATE INDEX idx_additional_services_date ON additional_services(service_date);
CREATE INDEX idx_additional_services_status ON additional_services(status);
CREATE INDEX idx_additional_services_paid ON additional_services(is_paid);
CREATE INDEX idx_additional_services_department ON additional_services(department);

-- ================================================================
-- TABLA: incidents
-- Incidencias y mantenimiento
-- ================================================================
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    
    -- Relaciones
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    reported_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Información básica
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    incident_type VARCHAR(20) NOT NULL CHECK (incident_type IN ('maintenance', 'cleaning', 'technical', 'security', 'other')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'in_progress', 'resolved', 'cancelled')),
    
    -- Ubicación
    location VARCHAR(200),
    floor INTEGER CHECK (floor >= 0 AND floor <= 50),
    area VARCHAR(50) CHECK (area IN ('habitacion', 'lobby', 'restaurante', 'spa', 'piscina', 'gimnasio', 'parking', 'jardin', 'azotea', 'sotano', 'pasillo', 'ascensor', 'escalera', 'baño_publico', 'cocina', 'lavanderia', 'oficina', 'almacen', 'otro')),
    
    -- Impacto
    affects_guest_experience BOOLEAN NOT NULL DEFAULT false,
    affects_safety BOOLEAN NOT NULL DEFAULT false,
    affects_operations BOOLEAN NOT NULL DEFAULT false,
    
    -- Costos
    estimated_cost DECIMAL(10,2) CHECK (estimated_cost >= 0),
    actual_cost DECIMAL(10,2) CHECK (actual_cost >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'GTQ',
    
    -- Fechas
    reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    target_resolution_date TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Resolución
    resolution_description TEXT,
    materials_used JSON DEFAULT '[]'::json,
    hours_worked DECIMAL(6,2) CHECK (hours_worked >= 0),
    
    -- Proveedor externo
    external_provider VARCHAR(200),
    provider_contact VARCHAR(100),
    provider_reference VARCHAR(100),
    
    -- Archivos
    attachments JSON DEFAULT '[]'::json,
    before_photos JSON DEFAULT '[]'::json,
    after_photos JSON DEFAULT '[]'::json,
    
    -- Notas y seguimiento
    internal_notes TEXT,
    follow_up_required BOOLEAN NOT NULL DEFAULT false,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    follow_up_notes TEXT,
    
    -- Recurrencia
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    related_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    preventive_action TEXT,
    
    -- Satisfacción
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    satisfaction_feedback TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_resolution_dates CHECK (
        (resolved_at IS NULL) OR 
        (resolved_at >= reported_at)
    ),
    CONSTRAINT check_resolution_required CHECK (
        (status != 'resolved') OR 
        (status = 'resolved' AND resolution_description IS NOT NULL)
    )
);

-- Índices para tabla incidents
CREATE INDEX idx_incidents_ticket ON incidents(ticket_number);
CREATE INDEX idx_incidents_room ON incidents(room_id);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by_user_id);
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to_user_id);
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incidents_priority ON incidents(priority);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_area ON incidents(area);
CREATE INDEX idx_incidents_reported_at ON incidents(reported_at);
CREATE INDEX idx_incidents_target_date ON incidents(target_resolution_date);
CREATE INDEX idx_incidents_guest_experience ON incidents(affects_guest_experience);
CREATE INDEX idx_incidents_safety ON incidents(affects_safety);

-- ================================================================
-- TRIGGERS PARA ACTUALIZAR updated_at
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_additional_services_updated_at BEFORE UPDATE ON additional_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- DATOS INICIALES
-- ================================================================

-- Insertar usuario administrador por defecto
INSERT INTO users (first_name, last_name, email, username, password, role, is_active, is_verified) 
VALUES (
    'Administrador', 
    'Sistema',
    'admin@hotelmarazul.com',
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeshiNDZ.B9SxMuA8klnUOG6a', -- contraseña: Admin123!
    'admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Insertar usuarios de ejemplo para el staff
INSERT INTO users (first_name, last_name, email, username, password, role, is_active, is_verified) VALUES
('María', 'González', 'maria.gonzalez@hotelmarazul.com', 'maria.gonzalez', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeshiNDZ.B9SxMuA8klnUOG6a', 'manager', true, true),
('Carlos', 'Pérez', 'carlos.perez@hotelmarazul.com', 'carlos.perez', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeshiNDZ.B9SxMuA8klnUOG6a', 'receptionist', true, true),
('Ana', 'López', 'ana.lopez@hotelmarazul.com', 'ana.lopez', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeshiNDZ.B9SxMuA8klnUOG6a', 'cleaning', true, true)
ON CONFLICT (email) DO NOTHING;

-- Insertar habitaciones de ejemplo
INSERT INTO rooms (room_number, category, floor, capacity, beds_count, bed_type, base_price, description, has_ocean_view, has_balcony) VALUES
-- Primer piso - Standard
('101', 'standard', 1, 2, 1, 'doble', 250.00, 'Habitación estándar con vista al jardín', false, false),
('102', 'standard', 1, 2, 1, 'doble', 250.00, 'Habitación estándar con vista al jardín', false, false),
('103', 'standard', 1, 4, 2, 'doble', 350.00, 'Habitación familiar estándar', false, true),

-- Segundo piso - Deluxe
('201', 'deluxe', 2, 2, 1, 'queen', 400.00, 'Habitación deluxe con vista parcial al mar', true, true),
('202', 'deluxe', 2, 2, 1, 'queen', 400.00, 'Habitación deluxe con vista parcial al mar', true, true),
('203', 'deluxe', 2, 3, 1, 'king', 450.00, 'Habitación deluxe con cama king y vista al mar', true, true),

-- Tercer piso - Suites
('301', 'suite', 3, 4, 2, 'king', 650.00, 'Suite junior con sala de estar y vista al mar', true, true),
('302', 'suite', 3, 4, 2, 'king', 650.00, 'Suite junior con sala de estar y vista al mar', true, true),

-- Cuarto piso - Suite Presidencial
('401', 'presidential', 4, 6, 3, 'king', 1200.00, 'Suite presidencial con jacuzzi y terraza privada', true, true)
ON CONFLICT (room_number) DO NOTHING;

-- Actualizar amenidades para las habitaciones
UPDATE rooms SET 
    amenities = '["WiFi Gratuito", "Aire Acondicionado", "TV Cable", "Baño Privado"]'::json,
    has_wifi = true,
    has_air_conditioning = true,
    has_safe = CASE WHEN category IN ('suite', 'presidential') THEN true ELSE false END,
    has_minibar = CASE WHEN category IN ('deluxe', 'suite', 'presidential') THEN true ELSE false END
WHERE room_number IN ('101', '102', '103', '201', '202', '203', '301', '302', '401');

-- ================================================================
-- COMENTARIOS FINALES
-- ================================================================
COMMENT ON DATABASE hotel_mar_azul IS 'Base de datos del Sistema de Gestión Hotelera Mar Azul';

-- Comentarios en tablas principales
COMMENT ON TABLE users IS 'Usuarios del sistema: staff del hotel y cuentas de acceso';
COMMENT ON TABLE rooms IS 'Habitaciones del hotel con sus características y estado';
COMMENT ON TABLE guests IS 'Huéspedes registrados en el hotel';
COMMENT ON TABLE reservations IS 'Reservas de habitaciones realizadas por huéspedes';
COMMENT ON TABLE invoices IS 'Facturas generadas por estadías y servicios';
COMMENT ON TABLE additional_services IS 'Servicios adicionales consumidos por huéspedes';
COMMENT ON TABLE incidents IS 'Incidencias y reportes de mantenimiento';

-- ================================================================
-- VERIFICACIÓN FINAL
-- ================================================================
SELECT 'Migración inicial completada exitosamente. Base de datos Hotel Mar Azul lista para usar.' as status;