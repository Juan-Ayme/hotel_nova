'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { RoomType, IdentityDocType, TaxReceiptType } from '@/types/hotel.types';
import { calculateNights, formatDateOnly, formatDisplayDate } from '@/lib/utils/dates';
import { formatCurrency, calculateTaxBreakdown } from '@/lib/utils/currency';
import PaymentTimerAndUpload from './PaymentTimerAndUpload';
import {
  Calendar,
  Users,
  BedDouble,
  User,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
  ShieldCheck,
  Tag,
  ArrowRight,
  ArrowLeft,
  Download,
  Share2,
  DoorClosed,
} from 'lucide-react';
import { addDays } from 'date-fns';
import { generateReservationPDF } from '@/lib/utils/pdf-generator';

const ROOM_FLOOR_DATA: Record<string, { floor: number; rooms: string[]; maxRooms: number }> = {
  'individual-estandar': { floor: 1, rooms: ['101', '102'], maxRooms: 2 },
  'matrimonial-confort': { floor: 2, rooms: ['201', '202'], maxRooms: 2 },
  'doble-twin': { floor: 3, rooms: ['301', '302'], maxRooms: 2 },
  'familiar-superior': { floor: 4, rooms: ['401'], maxRooms: 1 },
};

const FALLBACK_ROOM_TYPES: RoomType[] = [
  {
    id: 'room-type-1',
    name: 'Habitación Individual Estándar',
    slug: 'individual-estandar',
    description: 'Ideal para viajeros de negocios o estadías breves.',
    max_guests: 1,
    beds_count: 1,
    beds_description: '1 Cama de 1.5 plazas',
    main_features: 'Escritorio, Wi-Fi 5G, Baño privado.',
    amenities: ['Wi-Fi 5G', 'Smart TV 43"', 'Agua Caliente 24h'],
    base_price_pen: 85,
    check_in_out_conditions: 'Check-in: 14:00 | Check-out: 12:00',
    extra_policies: null,
    photos: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80'],
    is_active: true,
  },
  {
    id: 'room-type-2',
    name: 'Habitación Matrimonial Confort',
    slug: 'matrimonial-confort',
    description: 'Habitación amplia pensada para parejas.',
    max_guests: 2,
    beds_count: 1,
    beds_description: '1 Cama Queen Size',
    main_features: 'Cama Queen, Smart TV 50", Frigobar.',
    amenities: ['Wi-Fi 5G', 'Smart TV 50"', 'Frigobar', 'Baño Privado'],
    base_price_pen: 120,
    check_in_out_conditions: 'Check-in: 14:00 | Check-out: 12:00',
    extra_policies: null,
    photos: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
    is_active: true,
  },
  {
    id: 'room-type-3',
    name: 'Habitación Doble Twin',
    slug: 'doble-twin',
    description: 'Espaciosa habitación con dos camas independientes.',
    max_guests: 2,
    beds_count: 2,
    beds_description: '2 Camas de 1.5 plazas',
    main_features: 'Distribución óptima para dos personas.',
    amenities: ['Wi-Fi 5G', 'Smart TV 43"', 'Baño Privado'],
    base_price_pen: 130,
    check_in_out_conditions: 'Check-in: 14:00 | Check-out: 12:00',
    extra_policies: null,
    photos: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'],
    is_active: true,
  },
  {
    id: 'room-type-4',
    name: 'Habitación Familiar Superior',
    slug: 'familiar-superior',
    description: 'La alternativa perfecta para familias.',
    max_guests: 4,
    beds_count: 3,
    beds_description: '1 Matrimonial + 2 de 1.5 plazas',
    main_features: 'Espacio amplio, frigobar y cochera gratuita.',
    amenities: ['Wi-Fi 5G', 'Smart TV 55"', 'Cochera Gratis', 'Tina'],
    base_price_pen: 190,
    check_in_out_conditions: 'Check-in: 14:00 | Check-out: 12:00',
    extra_policies: null,
    photos: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
    is_active: true,
  },
];

export default function BookingStepper() {
  const searchParams = useSearchParams();

  // Estados del Stepper (1 -> 2 -> 3 -> 4)
  const [currentStep, setCurrentStep] = useState(1);

  // Paso 1: Fechas y Habitación (con valores estables para evitar errores en prerender de Next.js 16)
  const [today, setToday] = useState('2026-11-10');
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '2026-11-10');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '2026-11-11');
  const [guestsCount, setGuestsCount] = useState(parseInt(searchParams.get('guests') || '2', 10));
  const [roomsCount, setRoomsCount] = useState(parseInt(searchParams.get('rooms') || '1', 10));
  const [roomTypes, setRoomTypes] = useState(FALLBACK_ROOM_TYPES);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    searchParams.get('roomType') || FALLBACK_ROOM_TYPES[1].id
  );

  useEffect(() => {
    const t = formatDateOnly(new Date());
    setToday(t);
    if (!searchParams.get('checkIn')) {
      setCheckIn(t);
      setCheckOut(formatDateOnly(addDays(new Date(), 1)));
    }

    async function fetchRealRoomTypes() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('room_types')
          .select('*')
          .eq('is_active', true)
          .order('base_price_pen', { ascending: true });

        if (!error && data && data.length > 0) {
          setRoomTypes(data as any);
          const q = searchParams.get('roomType') || searchParams.get('tipo');
          if (q) {
            const matched = data.find((r: any) => r.slug === q || r.id === q);
            if (matched) {
              setSelectedRoomId(matched.id);
            }
          } else {
            setSelectedRoomId((prevId) => {
              const currentFallback = FALLBACK_ROOM_TYPES.find((f) => f.id === prevId);
              if (currentFallback) {
                const realEquiv = data.find((r: any) => r.slug === currentFallback.slug);
                return realEquiv ? realEquiv.id : data[0].id;
              }
              const exists = data.some((r: any) => r.id === prevId);
              return exists ? prevId : data[0].id;
            });
          }
        }
      } catch (err) {
        console.error('Error al cargar tipos de habitación:', err);
      }
    }

    fetchRealRoomTypes();
  }, [searchParams]);

  // Paso 2: Datos del Huésped
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [docType, setDocType] = useState<IdentityDocType>('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [receiptType, setReceiptType] = useState<TaxReceiptType>('boleta');
  const [rucNumber, setRucNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [needsParking, setNeedsParking] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(true);

  // Cupón de descuento
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  // Paso 3: Reserva generada con RPC y Bloqueo
  const [reservationResult, setReservationResult] = useState<{
    reservationId: string;
    reservationCode: string;
    totalAmount: number;
    expiresAt: string;
  } | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);

  // Autocompletado de Google si el usuario está autenticado
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const metadata = data.user.user_metadata;
        if (metadata?.full_name) {
          const parts = metadata.full_name.split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
        }
        if (data.user.email) {
          setEmail(data.user.email);
        }
      }
    });
  }, []);

  const nights = calculateNights(checkIn, checkOut);
  const selectedRoom = roomTypes.find((r) => r.id === selectedRoomId) || roomTypes[0];
  const floorInfo = ROOM_FLOOR_DATA[selectedRoom?.slug || ''] || { floor: 2, rooms: ['201', '202'], maxRooms: 2 };

  // Validar y ajustar que no exceda las habitaciones reales de ese piso
  useEffect(() => {
    if (roomsCount > floorInfo.maxRooms) {
      setRoomsCount(floorInfo.maxRooms);
    }
  }, [floorInfo.maxRooms, roomsCount]);

  const totalCapacity = (selectedRoom?.max_guests || 1) * roomsCount;
  const isOverCapacity = guestsCount > totalCapacity;
  const subtotalBase = nights * (selectedRoom?.base_price_pen || 100) * roomsCount;
  const totalConDescuento = Math.max(0, subtotalBase - appliedDiscount);
  const taxBreakdown = calculateTaxBreakdown(totalConDescuento, 18);

  // Aplicar cupón de prueba
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === 'BIENVENIDO10') {
      const disc = Math.round(subtotalBase * 0.1);
      setAppliedDiscount(disc);
      setCouponMessage('¡Cupón del 10% de descuento aplicado!');
    } else {
      setCouponMessage('Cupón no válido o expirado.');
    }
  };

  // Pasar del Paso 2 al Paso 3: Crear bloqueo en Supabase RPC
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms || !acceptedPrivacy) {
      alert('Debes aceptar los Términos y Condiciones y la Política de Privacidad.');
      return;
    }

    try {
      setIsHolding(true);
      setHoldError(null);
      const supabase = createClient();

      // Intentar ejecutar la función RPC maestro
      const { data, error } = await supabase.rpc('create_reservation_with_hold', {
        p_first_name: firstName,
        p_last_name: lastName,
        p_doc_type: docType,
        p_doc_number: docNumber,
        p_email: email,
        p_phone: phone,
        p_ruc_number: receiptType === 'factura' ? rucNumber : null,
        p_company_name: receiptType === 'factura' ? companyName : null,
        p_receipt_type: receiptType,
        p_room_type_id: selectedRoom.id.length === 36 ? selectedRoom.id : null,
        p_rooms_count: roomsCount,
        p_check_in: checkIn,
        p_check_out: checkOut,
        p_guests_count: guestsCount,
        p_special_requests: specialRequests,
        p_needs_parking: needsParking,
        p_channel: 'web',
        p_coupon_code: couponCode || null,
      });

      const fallbackCode = `NOVA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      if (error) {
        console.warn('Nota: RPC error (usando fallback controlado para desarrollo local):', error);
        setReservationResult({
          reservationId: 'res-local-temp',
          reservationCode: fallbackCode,
          totalAmount: totalConDescuento,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });
      } else {
        setReservationResult({
          reservationId: data.reservation_id,
          reservationCode: data.reservation_code,
          totalAmount: data.total_amount_pen,
          expiresAt: data.expires_at,
        });
      }

      // Guardar automáticamente para consultar en Mis Reservas sin tener que volver a digitar
      try {
        const activeCode = error ? fallbackCode : (data?.reservation_code || fallbackCode);
        if (activeCode) {
          localStorage.setItem('novainn_last_reservation_code', activeCode);
          localStorage.setItem('novainn_guest_email', email);
          const raw = localStorage.getItem('novainn_saved_codes');
          const list: string[] = raw ? JSON.parse(raw) : [];
          if (!list.includes(activeCode)) {
            list.unshift(activeCode);
            localStorage.setItem('novainn_saved_codes', JSON.stringify(list));
          }
        }
      } catch {
        // ignore
      }

      setCurrentStep(3);
    } catch (err: unknown) {
      console.error('Error al reservar:', err);
      setHoldError(err instanceof Error ? err.message : 'Error inesperado al crear reserva');
    } finally {
      setIsHolding(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. Indicador de Progreso estilo Apple Segmented Bar */}
      <nav aria-label="Progreso de la reserva" className="mb-8">
        <ol className="apple-glass rounded-full p-2 border border-white/[0.08] shadow-lg flex items-center justify-between gap-1 sm:gap-2">
          {[
            { num: 1, label: 'Fechas & Habitación' },
            { num: 2, label: 'Datos del Huésped' },
            { num: 3, label: 'Pago Electrónico' },
            { num: 4, label: 'Confirmación' },
          ].map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;

            return (
              <li
                key={step.num}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 sm:px-3 rounded-full text-xs transition-all duration-200 ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                    : isCompleted
                    ? 'text-emerald-400 bg-emerald-500/10 font-medium'
                    : 'text-slate-500'
                }`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : step.num}
                </span>
                <span className="text-[11px] hidden sm:inline truncate">{step.label}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* 2. Contenido del Paso Actual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Principal: Formularios */}
        <div className="lg:col-span-2">
          {/* PASO 1: SELECCIÓN DE FECHAS Y HABITACIÓN */}
          {currentStep === 1 && (
            <div className="apple-glass rounded-[28px] p-6 sm:p-8 border border-white/[0.08] shadow-2xl space-y-6">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                  Paso 1 de 4 • Selección de Alojamiento
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                  Elige tus Fechas y Habitación
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Selecciona la fecha de check-in, check-out y el tipo de dormitorio para tu estadía.
                </p>
              </div>

              {/* Selector de Fechas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-900/85 border border-white/15 hover:border-white/30 transition-colors shadow-sm">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>Fecha de Ingreso (Check-in)</span>
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={checkIn}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      if (e.target.value >= checkOut) {
                        setCheckOut(formatDateOnly(addDays(new Date(e.target.value + 'T12:00:00'), 1)));
                      }
                    }}
                    className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none [color-scheme:dark] cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">A partir de las 14:00 hrs</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/85 border border-white/15 hover:border-white/30 transition-colors shadow-sm">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>Fecha de Salida (Check-out)</span>
                  </label>
                  <input
                    type="date"
                    min={checkIn || today}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none [color-scheme:dark] cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Hasta las 12:00 hrs</span>
                </div>
              </div>

              {/* Huéspedes y Habitaciones */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-900/85 border border-white/15 hover:border-white/30 transition-colors shadow-sm">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>Huéspedes</span>
                  </label>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(parseInt(e.target.value, 10))}
                    className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer [color-scheme:dark]"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n} className="bg-slate-900 text-white">
                        {n} {n === 1 ? 'persona' : 'personas'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/85 border border-white/15 hover:border-white/30 transition-colors shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-sky-400" />
                      <span>Habitaciones</span>
                    </label>
                    <span className="text-[10px] font-mono text-sky-400 font-semibold">
                      Piso {floorInfo.floor}
                    </span>
                  </div>
                  <select
                    value={roomsCount}
                    onChange={(e) => setRoomsCount(parseInt(e.target.value, 10))}
                    className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer [color-scheme:dark]"
                  >
                    {Array.from({ length: floorInfo.maxRooms }, (_, idx) => idx + 1).map((n) => (
                      <option key={n} value={n} className="bg-slate-900 text-white">
                        {n} {n === 1 ? 'habitación' : 'habitaciones'} ({n === 1 ? `Hab. ${floorInfo.rooms[0]}` : `Piso ${floorInfo.floor} completo`})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {floorInfo.rooms.length === 1
                      ? `Solo 1 hab. disponible en el Piso ${floorInfo.floor} (Hab. ${floorInfo.rooms[0]})`
                      : `Piso ${floorInfo.floor} • Habitaciones ${floorInfo.rooms.join(' y ')}`}
                  </span>
                </div>
              </div>

              {/* Alerta de Capacidad si los huéspedes superan el aforo de las habitaciones elegidas */}
              {isOverCapacity && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">Atención de Capacidad:</strong>
                    <p className="text-[11px] text-amber-300/90 mt-0.5 leading-relaxed">
                      Has indicado <strong>{guestsCount} personas</strong>, pero {roomsCount} {selectedRoom.name} permite un aforo máximo de <strong>{totalCapacity} huésped(es)</strong>.
                      {floorInfo.maxRooms > roomsCount
                        ? ` Puedes cambiar a ${floorInfo.maxRooms} habitaciones en este piso, o `
                        : ' '}
                      {selectedRoom.slug !== 'familiar-superior'
                        ? 'seleccionar la Habitación Familiar Superior (Piso 4, hasta 4 personas).'
                        : 'te sugerimos reservar habitaciones adicionales.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Selector de Habitación estilo Apple Product Cards */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-3">
                  Selecciona la Categoría de Habitación:
                </label>
                <div className="space-y-3">
                  {roomTypes.map((room) => {
                    const isSelected = selectedRoomId === room.id;
                    const rf = ROOM_FLOOR_DATA[room.slug] || { floor: 1, rooms: [], maxRooms: 2 };

                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/15 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/30'
                            : 'apple-glass-card hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                            <Image src={room.photos[0]} alt={room.name} fill className="object-cover" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-white">
                              {room.name}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {room.beds_description} • Hasta {room.max_guests} huéspedes
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-sky-300 font-mono text-[10px]">
                                <DoorClosed className="w-3 h-3" />
                                Piso {rf.floor} • Hab. {rf.rooms.join(', ')}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({rf.maxRooms} {rf.maxRooms === 1 ? 'hab. en este piso' : 'habs. en este piso'})
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-bold text-sky-400 font-mono block">
                            {formatCurrency(room.base_price_pen)}
                          </span>
                          <span className="text-[10px] text-slate-500">por noche</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="apple-button-accent w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Continuar a Datos del Huésped</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* PASO 2: REGISTRO DEL HUÉSPED */}
          {currentStep === 2 && (
            <form
              onSubmit={handleProceedToPayment}
              className="apple-glass rounded-[28px] p-6 sm:p-8 border border-white/[0.08] shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                    Paso 2 de 4 • Información de Contacto
                  </span>
                  <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                    Datos del Huésped y Facturación
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="apple-pill-btn px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver</span>
                </button>
              </div>

              {/* Botón de Autocompletado con Google */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-sky-400 shrink-0" />
                  <p className="text-xs text-slate-300">
                    ¿Tienes sesión iniciada? Autocompleta tu nombre y correo en 1 clic.
                  </p>
                </div>
                <Link
                  href="/login?next=/reservaciones"
                  className="apple-pill-btn px-3.5 py-1.5 rounded-xl text-slate-200 text-xs font-semibold hover:text-white transition-colors shrink-0"
                >
                  Conectar Cuenta
                </Link>
              </div>

              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej. Juan Carlos"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej. Pérez Quispe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Tipo y Número de Documento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Tipo de Documento *
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as IdentityDocType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/20 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer shadow-sm"
                  >
                    <option value="DNI">DNI (Documento Nacional de Identidad)</option>
                    <option value="CE">Carnet de Extranjería (CE)</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder={docType === 'DNI' ? '8 dígitos' : 'Número de documento'}
                    maxLength={docType === 'DNI' ? 8 : 20}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono placeholder:text-slate-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Correo y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Teléfono Móvil / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="987654321"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono placeholder:text-slate-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Selector Boleta o Factura estilo Segmented Control */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 block">
                  Tipo de Comprobante Electrónico (SUNAT)
                </span>
                <div className="p-1 rounded-xl bg-black/40 border border-white/[0.08] grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setReceiptType('boleta')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      receiptType === 'boleta'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Boleta de Venta
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptType('factura')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      receiptType === 'factura'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Factura (con RUC)
                  </button>
                </div>

                {receiptType === 'factura' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">
                        RUC (11 dígitos) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={11}
                        placeholder="20123456789"
                        value={rucNumber}
                        onChange={(e) => setRucNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">
                        Razón Social *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Empresa S.A.C."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Solicitudes especiales y cochera */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-slate-300 cursor-pointer hover:bg-white/[0.05] transition-colors">
                  <input
                    type="checkbox"
                    checked={needsParking}
                    onChange={(e) => setNeedsParking(e.target.checked)}
                    className="accent-blue-500 rounded h-4 w-4 cursor-pointer"
                  />
                  <span>Requiero espacio en la cochera privada (sujeto a disponibilidad)</span>
                </label>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Peticiones Especiales (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Hora aproximada de llegada, piso preferido o requerimientos especiales..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              {/* Checkboxes de Ley 29733 */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2 text-xs text-slate-400">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="accent-blue-500 rounded mt-0.5 h-4 w-4 shrink-0"
                  />
                  <span>
                    He leído y acepto los <strong className="text-slate-200">Términos y Condiciones</strong> del servicio de alojamiento del Hotel Nova Inn.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    className="accent-blue-500 rounded mt-0.5 h-4 w-4 shrink-0"
                  />
                  <span>
                    Doy mi consentimiento expreso para el tratamiento de mis datos personales de acuerdo a la <strong className="text-slate-200">Ley N.° 29733 (Ley de Protección de Datos Personales en el Perú)</strong>.
                  </span>
                </label>
              </div>

              {holdError && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
                  {holdError}
                </div>
              )}

              <button
                type="submit"
                disabled={isHolding}
                className="apple-button-accent w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isHolding ? (
                  <span>Bloqueando habitación y generando reserva...</span>
                ) : (
                  <>
                    <span>Continuar al Pago Electrónico</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* PASO 3: PAGO ELECTRÓNICO Y BLOQUEO DE 15 MIN */}
          {currentStep === 3 && reservationResult && (
            <div className="space-y-6">
              <PaymentTimerAndUpload
                reservationId={reservationResult.reservationId}
                reservationCode={reservationResult.reservationCode}
                totalAmount={reservationResult.totalAmount}
                expiresAt={reservationResult.expiresAt}
                onPaymentSubmitted={() => setCurrentStep(4)}
              />
            </div>
          )}

          {/* PASO 4: CONFIRMACIÓN Y VOUCHER */}
          {currentStep === 4 && reservationResult && (
            <div className="apple-glass-card rounded-[32px] p-8 sm:p-12 text-center shadow-2xl space-y-6 relative overflow-hidden">
              {/* macOS Window Controls */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="macos-dot macos-dot-red" />
                  <span className="macos-dot macos-dot-yellow" />
                  <span className="macos-dot macos-dot-green" />
                </div>
                <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                  Comprobante Oficial • Nova Inn
                </span>
                <div className="w-12" />
              </div>

              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(48,209,88,0.25)]">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  ¡Reserva Registrada Exitosamente!
                </span>
                <h2 className="text-3xl font-black text-white mt-1 tracking-tight">
                  Código de Reserva:
                </h2>
                <div className="mt-3 inline-block px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-blue-500/15 border border-amber-400/40 text-amber-300 font-mono text-2xl font-black tracking-widest shadow-inner">
                  {reservationResult.reservationCode}
                </div>
              </div>

              <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                Tu solicitud ha sido ingresada en estado <strong className="text-blue-400 font-semibold">Pago en Verificación</strong>. Nuestro equipo de recepción validará la constancia y te enviará la confirmación definitiva.
              </p>

              {/* Botones de Acción */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    generateReservationPDF({
                      id: reservationResult.reservationId,
                      reservation_code: reservationResult.reservationCode,
                      guest_id: 'guest-temp',
                      channel: 'web',
                      check_in_date: checkIn,
                      check_out_date: checkOut,
                      total_nights: nights,
                      guests_count: guestsCount,
                      rooms_requested_count: roomsCount,
                      subtotal_pen: subtotalBase,
                      discount_pen: appliedDiscount,
                      discount_amount_pen: appliedDiscount,
                      taxes_igv_pen: taxBreakdown.taxes,
                      extra_charges_pen: 0,
                      total_amount_pen: reservationResult.totalAmount,
                      required_advance_pen: reservationResult.totalAmount,
                      coupon_id: null,
                      receipt_type: receiptType,
                      estimated_arrival_time: null,
                      needs_parking: false,
                      preferred_floor: null,
                      status: 'pago_en_verificacion',
                      expires_at: reservationResult.expiresAt,
                      cancellation_reason: null,
                      cancelled_at: null,
                      confirmed_at: null,
                      checked_in_at: null,
                      checked_out_at: null,
                      voucher_pdf_url: null,
                      created_by_staff: null,
                      special_requests: specialRequests,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      guests: {
                        id: 'guest-temp',
                        auth_user_id: null,
                        first_name: firstName,
                        last_name: lastName,
                        full_name: `${firstName} ${lastName}`.trim(),
                        email: email,
                        phone: phone,
                        doc_type: docType,
                        doc_number: docNumber,
                        ruc_number: receiptType === 'factura' ? rucNumber : null,
                        company_name: receiptType === 'factura' ? companyName : null,
                        company_address: null,
                        accepted_terms: true,
                        accepted_privacy_policy: true,
                        consent_timestamp: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                      },
                    });
                  }}
                  className="apple-button-accent px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Voucher PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="apple-pill-btn px-6 py-3 rounded-2xl text-white font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>
                <Link
                  href={`/mis-reservas?codigo=${reservationResult.reservationCode}`}
                  className="px-6 py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-wider border border-amber-500/30 transition-all flex items-center gap-2"
                >
                  Ver en Mis Reservas
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Columna Lateral: Resumen Económico */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 apple-glass-card rounded-[28px] p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Resumen de tu Estadía
              </h3>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Tarifas en Soles
              </span>
            </div>

            {/* Habitación elegida */}
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/[0.08] shadow-inner">
                <Image src={selectedRoom.photos[0]} alt={selectedRoom.name} fill className="object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{selectedRoom.name}</h4>
                <p className="text-xs text-slate-400">
                  {roomsCount} {roomsCount === 1 ? 'habitación' : 'habitaciones'} • {guestsCount} pers.
                </p>
              </div>
            </div>

            {/* Detalle de Noches */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Ingreso:</span>
                <span className="font-semibold text-slate-200">{formatDisplayDate(checkIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Salida:</span>
                <span className="font-semibold text-slate-200">{formatDisplayDate(checkOut)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-white/[0.06] text-blue-400 font-bold">
                <span>Total de Noches:</span>
                <span className="font-mono">{nights} {nights === 1 ? 'noche' : 'noches'}</span>
              </div>
            </div>

            {/* Desglose de Precios en Soles */}
            <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/[0.08]">
              <div className="flex justify-between">
                <span className="text-slate-400">Tarifa por noche:</span>
                <span className="font-mono">{formatCurrency(selectedRoom.base_price_pen)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal ({nights} noches x {roomsCount} hab.):</span>
                <span className="font-mono">{formatCurrency(subtotalBase)}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Descuento aplicado:</span>
                  <span className="font-mono">- {formatCurrency(appliedDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>IGV incluido (18%):</span>
                <span className="font-mono">{formatCurrency(taxBreakdown.taxes)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/[0.08] text-base font-black">
                <span className="text-slate-200">Total a Pagar:</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-amber-200 to-amber-400 font-mono text-lg">
                  {formatCurrency(totalConDescuento)}
                </span>
              </div>
            </div>

            {/* Aplicación de Cupón */}
            <form onSubmit={handleApplyCoupon} className="pt-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                ¿Tienes un cupón de descuento?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. BIENVENIDO10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono uppercase text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <button
                  type="submit"
                  className="apple-pill-btn px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white hover:text-blue-300 transition-all cursor-pointer"
                >
                  Aplicar
                </button>
              </div>
              {couponMessage && (
                <p className="text-[11px] text-amber-300 mt-1.5 font-medium">
                  {couponMessage}
                </p>
              )}
            </form>

            <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-slate-300 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cancelación garantizada y protegida por políticas Nova Inn.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
