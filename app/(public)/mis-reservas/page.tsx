'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Reservation, ReservationStatus, ReservationRoom } from '@/types/hotel.types';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDisplayDate } from '@/lib/utils/dates';
import {
  Search,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  ShieldAlert,
  BedDouble,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  DoorClosed,
  Layers,
  Sparkles,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { generateReservationPDF } from '@/lib/utils/pdf-generator';

function StatusBadge({ status }: { status: ReservationStatus }) {
  const configs: Record<
    ReservationStatus,
    { label: string; bg: string; text: string; icon: typeof CheckCircle2 }
  > = {
    pendiente_pago: {
      label: 'Pendiente de Pago',
      bg: 'bg-amber-500/15 border-amber-500/30',
      text: 'text-amber-400',
      icon: Clock,
    },
    pago_en_verificacion: {
      label: 'Pago en Verificación',
      bg: 'bg-blue-500/15 border-blue-500/30',
      text: 'text-blue-400',
      icon: Clock,
    },
    confirmada: {
      label: 'Confirmada',
      bg: 'bg-emerald-500/15 border-emerald-500/30',
      text: 'text-emerald-400',
      icon: CheckCircle2,
    },
    cancelada: {
      label: 'Cancelada',
      bg: 'bg-rose-500/15 border-rose-500/30',
      text: 'text-rose-400',
      icon: XCircle,
    },
    finalizada: {
      label: 'Finalizada',
      bg: 'bg-slate-500/15 border-slate-500/30',
      text: 'text-slate-300',
      icon: CheckCircle2,
    },
  };

  const c = configs[status] || configs.pendiente_pago;
  const Icon = c.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-md ${c.bg} ${c.text}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{c.label}</span>
    </span>
  );
}

function MisReservasContent() {
  const searchParams = useSearchParams();
  const urlCode = searchParams.get('codigo') || searchParams.get('code');
  const alerta = searchParams.get('alerta');

  const [searchInput, setSearchInput] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'activas' | 'confirmadas'>('all');

  // Función unificada para cargar reservas completas del usuario
  const loadReservations = useCallback(
    async (codeToSearch?: string | null, emailToSearch?: string | null) => {
      try {
        setIsLoading(true);
        setSearchError(null);

        const fetchedMap = new Map<string, Reservation>();

        // 1. Obtener email efectivo (del parámetro, localStorage o sesión activa)
        let effectiveEmail = emailToSearch;
        try {
          if (!effectiveEmail) {
            effectiveEmail = localStorage.getItem('novainn_guest_email');
          }
        } catch {
          // ignore
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.email) {
          effectiveEmail = user.email;
        }

        // 2. Si hay email conocido, consultar TODAS las reservas asociadas a ese cliente
        if (effectiveEmail && effectiveEmail.trim().length > 0) {
          try {
            const res = await fetch(
              `/api/guest/reservations?email=${encodeURIComponent(effectiveEmail.trim().toLowerCase())}`
            );
            const json = await res.json();
            if (json.reservations && Array.isArray(json.reservations)) {
              json.reservations.forEach((r: Reservation) => {
                fetchedMap.set(r.id, r);
              });
            }
          } catch (e) {
            console.warn('Advertencia al consultar por email:', e);
          }
        }

        // 3. Revisar códigos almacenados en localStorage (para clientes sin cuenta que han hecho varias reservas)
        let savedCodes: string[] = [];
        try {
          const raw = localStorage.getItem('novainn_saved_codes');
          if (raw) {
            savedCodes = JSON.parse(raw);
          }
          const last = localStorage.getItem('novainn_last_reservation_code');
          if (last && !savedCodes.includes(last)) {
            savedCodes.unshift(last);
          }
        } catch {
          // ignore
        }

        if (codeToSearch && !savedCodes.includes(codeToSearch.trim().toUpperCase())) {
          savedCodes.unshift(codeToSearch.trim().toUpperCase());
        }

        if (savedCodes.length > 0) {
          try {
            const res = await fetch(
              `/api/guest/reservations?codes=${encodeURIComponent(savedCodes.join(','))}`
            );
            const json = await res.json();
            if (json.reservations && Array.isArray(json.reservations)) {
              json.reservations.forEach((r: Reservation) => {
                fetchedMap.set(r.id, r);
              });
            }
          } catch (e) {
            console.warn('Advertencia al consultar por lista de códigos:', e);
          }
        }

        // 4. Si se especificó un código directo en el buscador o URL y aún no lo tenemos
        if (codeToSearch && codeToSearch.trim().length > 0) {
          const cleanCode = codeToSearch.trim().toUpperCase();
          if (!Array.from(fetchedMap.values()).some((r) => r.reservation_code === cleanCode)) {
            try {
              const res = await fetch(`/api/guest/reservations?codigo=${encodeURIComponent(cleanCode)}`);
              const json = await res.json();
              if (json.reservations && Array.isArray(json.reservations)) {
                json.reservations.forEach((r: Reservation) => {
                  fetchedMap.set(r.id, r);
                });
              }
            } catch (e) {
              console.warn('Advertencia al consultar código individual:', e);
            }
          }
        }

        const allLoaded = Array.from(fetchedMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setReservations(allLoaded);
      } catch (err) {
        console.error('Error al cargar reservas:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Cargar automáticamente al entrar con todas las reservas registradas
  useEffect(() => {
    let initialCode = urlCode;
    let initialEmail: string | null = null;

    try {
      if (!initialCode) {
        initialCode = localStorage.getItem('novainn_last_reservation_code');
      }
      initialEmail = localStorage.getItem('novainn_guest_email');
    } catch {
      // ignore
    }

    if (urlCode) {
      setSearchInput(urlCode);
    }

    loadReservations(initialCode, initialEmail);
  }, [urlCode, loadReservations]);

  // Manejador del buscador manual (por código o correo)
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setIsLoading(true);
    setSearchError(null);

    const term = searchInput.trim();

    try {
      const isEmail = term.includes('@');
      const param = isEmail
        ? `email=${encodeURIComponent(term.toLowerCase())}`
        : `codigo=${encodeURIComponent(term.toUpperCase())}`;

      const res = await fetch(`/api/guest/reservations?${param}`);
      const json = await res.json();

      if (json.reservations && json.reservations.length > 0) {
        setReservations(json.reservations);
      } else {
        setSearchError(
          isEmail
            ? `No se encontraron reservaciones registradas para el correo "${term}".`
            : `No se encontró ninguna reserva con el código "${term}". Verifica tu código.`
        );
      }
    } catch (err) {
      console.error('Error en búsqueda manual:', err);
      setSearchError('Error de conexión al consultar reserva.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrado visual de reservas
  const filteredReservations = reservations.filter((r) => {
    if (statusFilter === 'activas') {
      return r.status === 'pago_en_verificacion' || r.status === 'pendiente_pago';
    }
    if (statusFilter === 'confirmadas') {
      return r.status === 'confirmada';
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {alerta === 'acceso_restringido_personal' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
          <span>
            Tu cuenta no tiene rol de personal administrativo autorizado. Has sido redirigido a la sección de consulta de Huésped.
          </span>
        </div>
      )}

      {/* Barra de Búsqueda Rápida */}
      <div className="apple-glass-card rounded-[26px] p-4 sm:p-5 border border-white/[0.08] shadow-xl">
        <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por código (ej. NOVA-2026-XXXX) o correo electrónico..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-white/20 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="apple-button-accent w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Buscar</span>
          </button>
        </form>

        {searchError && (
          <p className="text-xs text-rose-400 mt-3 font-medium px-2">
            {searchError}
          </p>
        )}
      </div>

      {/* Encabezado y Filtros si el usuario tiene múltiples reservas */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Tus Reservas Realizadas</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono font-bold">
                {reservations.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Revisa el estado de tus habitaciones, bloqueo anti-overbooking y descarga tus vouchers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadReservations(null, null)}
              className="apple-pill-btn px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refrescar todas mis reservas"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>

        {/* Píldoras de filtro si tiene 2 o más reservas */}
        {reservations.length > 1 && (
          <div className="flex items-center gap-2 pt-1 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              Todas ({reservations.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('activas')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'activas'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              En Verificación / Pendientes ({reservations.filter((r) => r.status === 'pago_en_verificacion' || r.status === 'pendiente_pago').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('confirmadas')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'confirmadas'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              Confirmadas ({reservations.filter((r) => r.status === 'confirmada').length})
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="apple-glass-card rounded-[28px] p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
            <span>Consultando tus habitaciones y reservas en tiempo real...</span>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="apple-glass-card rounded-[28px] p-10 border border-white/[0.08] text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-slate-400 flex items-center justify-center mx-auto">
              <BedDouble className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                No hay reservas encontradas
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                Si acabas de registrar una reserva, escribe tu código de reserva o tu correo arriba para consultarla, o asegura tu próxima estadía.
              </p>
            </div>
            <Link
              href="/reservaciones"
              className="inline-flex items-center gap-2 apple-button-accent px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
            >
              <span>Nueva Reserva</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          filteredReservations.map((res) => {
            const guestFullName =
              res.guests?.full_name ||
              `${res.guests?.first_name || ''} ${res.guests?.last_name || ''}`.trim() ||
              'Huésped Titular';
            const guestDoc = res.guests?.doc_number
              ? `${res.guests?.doc_type || 'DOC'}: ${res.guests.doc_number}`
              : null;

            return (
              <div
                key={res.id}
                className="apple-glass-card rounded-[28px] p-6 sm:p-7 border border-white/[0.08] shadow-2xl space-y-5"
              >
                {/* 1. Encabezado de la Reserva */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                      Código Oficial de Reserva
                    </span>
                    <span className="font-mono text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-amber-300">
                      {res.reservation_code}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mt-1">
                      <span>
                        Titular: <strong className="text-white">{guestFullName}</strong>
                      </span>
                      {guestDoc && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          • {guestDoc}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1.5">
                    <StatusBadge status={res.status} />
                    <span className="text-[10px] text-slate-500 font-mono">
                      Registrada: {new Date(res.created_at).toLocaleDateString('es-PE')}
                    </span>
                  </div>
                </div>

                {/* 2. Banner de Protección y Bloqueo Anti-Overbooking */}
                {res.status === 'pago_en_verificacion' && (
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-3 text-xs text-blue-200">
                    <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-semibold block">
                        Habitación bloqueada y asegurada a tu nombre
                      </strong>
                      <p className="text-[11px] text-blue-300/90 leading-relaxed mt-0.5">
                        Tu comprobante de pago está en proceso de validación por recepción. La habitación permanece bloqueada para que ningún otro cliente pueda reservarla en tus fechas.
                      </p>
                    </div>
                  </div>
                )}

                {res.status === 'confirmada' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3 text-xs text-emerald-200">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-semibold block">
                        Habitación 100% garantizada y confirmada
                      </strong>
                      <p className="text-[11px] text-emerald-300/90 leading-relaxed mt-0.5">
                        Tu abono ha sido verificado con éxito. ¡Te esperamos el día de tu check-in a partir de las 14:00 hrs!
                      </p>
                    </div>
                  </div>
                )}

                {res.status === 'pendiente_pago' && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-semibold block">
                        Bloqueo temporal activo (Esperando pago)
                      </strong>
                      <p className="text-[11px] text-amber-300/90 leading-relaxed mt-0.5">
                        Tu habitación está apartada preventivamente. Completa tu abono y sube tu comprobante para asegurar tu estadía definitiva.
                      </p>
                    </div>
                  </div>
                )}

                {res.status === 'cancelada' && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-xs text-rose-200">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-semibold block">
                        Reserva cancelada
                      </strong>
                      <p className="text-[11px] text-rose-300/90 leading-relaxed mt-0.5">
                        {res.cancellation_reason || 'Esta reserva fue cancelada y la habitación fue liberada para otros clientes.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. DETALLE DE HABITACIONES RESERVADAS (Soluciona el problema de que no se veían los cuartos) */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <DoorClosed className="w-3.5 h-3.5" />
                    <span>Habitaciones Asignadas ({res.rooms_requested_count || 1}):</span>
                  </span>

                  {res.reservation_rooms && res.reservation_rooms.length > 0 ? (
                    <div className="space-y-3">
                      {res.reservation_rooms.map((rr: ReservationRoom, idx: number) => {
                        const rt = rr.room_types;
                        const rPhys = rr.rooms;
                        const photoUrl =
                          rt?.photos?.[0] ||
                          'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';

                        return (
                          <div
                            key={rr.id || idx}
                            className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/15 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md">
                                <Image
                                  src={photoUrl}
                                  alt={rt?.name || 'Habitación Hotel Nova Inn'}
                                  fill
                                  className="object-cover"
                                />
                              </div>

                              <div>
                                <h4 className="font-bold text-sm sm:text-base text-white">
                                  {rt?.name || 'Habitación Confort'}
                                </h4>

                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {rPhys?.room_number ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono font-bold text-[11px]">
                                      <DoorClosed className="w-3 h-3" />
                                      Hab. {rPhys.room_number} • Piso {rPhys.floor}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.1] text-slate-300 text-[11px]">
                                      Asignación garantizada
                                    </span>
                                  )}

                                  {rt?.max_guests && (
                                    <span className="text-[11px] text-slate-400">
                                      Hasta {rt.max_guests} {rt.max_guests === 1 ? 'persona' : 'personas'}
                                    </span>
                                  )}
                                </div>

                                {rt?.beds_description && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    {rt.beds_description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="sm:text-right shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06] flex sm:flex-col justify-between items-center sm:items-end">
                              <span className="text-[11px] text-slate-400 block">Tarifa por noche</span>
                              <span className="font-mono font-bold text-amber-300 text-sm">
                                {formatCurrency(rr.applied_price_per_night_pen || rt?.base_price_pen || 0)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Fallback elegante en caso de que no haya registro hijo
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                          <BedDouble className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-white">
                            {res.rooms_requested_count || 1} Habitación(es) Reservada(s)
                          </h4>
                          <p className="text-xs text-slate-400">
                            Equipada con baño privado, Wi-Fi 5G, agua caliente 24h y Smart TV.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        {formatCurrency(res.total_amount_pen)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 4. Datos de la Estadía */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Check-in</span>
                    <span className="font-semibold text-slate-200">
                      {formatDisplayDate(res.check_in_date)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">14:00 hrs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Check-out</span>
                    <span className="font-semibold text-slate-200">
                      {formatDisplayDate(res.check_out_date)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">12:00 hrs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Estadía & Personas</span>
                    <span className="font-semibold text-slate-200">
                      {res.total_nights} {res.total_nights === 1 ? 'noche' : 'noches'} • {res.guests_count} pers.
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Monto Total</span>
                    <span className="font-bold text-amber-300 font-mono text-sm">
                      {formatCurrency(res.total_amount_pen)}
                    </span>
                  </div>
                </div>

                {/* 5. Botones de Acción */}
                <div className="pt-2 border-t border-white/[0.06] flex flex-wrap justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => generateReservationPDF(res)}
                    className="apple-button-accent px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Voucher PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="apple-pill-btn px-4 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Imprimir</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function MisReservasPage() {
  return (
    <div className="min-h-screen pb-24">
      <section className="relative pt-24 pb-12 text-white text-center px-4 overflow-hidden">
        <h1 className="text-4xl sm:text-6xl font-black mt-1 tracking-tight">
          Mis Reservas
        </h1>
        <p className="mt-3 text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
          Consulta el estado de tus habitaciones, verifica tus bloqueos y descarga tus comprobantes oficiales en PDF.
        </p>
      </section>

      <Suspense
        fallback={
          <div className="py-20 text-center text-xs text-slate-400">
            Cargando portal de reservas...
          </div>
        }
      >
        <MisReservasContent />
      </Suspense>
    </div>
  );
}
