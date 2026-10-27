import { HotelSettings } from '@/types/hotel.types';

export const DEFAULT_HOTEL_INFO: HotelSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  hotel_name: 'Hotel Nova Inn',
  logo_url: null,
  welcome_message:
    'Bienvenido al Hotel Nova Inn. Nos complace ofrecerte una experiencia de hospedaje cómoda y accesible, con una atención orientada a tus necesidades. Consulta nuestras habitaciones, elige tus fechas y gestiona tu reserva de manera sencilla desde nuestra plataforma digital.',
  short_description:
    'Tu mejor experiencia de descanso y hospitalidad en una ubicación céntrica y segura. Habitaciones modernas, Wi-Fi de alta velocidad y atención las 24 horas.',
  about_us_presentation:
    'Hotel Nova Inn nace con el compromiso de brindar hospitalidad de primer nivel tanto para turistas como para viajeros corporativos. Nuestras instalaciones combinan confort moderno, rigurosos estándares de higiene y un equipo cálido y atento a cada una de tus necesidades.',
  mission:
    'Proporcionar un servicio de alojamiento de excelencia, garantizando descanso, seguridad y una experiencia inolvidable a tarifas accesibles.',
  vision:
    'Ser reconocidos como el hotel preferido de la región por nuestra hospitalidad personalizada, innovación digital y estándares de calidad.',
  service_attention_desc:
    'Recepción disponible las 24 horas del día, servicio de custodia de equipaje, asistencia turística personalizada y conectividad garantizada en todas las instalaciones.',
  institutional_values:
    'Calidez humana, honestidad, compromiso con la limpieza y bioseguridad, puntualidad y vocación de servicio.',
  hygiene_protocols:
    'Desinfección diaria con insumos certificados, cambio esterilizado de sábanas y toallas en cada estadía, ventilación continua de dormitorios y limpieza exhaustiva en áreas comunes.',
  nearby_attractions: [
    {
      name: 'Plaza de Armas / Centro Histórico',
      description: 'Arquitectura colonial, cafeterías tradicionales y templos históricos.',
      time_minutes: 8,
      icon: 'Landmark',
    },
    {
      name: 'Terminal Terrestre Central',
      description: 'Fácil acceso para conexiones interprovinciales directas.',
      time_minutes: 12,
      icon: 'Bus',
    },
    {
      name: 'Centro Comercial y Financiero',
      description: 'Bancos, farmacias, tiendas por departamento y restaurantes.',
      time_minutes: 5,
      icon: 'ShoppingBag',
    },
    {
      name: 'Aeropuerto Principal',
      description: 'Traslados ágiles y seguros para pasajeros en tránsito.',
      time_minutes: 25,
      icon: 'Plane',
    },
  ],
  phone_number: '+51 987 654 321',
  email: 'contacto@hotelnovainn.com',
  address: 'Av. Principal 123, Perú',
  google_maps_embed_url:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15606.331252119332!2d-77.03687!3d-12.04637!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDAyJzQ3LjAiUyA3N8KwMDInMTIuNyJX!5e0!3m2!1ses!2spe!4v1600000000000',
  latitude: -12.04637,
  longitude: -77.03687,
  whatsapp_number: '51987654321',
  whatsapp_default_msg: 'Hola Hotel Nova Inn, deseo realizar una consulta sobre una reserva web',
  attention_hours: 'Atención ininterrumpida las 24 horas, los 365 días del año',
  check_in_time: '14:00:00',
  check_out_time: '12:00:00',
  early_checkin_late_checkout_policy:
    'Early Check-in y Late Check-out sujetos a disponibilidad de habitaciones. Se puede coordinar directamente con recepción.',
  cancellation_policy:
    'Cancelación 100% gratuita hasta 48 horas antes de la fecha de ingreso. Cancelaciones con menos de 48 horas incurren en el cobro de la primera noche de penalidad.',
  refund_policy:
    'Los reembolsos por cancelaciones oportunas se realizan en un plazo de 5 a 7 días hábiles a través del mismo medio de pago utilizado por el cliente.',
  privacy_policy_text:
    'Conforme a la Ley N.° 29733 (Ley de Protección de Datos Personales en el Perú), Hotel Nova Inn se compromete a salvaguardar la privacidad de sus clientes. Sus datos personales no serán comercializados ni transferidos a terceros no vinculados.',
  terms_and_conditions:
    'Todo huésped mayor de edad debe identificarse obligatoriamente con DNI, Carnet de Extranjería o Pasaporte vigente al ingresar. El hotel se reserva el derecho de admisión de acuerdo a ley.',
  payment_lock_minutes: 15,
  require_advance_percentage: 100,
  igv_percentage: 18,
  yape_holder_name: 'Hotel Nova Inn S.A.C.',
  yape_phone_number: '987654321',
  yape_qr_url: null,
  plin_holder_name: 'Hotel Nova Inn S.A.C.',
  plin_phone_number: '987654321',
  plin_qr_url: null,
  bank_accounts: [
    {
      bank: 'Banco de Crédito del Perú (BCP)',
      account_number: '191-98765432-0-89',
      cci: '002-191-0098765432089-54',
      holder: 'Hotel Nova Inn S.A.C.',
      currency: 'PEN',
    },
    {
      bank: 'BBVA Perú',
      account_number: '0011-0123-0200456789',
      cci: '011-123-000200456789-21',
      holder: 'Hotel Nova Inn S.A.C.',
      currency: 'PEN',
    },
  ],
  updated_at: '2026-10-25T00:00:00.000Z',
};

export const HOTEL_INFO = {
  name: DEFAULT_HOTEL_INFO.hotel_name,
  ruc: '20609876541',
  address: DEFAULT_HOTEL_INFO.address,
  phone: DEFAULT_HOTEL_INFO.phone_number,
  whatsapp: DEFAULT_HOTEL_INFO.whatsapp_number,
  email: DEFAULT_HOTEL_INFO.email,
  checkInTime: '14:00',
  checkOutTime: '12:00',
};

