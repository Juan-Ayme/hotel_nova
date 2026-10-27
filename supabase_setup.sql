-- ============================================================================
-- HOTEL NOVA INN — SCRIPT MAESTRO DE BASE DE DATOS (SUPABASE / POSTGRESQL)
-- Incluye: Extensiones, ENUMs, 14 Tablas, Triggers Google OAuth,
-- Función RPC create_reservation_with_hold, RLS, Storage Buckets y Semillas.
-- ============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- 2. TIPOS ENUMERADOS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('recepcionista', 'administrador');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE room_housekeeping_status AS ENUM ('disponible', 'ocupada', 'en_limpieza', 'mantenimiento');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('pendiente_pago', 'pago_en_verificacion', 'confirmada', 'cancelada', 'finalizada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM ('yape', 'plin', 'transferencia_bancaria', 'tarjeta_credito_debito', 'efectivo_recepcion');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_transaction_status AS ENUM ('pendiente', 'en_verificacion', 'aprobado', 'rechazado', 'reembolsado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE identity_doc_type AS ENUM ('DNI', 'CE', 'PASAPORTE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tax_receipt_type AS ENUM ('boleta', 'factura');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE booking_channel AS ENUM ('web', 'presencial', 'telefonica');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- 3. TABLAS DEL SISTEMA
-- ============================================================================

-- 3.1. Configuración Institucional del Hotel
CREATE TABLE IF NOT EXISTS public.hotel_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_name VARCHAR(150) NOT NULL DEFAULT 'Hotel Nova Inn',
    logo_url TEXT,
    welcome_message TEXT NOT NULL DEFAULT 'Bienvenido al Hotel Nova Inn. Nos complace ofrecerte una experiencia de hospedaje cómoda y accesible, con una atención orientada a tus necesidades. Consulta nuestras habitaciones, elige tus fechas y gestiona tu reserva de manera sencilla desde nuestra plataforma digital',
    short_description TEXT NOT NULL,
    about_us_presentation TEXT NOT NULL,
    mission TEXT,
    vision TEXT,
    service_attention_desc TEXT,
    institutional_values TEXT,
    hygiene_protocols TEXT,
    nearby_attractions JSONB DEFAULT '[]'::jsonb,
    phone_number VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    google_maps_embed_url TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    whatsapp_number VARCHAR(30),
    whatsapp_default_msg TEXT DEFAULT 'Hola Hotel Nova Inn, deseo realizar una consulta sobre una reserva web',
    attention_hours TEXT NOT NULL,
    check_in_time TIME NOT NULL DEFAULT '14:00:00',
    check_out_time TIME NOT NULL DEFAULT '12:00:00',
    early_checkin_late_checkout_policy TEXT,
    cancellation_policy TEXT NOT NULL,
    refund_policy TEXT NOT NULL,
    privacy_policy_text TEXT NOT NULL,
    terms_and_conditions TEXT NOT NULL,
    payment_lock_minutes INTEGER NOT NULL DEFAULT 15,
    require_advance_percentage NUMERIC(5,2) DEFAULT 100.00,
    igv_percentage NUMERIC(5,2) DEFAULT 18.00,
    yape_holder_name VARCHAR(150),
    yape_phone_number VARCHAR(20),
    yape_qr_url TEXT,
    plin_holder_name VARCHAR(150),
    plin_phone_number VARCHAR(20),
    plin_qr_url TEXT,
    bank_accounts JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2. Whitelist de Personal (Acceso por Correo / OTP / Contraseña para /admin)
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    google_email VARCHAR(150) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'recepcionista',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3. Catálogo de Habitaciones
CREATE TABLE IF NOT EXISTS public.room_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    max_guests INTEGER NOT NULL CHECK (max_guests > 0),
    beds_count INTEGER NOT NULL CHECK (beds_count > 0),
    beds_description VARCHAR(200) NOT NULL,
    main_features TEXT NOT NULL,
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    base_price_pen NUMERIC(10, 2) NOT NULL CHECK (base_price_pen > 0),
    check_in_out_conditions TEXT NOT NULL,
    extra_policies TEXT,
    photos JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE RESTRICT,
    room_number VARCHAR(20) UNIQUE NOT NULL,
    floor INTEGER NOT NULL,
    housekeeping_status room_housekeeping_status NOT NULL DEFAULT 'disponible',
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4. Tarifas de Temporada y Cupones
CREATE TABLE IF NOT EXISTS public.seasonal_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price_per_night_pen NUMERIC(10, 2) NOT NULL CHECK (price_per_night_pen > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS public.discount_coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(40) UNIQUE NOT NULL,
    description TEXT,
    discount_percentage NUMERIC(5, 2) CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    discount_fixed_pen NUMERIC(10, 2) CHECK (discount_fixed_pen >= 0),
    min_nights INTEGER DEFAULT 1,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    max_uses INTEGER,
    current_uses INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3.5. Huéspedes
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    doc_type identity_doc_type NOT NULL DEFAULT 'DNI',
    doc_number VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    ruc_number VARCHAR(11),
    company_name VARCHAR(200),
    company_address TEXT,
    accepted_terms BOOLEAN NOT NULL DEFAULT TRUE,
    accepted_privacy_policy BOOLEAN NOT NULL DEFAULT TRUE,
    consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (doc_type, doc_number)
);

-- 3.6. Reservas y Habitaciones Asignadas
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_code VARCHAR(25) UNIQUE NOT NULL,
    guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
    channel booking_channel NOT NULL DEFAULT 'web',
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_nights INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
    guests_count INTEGER NOT NULL CHECK (guests_count > 0),
    rooms_requested_count INTEGER NOT NULL DEFAULT 1 CHECK (rooms_requested_count > 0),
    subtotal_pen NUMERIC(10, 2) NOT NULL CHECK (subtotal_pen >= 0),
    discount_pen NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    taxes_igv_pen NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    extra_charges_pen NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount_pen NUMERIC(10, 2) NOT NULL CHECK (total_amount_pen >= 0),
    required_advance_pen NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    coupon_id UUID REFERENCES public.discount_coupons(id),
    receipt_type tax_receipt_type NOT NULL DEFAULT 'boleta',
    estimated_arrival_time TIME,
    needs_parking BOOLEAN DEFAULT FALSE,
    preferred_floor INTEGER,
    special_requests TEXT,
    status reservation_status NOT NULL DEFAULT 'pendiente_pago',
    expires_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    voucher_pdf_url TEXT,
    created_by_staff UUID REFERENCES public.staff_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_stay_dates CHECK (check_out_date > check_in_date)
);

CREATE TABLE IF NOT EXISTS public.reservation_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
    room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE RESTRICT,
    applied_price_per_night_pen NUMERIC(10, 2) NOT NULL,
    nights_count INTEGER NOT NULL,
    line_total_pen NUMERIC(10, 2) NOT NULL,
    UNIQUE (reservation_id, room_id)
);

-- 3.7. Pagos
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    payment_method payment_method_type NOT NULL,
    amount_pen NUMERIC(10, 2) NOT NULL CHECK (amount_pen > 0),
    currency CHAR(3) NOT NULL DEFAULT 'PEN',
    operation_number VARCHAR(80),
    voucher_image_url TEXT,
    origin_bank_or_wallet VARCHAR(100),
    gateway_provider VARCHAR(50),
    gateway_transaction_id VARCHAR(150),
    gateway_response_json JSONB,
    status payment_transaction_status NOT NULL DEFAULT 'pendiente',
    verified_by_staff UUID REFERENCES public.staff_profiles(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    receipt_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.8. Tablas de Soporte, Libro de Reclamaciones y Auditoría
CREATE TABLE IF NOT EXISTS public.guest_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_name VARCHAR(120) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_corporate_inquiry BOOLEAN DEFAULT FALSE,
    is_attended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.complaints_book (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_code VARCHAR(30) UNIQUE NOT NULL,
    consumer_full_name VARCHAR(150) NOT NULL,
    consumer_doc_type identity_doc_type NOT NULL,
    consumer_doc_number VARCHAR(30) NOT NULL,
    consumer_address TEXT NOT NULL,
    consumer_phone VARCHAR(30) NOT NULL,
    consumer_email VARCHAR(150) NOT NULL,
    is_minor BOOLEAN DEFAULT FALSE,
    guardian_name VARCHAR(150),
    contracted_item_type VARCHAR(20) NOT NULL CHECK (contracted_item_type IN ('producto', 'servicio')),
    claimed_amount_pen NUMERIC(10, 2),
    item_description TEXT NOT NULL,
    type_of_filing VARCHAR(20) NOT NULL CHECK (type_of_filing IN ('reclamo', 'queja')),
    detail_description TEXT NOT NULL,
    consumer_request TEXT NOT NULL,
    hotel_response TEXT,
    responded_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES public.staff_profiles(id),
    staff_google_email VARCHAR(150),
    action_type VARCHAR(100) NOT NULL,
    entity_table VARCHAR(80) NOT NULL,
    entity_id UUID NOT NULL,
    previous_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. TRIGGERS Y FUNCIONES RPC
-- ============================================================================

-- Trigger al iniciar sesión con Google
CREATE OR REPLACE FUNCTION public.handle_google_auth_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    UPDATE public.staff_profiles
    SET
        auth_user_id = NEW.id,
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
        avatar_url = NEW.raw_user_meta_data->>'avatar_url',
        last_login_at = NOW(),
        updated_at = NOW()
    WHERE LOWER(TRIM(google_email)) = LOWER(TRIM(NEW.email));

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_google_auth_user_created ON auth.users;
CREATE TRIGGER on_google_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_google_auth_login();

-- Consulta de rol activo del personal
CREATE OR REPLACE FUNCTION public.get_current_staff_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT role
    FROM public.staff_profiles
    WHERE (auth_user_id = auth.uid() OR LOWER(google_email) = LOWER(auth.jwt() ->> 'email'))
      AND is_active = TRUE
    LIMIT 1;
$$;

-- Función RPC para reservar con bloqueo temporal anti-overbooking y cálculo de IGV
CREATE OR REPLACE FUNCTION public.create_reservation_with_hold(
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_doc_type identity_doc_type,
    p_doc_number VARCHAR,
    p_email VARCHAR,
    p_phone VARCHAR,
    p_ruc_number VARCHAR DEFAULT NULL,
    p_company_name VARCHAR DEFAULT NULL,
    p_receipt_type tax_receipt_type DEFAULT 'boleta',
    p_room_type_id UUID DEFAULT NULL,
    p_rooms_count INTEGER DEFAULT 1,
    p_check_in DATE DEFAULT CURRENT_DATE,
    p_check_out DATE DEFAULT CURRENT_DATE + 1,
    p_guests_count INTEGER DEFAULT 1,
    p_special_requests TEXT DEFAULT NULL,
    p_needs_parking BOOLEAN DEFAULT FALSE,
    p_channel booking_channel DEFAULT 'web',
    p_coupon_code VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_guest_id UUID;
    v_reservation_id UUID;
    v_res_code VARCHAR(25);
    v_nights INTEGER;
    v_unit_price NUMERIC(10,2);
    v_base_total NUMERIC(10,2);
    v_discount NUMERIC(10,2) := 0.00;
    v_coupon_id UUID := NULL;
    v_total_pen NUMERIC(10,2);
    v_subtotal_pen NUMERIC(10,2);
    v_igv_pen NUMERIC(10,2);
    v_lock_mins INTEGER;
    v_selected_rooms UUID[];
    v_room_id UUID;
    v_coupon RECORD;
BEGIN
    IF p_check_out <= p_check_in THEN
        RAISE EXCEPTION 'La fecha de salida debe ser posterior a la fecha de ingreso.';
    END IF;

    v_nights := p_check_out - p_check_in;

    -- 1. Bloquear habitaciones disponibles con SKIP LOCKED
    SELECT ARRAY_AGG(id) INTO v_selected_rooms
    FROM (
        SELECT rm.id
        FROM public.rooms rm
        WHERE rm.room_type_id = p_room_type_id
          AND rm.is_active = TRUE
          AND rm.housekeeping_status != 'mantenimiento'
          AND rm.id NOT IN (
              SELECT rr.room_id
              FROM public.reservation_rooms rr
              JOIN public.reservations r ON r.id = rr.reservation_id
              WHERE r.check_in_date < p_check_out
                AND r.check_out_date > p_check_in
                AND (
                    r.status IN ('confirmada', 'pago_en_verificacion')
                    OR (r.status = 'pendiente_pago' AND r.expires_at > NOW())
                )
          )
        ORDER BY rm.room_number ASC
        LIMIT p_rooms_count
        FOR UPDATE SKIP LOCKED
    ) sub;

    IF v_selected_rooms IS NULL OR ARRAY_LENGTH(v_selected_rooms, 1) < p_rooms_count THEN
        RAISE EXCEPTION 'Lo sentimos, las habitaciones seleccionadas acaban de ser ocupadas o bloqueadas por otro usuario.';
    END IF;

    -- 2. Precio base y minutos de bloqueo
    SELECT base_price_pen INTO v_unit_price FROM public.room_types WHERE id = p_room_type_id;
    SELECT COALESCE(payment_lock_minutes, 15) INTO v_lock_mins FROM public.hotel_settings LIMIT 1;
    v_base_total := v_nights * v_unit_price * p_rooms_count;

    -- 3. Cupón de descuento
    IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) != '' THEN
        SELECT * INTO v_coupon FROM public.discount_coupons
        WHERE LOWER(code) = LOWER(TRIM(p_coupon_code))
          AND is_active = TRUE
          AND valid_from <= CURRENT_DATE AND valid_until >= CURRENT_DATE
          AND (max_uses IS NULL OR current_uses < max_uses)
          AND min_nights <= v_nights
        LIMIT 1;

        IF FOUND THEN
            v_coupon_id := v_coupon.id;
            IF v_coupon.discount_percentage IS NOT NULL THEN
                v_discount := ROUND((v_base_total * v_coupon.discount_percentage / 100.0), 2);
            ELSIF v_coupon.discount_fixed_pen IS NOT NULL THEN
                v_discount := LEAST(v_base_total, v_coupon.discount_fixed_pen);
            END IF;
            UPDATE public.discount_coupons SET current_uses = current_uses + 1 WHERE id = v_coupon_id;
        END IF;
    END IF;

    v_total_pen := GREATEST(0.00, v_base_total - v_discount);

    -- Desglose oficial de IGV (18% en Perú): Total = Subtotal * 1.18
    v_subtotal_pen := ROUND(v_total_pen / 1.18, 2);
    v_igv_pen := v_total_pen - v_subtotal_pen;

    -- 4. Registrar o actualizar huésped
    INSERT INTO public.guests (
        auth_user_id, first_name, last_name, doc_type, doc_number,
        email, phone, ruc_number, company_name
    )
    VALUES (
        auth.uid(), p_first_name, p_last_name, p_doc_type, p_doc_number,
        p_email, p_phone, p_ruc_number, p_company_name
    )
    ON CONFLICT (doc_type, doc_number) DO UPDATE
    SET first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        ruc_number = COALESCE(EXCLUDED.ruc_number, public.guests.ruc_number),
        company_name = COALESCE(EXCLUDED.company_name, public.guests.company_name),
        auth_user_id = COALESCE(auth.uid(), public.guests.auth_user_id)
    RETURNING id INTO v_guest_id;

    -- 5. Código correlativo (Ej: NOVA-2026-8491)
    v_res_code := 'NOVA-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

    -- 6. Insertar Reserva
    INSERT INTO public.reservations (
        reservation_code, guest_id, channel, check_in_date, check_out_date,
        guests_count, rooms_requested_count, subtotal_pen, discount_pen,
        taxes_igv_pen, total_amount_pen, required_advance_pen, coupon_id,
        receipt_type, needs_parking, special_requests, status, expires_at
    )
    VALUES (
        v_res_code, v_guest_id, p_channel, p_check_in, p_check_out,
        p_guests_count, p_rooms_count, v_subtotal_pen, v_discount,
        v_igv_pen, v_total_pen, v_total_pen, v_coupon_id,
        p_receipt_type, p_needs_parking, p_special_requests,
        'pendiente_pago', NOW() + (v_lock_mins || ' minutes')::INTERVAL
    )
    RETURNING id INTO v_reservation_id;

    -- 7. Asignar habitaciones físicas
    FOREACH v_room_id IN ARRAY v_selected_rooms LOOP
        INSERT INTO public.reservation_rooms (
            reservation_id, room_id, room_type_id,
            applied_price_per_night_pen, nights_count, line_total_pen
        )
        VALUES (
            v_reservation_id, v_room_id, p_room_type_id,
            v_unit_price, v_nights, (v_unit_price * v_nights)
        );
    END LOOP;

    RETURN jsonb_build_object(
        'reservation_id', v_reservation_id,
        'reservation_code', v_res_code,
        'nights', v_nights,
        'subtotal_pen', v_subtotal_pen,
        'discount_pen', v_discount,
        'taxes_igv_pen', v_igv_pen,
        'total_amount_pen', v_total_pen,
        'expires_at', NOW() + (v_lock_mins || ' minutes')::INTERVAL
    );
END;
$$;

-- ============================================================================
-- 5. POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 5.1. Políticas de Lectura Pública
CREATE POLICY "Public Read Settings" ON public.hotel_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Room Types" ON public.room_types FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Rooms" ON public.rooms FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Reviews" ON public.guest_reviews FOR SELECT USING (is_visible = true);
CREATE POLICY "Public Read FAQs" ON public.faqs FOR SELECT USING (is_active = true);

-- 5.2. Inserción Pública para formularios abiertos
CREATE POLICY "Public Insert Contact" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Complaint" ON public.complaints_book FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Review" ON public.guest_reviews FOR INSERT WITH CHECK (true);

-- 5.3. Políticas para Personal (Staff)
CREATE POLICY "Staff Read Own Profile" ON public.staff_profiles FOR SELECT TO authenticated
USING (auth_user_id = auth.uid() OR LOWER(google_email) = LOWER(auth.jwt() ->> 'email'));

CREATE POLICY "Staff Full Access Settings" ON public.hotel_settings FOR ALL TO authenticated
USING (public.get_current_staff_role() = 'administrador');

CREATE POLICY "Staff Full Access Staff" ON public.staff_profiles FOR ALL TO authenticated
USING (public.get_current_staff_role() = 'administrador');

CREATE POLICY "Staff Full Access Room Types" ON public.room_types FOR ALL TO authenticated
USING (public.get_current_staff_role() IS NOT NULL);

CREATE POLICY "Staff Full Access Rooms" ON public.rooms FOR ALL TO authenticated
USING (public.get_current_staff_role() IS NOT NULL);

CREATE POLICY "Staff Full Access Reservations" ON public.reservations FOR ALL TO authenticated
USING (public.get_current_staff_role() IS NOT NULL);

CREATE POLICY "Staff Full Access ResRooms" ON public.reservation_rooms FOR ALL TO authenticated
USING (public.get_current_staff_role() IS NOT NULL);

CREATE POLICY "Staff Full Access Payments" ON public.payments FOR ALL TO authenticated
USING (public.get_current_staff_role() IS NOT NULL);

CREATE POLICY "Staff Full Access Audit Logs" ON public.audit_logs FOR ALL TO authenticated
USING (public.get_current_staff_role() IS NOT NULL);

CREATE POLICY "Staff Full Access Complaints" ON public.complaints_book FOR ALL TO authenticated
USING (public.get_current_staff_role() IS NOT NULL);

CREATE POLICY "Staff Full Access Contact Messages" ON public.contact_messages FOR ALL TO authenticated
USING (public.get_current_staff_role() IS NOT NULL);

-- 5.4. Políticas para Huéspedes
CREATE POLICY "Guest Read Own Profile" ON public.guests FOR SELECT TO authenticated
USING (auth_user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt() ->> 'email'));

CREATE POLICY "Guest Read Own Reservations" ON public.reservations FOR SELECT TO authenticated
USING (guest_id IN (SELECT id FROM public.guests WHERE auth_user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt() ->> 'email')));

CREATE POLICY "Guest Read Own Reservation Rooms" ON public.reservation_rooms FOR SELECT TO authenticated
USING (reservation_id IN (
    SELECT id FROM public.reservations WHERE guest_id IN (
        SELECT id FROM public.guests WHERE auth_user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt() ->> 'email')
    )
));

CREATE POLICY "Guest Read Own Payments" ON public.payments FOR SELECT TO authenticated
USING (reservation_id IN (
    SELECT id FROM public.reservations WHERE guest_id IN (
        SELECT id FROM public.guests WHERE auth_user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt() ->> 'email')
    )
));

-- ============================================================================
-- 6. BUCKETS DE STORAGE Y POLÍTICAS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('hotel-media', 'hotel-media', true, 10485760, ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/svg+xml']),
    ('payment-vouchers', 'payment-vouchers', false, 15728640, ARRAY['image/webp', 'image/png', 'image/jpeg', 'application/pdf']),
    ('reservation-documents', 'reservation-documents', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow Public Voucher Upload" ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'payment-vouchers');

CREATE POLICY "Allow Staff Voucher Read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-vouchers' AND public.get_current_staff_role() IS NOT NULL);

CREATE POLICY "Public Read Hotel Media" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'hotel-media');

-- ============================================================================
-- 7. DATOS SEMILLA (SEED DATA)
-- ============================================================================

-- Configuración Institucional
INSERT INTO public.hotel_settings (
    hotel_name, short_description, about_us_presentation,
    phone_number, email, address, attention_hours,
    cancellation_policy, refund_policy, privacy_policy_text, terms_and_conditions,
    yape_holder_name, yape_phone_number, plin_holder_name, plin_phone_number,
    bank_accounts
) VALUES (
    'Hotel Nova Inn',
    'Experiencia de hospedaje cómoda, moderna y accesible con atención personalizada en cada detalle.',
    'Hotel Nova Inn nace con el compromiso de brindar hospitalidad de primer nivel para turistas y ejecutivos. Nuestras instalaciones combinan confort moderno, ubicación estratégica y calidez en el servicio.',
    '+51 987 654 321', 'contacto@hotelnovainn.com', 'Av. Principal 123, Perú', 'Atención las 24 horas',
    'Cancelación gratuita hasta 48 horas antes de la fecha de check-in. Cancelaciones posteriores incurren en una penalidad equivalente a la primera noche.',
    'Los reembolsos por cancelaciones oportunas se procesarán en un plazo máximo de 5 a 7 días hábiles a través del mismo canal utilizado para el pago.',
    'En cumplimiento de la Ley N.° 29733 (Ley de Protección de Datos Personales), Hotel Nova Inn garantiza que su información personal será tratada con estricta confidencialidad exclusivamente para la gestión de su reserva y estadía.',
    'El check-in oficial inicia a las 14:00 horas y el check-out es hasta las 12:00 horas. Todo huésped debe identificarse al ingresar con su documento de identidad vigente.',
    'Hotel Nova Inn S.A.C.', '987654321', 'Hotel Nova Inn S.A.C.', '987654321',
    '[
        {"bank": "BCP (Banco de Crédito del Perú)", "account_number": "191-98765432-0-89", "cci": "002-191-0098765432089-54", "holder": "Hotel Nova Inn S.A.C.", "currency": "PEN"},
        {"bank": "BBVA Continental", "account_number": "0011-0123-0200456789", "cci": "011-123-000200456789-21", "holder": "Hotel Nova Inn S.A.C.", "currency": "PEN"}
    ]'::jsonb
) ON CONFLICT DO NOTHING;

-- Tipos de Habitación Iniciales
INSERT INTO public.room_types (name, slug, description, max_guests, beds_count, beds_description, main_features, amenities, base_price_pen, check_in_out_conditions, photos)
VALUES
(
    'Habitación Individual Estándar',
    'individual-estandar',
    'Ideal para viajeros de negocios o estadías breves. Diseñada con un estilo moderno y funcional para el máximo descanso.',
    1, 1, '1 Cama de 1.5 plazas con colchón ortopédico',
    'Escritorio ergonómico de trabajo, iluminación cálida regulable, closet amplio y baño privado.',
    '["Wi-Fi 5G de alta velocidad", "Smart TV 43 con Netflix y streaming", "Baño privado con ducha española y agua caliente 24h", "Escritorio de trabajo", "Ventilador / Calefactor"]'::jsonb,
    85.00,
    'Check-in: 14:00 hrs | Check-out: 12:00 hrs. No se admiten mascotas en esta categoría.',
    '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80"]'::jsonb
),
(
    'Habitación Matrimonial Confort',
    'matrimonial-confort',
    'Habitación amplia pensada para parejas que buscan comodidad, privacidad y descanso placentero.',
    2, 1, '1 Cama Queen Size con sábanas de 300 hilos',
    'Ambiente romántico y acogedor, frigobar surtido, Smart TV con cable satelital y baño privado con finos acabados.',
    '["Wi-Fi 5G", "Smart TV 50", "Baño privado con agua caliente 24h", "Frigobar", "Secadora de cabello", "Vista exterior"]'::jsonb,
    120.00,
    'Check-in: 14:00 hrs | Check-out: 12:00 hrs. Early check-in sujeto a disponibilidad.',
    '["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"]'::jsonb
),
(
    'Habitación Doble Twin',
    'doble-twin',
    'Espaciosa habitación con dos camas independientes, perfecta para colegas de trabajo, amigos o familiares.',
    2, 2, '2 Camas de 1.5 plazas separadas',
    'Distribución óptima para dos personas, closets independientes y escritorio compartido.',
    '["Wi-Fi 5G", "Smart TV 43", "Baño privado con agua caliente 24h", "Caja fuerte digital", "Artículos de aseo gratuitos"]'::jsonb,
    130.00,
    'Check-in: 14:00 hrs | Check-out: 12:00 hrs.',
    '["https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80"]'::jsonb
),
(
    'Habitación Familiar Superior',
    'familiar-superior',
    'La alternativa perfecta para familias. Gran amplitud, comodidades integradas y ambiente seguro para niños.',
    4, 3, '1 Cama Matrimonial de 2 plazas + 2 Camas de 1.5 plazas',
    'Espacio amplio con sala de estar pequeña, mesa de centro, frigobar y ventanales con iluminación natural.',
    '["Wi-Fi 5G", "Smart TV 55", "Baño privado amplio con tina y agua caliente", "Frigobar", "Mesa de té", "Cochera gratuita incluida"]'::jsonb,
    190.00,
    'Check-in: 14:00 hrs | Check-out: 12:00 hrs. Cochera sujeta a registro previo.',
    '["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Habitaciones Físicas
DO $$
DECLARE
    v_ind_id UUID;
    v_mat_id UUID;
    v_twin_id UUID;
    v_fam_id UUID;
BEGIN
    SELECT id INTO v_ind_id FROM public.room_types WHERE slug = 'individual-estandar';
    SELECT id INTO v_mat_id FROM public.room_types WHERE slug = 'matrimonial-confort';
    SELECT id INTO v_twin_id FROM public.room_types WHERE slug = 'doble-twin';
    SELECT id INTO v_fam_id FROM public.room_types WHERE slug = 'familiar-superior';

    IF v_ind_id IS NOT NULL THEN
        INSERT INTO public.rooms (room_type_id, room_number, floor, housekeeping_status)
        VALUES (v_ind_id, '101', 1, 'disponible'), (v_ind_id, '102', 1, 'disponible')
        ON CONFLICT (room_number) DO NOTHING;
    END IF;

    IF v_mat_id IS NOT NULL THEN
        INSERT INTO public.rooms (room_type_id, room_number, floor, housekeeping_status)
        VALUES (v_mat_id, '201', 2, 'disponible'), (v_mat_id, '202', 2, 'disponible')
        ON CONFLICT (room_number) DO NOTHING;
    END IF;

    IF v_twin_id IS NOT NULL THEN
        INSERT INTO public.rooms (room_type_id, room_number, floor, housekeeping_status)
        VALUES (v_twin_id, '301', 3, 'disponible'), (v_twin_id, '302', 3, 'disponible')
        ON CONFLICT (room_number) DO NOTHING;
    END IF;

    IF v_fam_id IS NOT NULL THEN
        INSERT INTO public.rooms (room_type_id, room_number, floor, housekeeping_status)
        VALUES (v_fam_id, '401', 4, 'disponible')
        ON CONFLICT (room_number) DO NOTHING;
    END IF;
END $$;

-- Cupones de Ejemplo
INSERT INTO public.discount_coupons (code, description, discount_percentage, min_nights, valid_from, valid_until, max_uses)
VALUES
('BIENVENIDO10', 'Descuento del 10% por inauguración de plataforma web', 10.00, 1, CURRENT_DATE - 1, CURRENT_DATE + 365, 500),
('ESTADIALARGA', 'Descuento especial del 15% para reservas de 3 noches a más', 15.00, 3, CURRENT_DATE - 1, CURRENT_DATE + 365, 200)
ON CONFLICT (code) DO NOTHING;

-- Preguntas Frecuentes Iniciales
INSERT INTO public.faqs (category, question, answer, display_order)
VALUES
('Reservas', '¿Cuáles son los horarios de Check-in y Check-out?', 'El horario de ingreso (Check-in) es a partir de las 14:00 horas. El horario de salida (Check-out) es hasta las 12:00 horas del mediodía.', 1),
('Pagos', '¿Qué medios de pago aceptan para confirmar mi reserva?', 'Aceptamos transferencias por Yape y Plin, transferencias bancarias directas (BCP y BBVA) y pagos con tarjeta de crédito/débito.', 2),
('Servicios', '¿El hotel cuenta con estacionamiento privado?', 'Sí, contamos con cochera privada sujeta a disponibilidad previa. Puedes solicitarla al completar el formulario de tu reserva.', 3),
('Políticas', '¿Puedo cancelar o reprogramar mi reserva?', 'Las reservas pueden cancelarse o reprogramarse de forma gratuita hasta 48 horas antes de la fecha de ingreso.', 4)
ON CONFLICT DO NOTHING;
