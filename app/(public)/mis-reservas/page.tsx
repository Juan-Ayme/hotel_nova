'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Reservation, ReservationStatus } from '@/types/hotel.types';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDisplayDate } from '@/lib/utils/dates';
import EmailAuthForm from '@/components/auth/EmailAuthForm';
import {
  Search,
  KeyRound,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { generateReservationPDF } from '@/lib/utils/pdf-generator';

function StatusBadge({ status }: { status: ReservationStatus }) {
  const configs: Record<ReservationStatus, { label: string; bg: string; text: string; icon: typeof CheckCircle2 }> = {
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
  const alerta = searchParams.get('alerta');

  const [activeTab, setActiveTab] = useState<'google' | 'codigo'>('codigo');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Formulario por Código + DNI
  const [resCode, setResCode] = useState('');
  const [docOrEmail, setDocOrEmail] = useState('');
  const [searchedReservations, setSearchedReservations] = useState<Reservation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Detectar sesión de Google o Correo y suscribirse a cambios
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email);
        setActiveTab('google');
        fetchReservationsByEmail(data.user.email);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setActiveTab('google');
        fetchReservationsByEmail(session.user.email);
      } else {
        setUserEmail(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchReservationsByEmail = async (email: string) => {
    try {
      setIsSearching(true);
      setSearchError(null);
      const res = await fetch(`/api/guest/reservations?email=${encodeURIComponent(email)}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Error al obtener reservas');
      }

      setSearchedReservations(json.reservations || []);
    } catch (err: unknown) {
      console.error('Error al consultar reservas por email:', err);
      setSearchError(err instanceof Error ? err.message : 'Error al consultar reservas');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resCode.trim() || !docOrEmail.trim()) {
      setSearchError('Por favor ingresa tu Código de Reserva y tu DNI o Correo.');
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);

      const res = await fetch('/api/guest/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationCode: resCode.trim().toUpperCase(),
          docOrEmail: docOrEmail.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSearchError(json.error || 'No se encontró ninguna reserva.');
        setSearchedReservations([]);
        return;
      }

      setSearchedReservations(json.reservations || []);
    } catch (err: unknown) {
      console.error('Error en búsqueda:', err);
      setSearchError('Ocurrió un error al consultar la base de datos.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {alerta === 'acceso_restringido_personal' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
          <span>
            Tu cuenta no tiene rol de personal administrativo autorizado. Has sido redirigido a la sección de consulta de Huésped.
          </span>
        </div>
      )}

      {/* Selector de Modalidad - iOS Segmented Control */}
      <div className="p-1 rounded-2xl bg-black/40 border border-white/[0.08] grid grid-cols-2 gap-1 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('codigo')}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'codigo'
              ? 'apple-button-accent text-white shadow-lg scale-[1.01]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Código + Documento (Doble Factor)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('google')}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'google'
              ? 'apple-button-accent text-white shadow-lg scale-[1.01]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Acceso por Correo
        </button>
      </div>

      {/* Modalidad 1: Código + DNI */}
      {activeTab === 'codigo' && (
        <div className="apple-glass-card rounded-[32px] p-6 sm:p-8 border border-white/[0.08] shadow-2xl relative overflow-hidden">
          {/* macOS window dots */}
          <div className="flex items-center gap-2 pb-4 border-b border-white/[0.06] mb-5">
            <span className="macos-dot macos-dot-red" />
            <span className="macos-dot macos-dot-yellow" />
            <span className="macos-dot macos-dot-green" />
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider ml-2">
              Búsqueda de Reserva
            </span>
          </div>

          <h2 className="text-xl font-bold text-white mb-1.5">
            Consulta con tu Código de Reserva
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Ingresa el código oficial (ej. <code className="text-blue-400 font-mono">NOVA-2026-XXXX</code>) y tu documento o correo registrado.
          </p>

          <form onSubmit={handleSearchByCode} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Código de Reserva *
              </label>
              <input
                type="text"
                required
                placeholder="NOVA-2026-XXXX"
                value={resCode}
                onChange={(e) => setResCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-mono uppercase text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                DNI o Correo Electrónico *
              </label>
              <input
                type="text"
                required
                placeholder="DNI de 8 dígitos o correo"
                value={docOrEmail}
                onChange={(e) => setDocOrEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div className="sm:col-span-2">
              {searchError && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  {searchError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="apple-button-accent w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>{isSearching ? 'Buscando reserva...' : 'Buscar Reserva'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modalidad 2: Acceso por Correo */}
      {activeTab === 'google' && (
        <div className="apple-glass-card rounded-[32px] p-6 sm:p-8 border border-white/[0.08] shadow-2xl text-center">
          {userEmail ? (
            <div className="space-y-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Sesión Activa
              </span>
              <h3 className="text-xl font-bold text-white font-mono">
                {userEmail}
              </h3>
              <p className="text-xs text-slate-400">
                Mostrando las reservas asociadas a tu correo electrónico.
              </p>
              <button
                type="button"
                onClick={() => fetchReservationsByEmail(userEmail)}
                className="apple-pill-btn px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
              >
                Actualizar Lista
              </button>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Acceso Rápido por Correo
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingresa con tu correo institucional o personal para visualizar todo tu historial de estadías.
              </p>
              <EmailAuthForm nextUrl="/mis-reservas" />
            </div>
          )}
        </div>
      )}

      {/* Resultados de Reservas Encontradas */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
          <span>Reservas Encontradas</span>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono">
            {searchedReservations.length}
          </span>
        </h3>

        {searchedReservations.length === 0 ? (
          <div className="apple-glass-card rounded-[28px] p-10 border border-white/[0.08] text-center text-slate-400 text-xs">
            No hay reservas para mostrar. Utiliza el formulario superior para consultar tu estadía.
          </div>
        ) : (
          searchedReservations.map((res) => (
            <div
              key={res.id}
              className="apple-glass-card rounded-[28px] p-6 sm:p-7 border border-white/[0.08] shadow-xl space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Código Oficial
                  </span>
                  <span className="font-mono text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-300">
                    {res.reservation_code}
                  </span>
                </div>
                <div>
                  <StatusBadge status={res.status} />
                </div>
              </div>

              {/* Datos de la estancia */}
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

              {/* Botones para descargar PDF / imprimir */}
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
      <section className="relative pt-24 pb-16 text-white text-center px-4 overflow-hidden">

        <h1 className="text-4xl sm:text-6xl font-black mt-1 tracking-tight">
          Mis Reservas
        </h1>
        <p className="mt-3 text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
          Consulta el estado de tu pago, descarga tu comprobante oficial en PDF o revisa los detalles de tu estadía.
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
