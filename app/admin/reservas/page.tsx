'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDisplayDate } from '@/lib/utils/dates';
import { createClient } from '@/lib/supabase/client';
import {
  CalendarDays,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  LogIn,
  LogOut,
  User,
  Phone,
  FileText,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { ReservationStatus, BookingChannel } from '@/types/hotel.types';

interface RealReservation {
  id: string;
  code: string;
  guestName: string;
  doc: string;
  phone: string;
  channel: BookingChannel;
  room: string;
  checkIn: string;
  checkOut: string;
  total: number;
  status: ReservationStatus;
}

export default function AdminReservasPage() {
  const [reservations, setReservations] = useState<RealReservation[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          reservation_code,
          channel,
          check_in_date,
          check_out_date,
          total_amount_pen,
          status,
          guests(first_name, last_name, doc_type, doc_number, phone),
          reservation_rooms(rooms(room_number), room_types(name))
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const loaded: RealReservation[] = data.map((r: any) => {
          const g = r.guests;
          const rr = Array.isArray(r.reservation_rooms) ? r.reservation_rooms[0] : r.reservation_rooms;
          const roomNum = rr?.rooms?.room_number || 'N/A';
          const typeName = rr?.room_types?.name || '';
          return {
            id: r.id,
            code: r.reservation_code,
            guestName: g ? `${g.first_name || ''} ${g.last_name || ''}`.trim() : 'Huésped',
            doc: g ? `${g.doc_type || 'DOC'}: ${g.doc_number || ''}` : '',
            phone: g?.phone || '',
            channel: r.channel,
            room: `Hab. ${roomNum}${typeName ? ` (${typeName})` : ''}`,
            checkIn: r.check_in_date,
            checkOut: r.check_out_date,
            total: parseFloat(r.total_amount_pen) || 0,
            status: r.status,
          };
        });
        setReservations(loaded);
      }
    } catch (err) {
      console.error('Error al cargar reservas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCheckIn = async (id: string) => {
    try {
      const supabase = createClient();
      await supabase
        .from('reservations')
        .update({ checked_in_at: new Date().toISOString(), status: 'confirmada' })
        .eq('id', id);

      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'confirmada' as ReservationStatus } : r))
      );
    } catch (err) {
      console.error('Error al registrar check-in:', err);
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      const supabase = createClient();
      await supabase
        .from('reservations')
        .update({ checked_out_at: new Date().toISOString(), status: 'finalizada' })
        .eq('id', id);

      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'finalizada' as ReservationStatus } : r))
      );
    } catch (err) {
      console.error('Error al registrar check-out:', err);
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Ingrese el motivo de la anulación:');
    if (!reason) return;

    try {
      const supabase = createClient();
      await supabase
        .from('reservations')
        .update({ status: 'cancelada', cancellation_reason: reason, cancelled_at: new Date().toISOString() })
        .eq('id', id);

      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'cancelada' as ReservationStatus } : r))
      );
    } catch (err) {
      console.error('Error al anular reserva:', err);
    }
  };

  const filtered = reservations.filter((r) => {
    if (filterStatus !== 'todas' && r.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.code.toLowerCase().includes(q) ||
        r.guestName.toLowerCase().includes(q) ||
        r.doc.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header estilo macOS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-sky-400" />
            <span className="text-[11px] font-semibold tracking-wider text-sky-400 uppercase">
              Control de Ocupación y Huéspedes
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Gestión de Reservaciones
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Administra las reservas originadas por la web, presenciales (*Walk-in*) y telefónicas.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReservations}
          disabled={loading}
          className="apple-pill-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-slate-300 hover:text-white font-medium text-xs active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Barra de Filtros y Buscador estilo macOS Spotlight */}
      <div className="apple-glass rounded-2xl p-3 sm:p-4 border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código, huésped o documento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
          />
        </div>

        {/* Segmented Control iOS para filtrar estado */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 rounded-xl bg-black/30 border border-white/[0.06]">
          {['todas', 'confirmada', 'pago_en_verificacion', 'pendiente_pago', 'finalizada'].map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all shrink-0 cursor-pointer ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Tabla de Reservas estilo macOS Window */}
      <div className="apple-glass rounded-[26px] border border-white/[0.08] shadow-2xl overflow-hidden">
        {/* Titlebar macOS */}
        <div className="bg-slate-950/60 px-6 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="macos-dot macos-dot-red" />
            <span className="macos-dot macos-dot-yellow" />
            <span className="macos-dot macos-dot-green" />
            <span className="text-xs font-semibold text-slate-300 ml-2">Directorio de Reservas</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {filtered.length} reservaciones encontradas
          </span>
        </div>

        <div className="overflow-x-auto p-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400">
                <th className="p-3 font-semibold">Código</th>
                <th className="p-3 font-semibold">Huésped</th>
                <th className="p-3 font-semibold">Canal</th>
                <th className="p-3 font-semibold">Habitación</th>
                <th className="p-3 font-semibold">Estadía</th>
                <th className="p-3 font-semibold">Importe</th>
                <th className="p-3 font-semibold">Estado</th>
                <th className="p-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((res) => (
                <tr key={res.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="p-3 font-mono font-bold text-sky-400">{res.code}</td>
                  <td className="p-3">
                    <p className="font-semibold text-white">{res.guestName}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{res.doc}</p>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        res.channel === 'web'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                          : res.channel === 'presencial'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                          : 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
                      }`}
                    >
                      {res.channel}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-200">{res.room}</td>
                  <td className="p-3 text-slate-300 font-mono text-[11px]">
                    <p>{res.checkIn}</p>
                    <p className="text-slate-500">hasta {res.checkOut}</p>
                  </td>
                  <td className="p-3 font-mono font-bold text-sky-400">{formatCurrency(res.total)}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize ${
                        res.status === 'confirmada'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                          : res.status === 'pago_en_verificacion'
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/25'
                          : res.status === 'pendiente_pago'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                          : res.status === 'finalizada'
                          ? 'bg-slate-500/15 text-slate-400 border border-slate-500/25'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                      }`}
                    >
                      {res.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                    {res.status === 'confirmada' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCheckIn(res.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-[10px] uppercase transition-colors cursor-pointer"
                          title="Registrar ingreso del huésped"
                        >
                          Check-in
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCheckOut(res.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold text-[10px] uppercase transition-colors cursor-pointer"
                          title="Registrar salida y mandar habitación a limpieza"
                        >
                          Check-out
                        </button>
                      </>
                    )}
                    {res.status !== 'cancelada' && res.status !== 'finalizada' && (
                      <button
                        type="button"
                        onClick={() => handleCancel(res.id)}
                        className="px-2 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 text-[10px] font-semibold uppercase transition-colors cursor-pointer"
                      >
                        Anular
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
