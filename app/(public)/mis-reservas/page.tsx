'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Reservation, ReservationStatus } from '@/types/hotel.types';
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
} from 'lucide-react';
import Link from 'next/link';
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

  // Función unificada para cargar reservas
  const loadReservations = useCallback(
    async (codeToSearch?: string | null, emailToSearch?: string | null) => {
      try {
        setIsLoading(true);
        setSearchError(null);

        // 1. Si hay código específico
        if (codeToSearch && codeToSearch.trim().length > 0) {
          const res = await fetch(`/api/guest/reservations?codigo=${encodeURIComponent(codeToSearch.trim().toUpperCase())}`);
          const json = await res.json();
          if (json.reservations && json.reservations.length > 0) {
            setReservations(json.reservations);
            return;
          }
        }

        // 2. Si hay email
        if (emailToSearch && emailToSearch.trim().length > 0) {
          const res = await fetch(`/api/guest/reservations?email=${encodeURIComponent(emailToSearch.trim().toLowerCase())}`);
          const json = await res.json();
          if (json.reservations && json.reservations.length > 0) {
            setReservations(json.reservations);
            return;
          }
        }

        // 3. Fallback: verificar sesión activa de Supabase
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.email) {
          const res = await fetch(`/api/guest/reservations?email=${encodeURIComponent(user.email)}`);
          const json = await res.json();
          if (json.reservations && json.reservations.length > 0) {
            setReservations(json.reservations);
            return;
          }
        }

        // 4. Fallback: revisar códigos guardados en localStorage
        try {
          const lastCode = localStorage.getItem('novainn_last_reservation_code');
          if (lastCode && lastCode !== codeToSearch) {
            const res = await fetch(`/api/guest/reservations?codigo=${encodeURIComponent(lastCode)}`);
            const json = await res.json();
            if (json.reservations && json.reservations.length > 0) {
              setReservations(json.reservations);
              return;
            }
          }
        } catch {
          // ignore
        }
      } catch (err) {
        console.error('Error al cargar reservas:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Cargar automáticamente al entrar
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

    if (initialCode) {
      setSearchInput(initialCode);
    }

    loadReservations(initialCode, initialEmail);
  }, [urlCode, loadReservations]);

  // Manejador del buscador manual
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setIsLoading(true);
    setSearchError(null);

    const term = searchInput.trim();

    try {
      // Intentar primero como código de reserva
      const res = await fetch(`/api/guest/reservations?codigo=${encodeURIComponent(term.toUpperCase())}`);
      const json = await res.json();

      if (json.reservations && json.reservations.length > 0) {
        setReservations(json.reservations);
        return;
      }

      // Si no encontró por código, intentar como email
      if (term.includes('@')) {
        const resEmail = await fetch(`/api/guest/reservations?email=${encodeURIComponent(term.toLowerCase())}`);
        const jsonEmail = await resEmail.json();
        if (jsonEmail.reservations && jsonEmail.reservations.length > 0) {
          setReservations(jsonEmail.reservations);
          return;
        }
      }

      setSearchError(`No se encontró ninguna reserva para "${term}". Verifica tu código.`);
    } catch (err) {
      console.error('Error en búsqueda manual:', err);
      setSearchError('Error de conexión al consultar reserva.');
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Barra de Búsqueda Rápida (Directa, sin opciones ni pestañas) */}
      <div className="apple-glass-card rounded-[26px] p-4 sm:p-5 border border-white/[0.08] shadow-xl">
        <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por código de reserva (ej. NOVA-2026-XXXX) o correo..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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

      {/* Lista Directa de Reservas y sus Estados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Tus Reservas</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono font-bold">
              {reservations.length}
            </span>
          </h2>

          <button
            type="button"
            onClick={() => loadReservations(searchInput, null)}
            className="apple-pill-btn px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refrescar estados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {isLoading ? (
          <div className="apple-glass-card rounded-[28px] p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
            <span>Consultando tus reservas en la base de datos...</span>
          </div>
        ) : reservations.length === 0 ? (
          <div className="apple-glass-card rounded-[28px] p-10 border border-white/[0.08] text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-slate-400 flex items-center justify-center mx-auto">
              <BedDouble className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                No hay reservas encontradas
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                Si acabas de registrar una reserva, escribe tu código arriba para ver su estado actual o explora nuestras habitaciones disponibles.
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
          reservations.map((res) => (
            <div
              key={res.id}
              className="apple-glass-card rounded-[28px] p-6 sm:p-7 border border-white/[0.08] shadow-2xl space-y-4"
            >
              {/* Encabezado: Código Oficial + Estado */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Código de Reserva
                  </span>
                  <span className="font-mono text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-300">
                    {res.reservation_code}
                  </span>
                  {res.guests?.full_name && (
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Titular: <strong className="text-slate-200">{res.guests.full_name}</strong>
                    </span>
                  )}
                </div>

                <div>
                  <StatusBadge status={res.status} />
                </div>
              </div>

              {/* Datos de la Estadía */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Check-in</span>
                  <span className="font-semibold text-slate-200">
                    {formatDisplayDate(res.check_in_date)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Check-out</span>
                  <span className="font-semibold text-slate-200">
                    {formatDisplayDate(res.check_out_date)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Huéspedes</span>
                  <span className="font-semibold text-slate-200">
                    {res.guests_count} personas ({res.total_nights} noches)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Abonado</span>
                  <span className="font-bold text-amber-300 font-mono text-sm">
                    {formatCurrency(res.total_amount_pen)}
                  </span>
                </div>
              </div>

              {/* Botones de Acción: Descargar Voucher PDF + Imprimir */}
              <div className="pt-3 border-t border-white/[0.06] flex flex-wrap justify-end gap-2.5">
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
          ))
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
          Revisa el estado de tu hospedaje y descarga tu comprobante oficial en PDF.
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
