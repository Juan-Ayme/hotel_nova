export type UserRole = 'recepcionista' | 'administrador';
export type RoomHousekeepingStatus = 'disponible' | 'ocupada' | 'en_limpieza' | 'mantenimiento';
export type ReservationStatus = 'pendiente_pago' | 'pago_en_verificacion' | 'confirmada' | 'cancelada' | 'finalizada';
export type PaymentMethodType = 'yape' | 'plin' | 'transferencia_bancaria' | 'tarjeta_credito_debito' | 'efectivo_recepcion';
export type PaymentTransactionStatus = 'pendiente' | 'en_verificacion' | 'aprobado' | 'rechazado' | 'reembolsado';
export type IdentityDocType = 'DNI' | 'CE' | 'PASAPORTE';
export type TaxReceiptType = 'boleta' | 'factura';
export type BookingChannel = 'web' | 'presencial' | 'telefonica';

export interface BankAccountInfo {
  bank: string;
  account_number: string;
  cci: string;
  holder: string;
  currency: string;
}

export interface HotelSettings {
  id: string;
  hotel_name: string;
  logo_url: string | null;
  welcome_message: string;
  short_description: string;
  about_us_presentation: string;
  mission: string | null;
  vision: string | null;
  service_attention_desc: string | null;
  institutional_values: string | null;
  hygiene_protocols: string | null;
  nearby_attractions: Array<{
    name: string;
    description: string;
    time_minutes: number;
    icon?: string;
  }>;
  phone_number: string;
  email: string;
  address: string;
  google_maps_embed_url: string | null;
  latitude: number | null;
  longitude: number | null;
  whatsapp_number: string | null;
  whatsapp_default_msg: string;
  attention_hours: string;
  check_in_time: string;
  check_out_time: string;
  early_checkin_late_checkout_policy: string | null;
  cancellation_policy: string;
  refund_policy: string;
  privacy_policy_text: string;
  terms_and_conditions: string;
  payment_lock_minutes: number;
  require_advance_percentage: number;
  igv_percentage: number;
  yape_holder_name: string | null;
  yape_phone_number: string | null;
  yape_qr_url: string | null;
  plin_holder_name: string | null;
  plin_phone_number: string | null;
  plin_qr_url: string | null;
  bank_accounts: BankAccountInfo[];
  updated_at: string;
}

export interface StaffProfile {
  id: string;
  auth_user_id: string | null;
  google_email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoomType {
  id: string;
  name: string;
  slug: string;
  description: string;
  max_guests: number;
  beds_count: number;
  beds_description: string;
  main_features: string;
  amenities: string[];
  base_price_pen: number;
  check_in_out_conditions: string;
  extra_policies: string | null;
  photos: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Room {
  id: string;
  room_type_id: string;
  room_number: string;
  floor: number;
  housekeeping_status: RoomHousekeepingStatus;
  notes: string | null;
  is_active: boolean;
  room_types?: RoomType;
  created_at?: string;
  updated_at?: string;
}

export interface SeasonalRate {
  id: string;
  room_type_id: string;
  name: string;
  start_date: string;
  end_date: string;
  price_per_night_pen: number;
  is_active: boolean;
}

export interface DiscountCoupon {
  id: string;
  code: string;
  description: string | null;
  discount_percentage: number | null;
  discount_fixed_pen: number | null;
  min_nights: number;
  valid_from: string;
  valid_until: string;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
}

export interface Guest {
  id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  full_name?: string;
  doc_type: IdentityDocType;
  doc_number: string;
  email: string;
  phone: string;
  ruc_number: string | null;
  company_name: string | null;
  company_address: string | null;
  accepted_terms: boolean;
  accepted_privacy_policy: boolean;
  consent_timestamp: string;
  created_at: string;
}

export interface Reservation {
  id: string;
  reservation_code: string;
  guest_id: string;
  channel: BookingChannel;
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  guests_count: number;
  rooms_requested_count: number;
  subtotal_pen: number;
  discount_pen: number;
  discount_amount_pen?: number;
  taxes_igv_pen: number;
  extra_charges_pen: number;
  total_amount_pen: number;
  required_advance_pen: number;
  coupon_id: string | null;
  receipt_type: TaxReceiptType;
  estimated_arrival_time: string | null;
  needs_parking: boolean;
  preferred_floor: number | null;
  special_requests: string | null;
  status: ReservationStatus;
  expires_at: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  confirmed_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  voucher_pdf_url: string | null;
  created_by_staff: string | null;
  created_at: string;
  updated_at: string;
  guests?: Guest;
  reservation_rooms?: ReservationRoom[];
  payments?: Payment[];
}

export interface ReservationRoom {
  id: string;
  reservation_id: string;
  room_id: string;
  room_type_id: string;
  applied_price_per_night_pen: number;
  nights_count: number;
  line_total_pen: number;
  rooms?: Room;
  room_types?: RoomType;
}

export interface Payment {
  id: string;
  reservation_id: string;
  payment_method: PaymentMethodType;
  amount_pen: number;
  currency: string;
  operation_number: string | null;
  voucher_image_url: string | null;
  origin_bank_or_wallet: string | null;
  gateway_provider: string | null;
  gateway_transaction_id: string | null;
  gateway_response_json: Record<string, unknown> | null;
  status: PaymentTransactionStatus;
  verified_by_staff: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  receipt_sent_at: string | null;
  created_at: string;
  updated_at: string;
  staff_profiles?: StaffProfile;
}

export interface GuestReview {
  id: string;
  guest_name: string;
  rating: number;
  comment: string;
  is_verified: boolean;
  is_visible: boolean;
  created_at: string;
}

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

export interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  is_corporate_inquiry: boolean;
  is_attended: boolean;
  created_at: string;
}

export interface ComplaintsBook {
  id: string;
  complaint_code: string;
  consumer_full_name: string;
  consumer_doc_type: IdentityDocType;
  consumer_doc_number: string;
  consumer_address: string;
  consumer_phone: string;
  consumer_email: string;
  is_minor: boolean;
  guardian_name: string | null;
  contracted_item_type: 'producto' | 'servicio';
  claimed_amount_pen: number | null;
  item_description: string;
  type_of_filing: 'reclamo' | 'queja';
  detail_description: string;
  consumer_request: string;
  hotel_response: string | null;
  responded_at: string | null;
  status: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  staff_id: string | null;
  staff_google_email: string | null;
  action_type: string;
  entity_table: string;
  entity_id: string;
  previous_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}
