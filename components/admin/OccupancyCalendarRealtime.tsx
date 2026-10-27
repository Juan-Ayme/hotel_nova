'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, BedDouble } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface RoomItem {
  number: string;
  type: string;
  floor: number;
}

interface OccupancyCalendarProps {
  rooms?: RoomItem[];
}

const DEFAULT_ROOMS: RoomItem[] = [
  { number: '101', type: 'Individual', floor: 1 },
  { number: '102', type: 'Individual', floor: 1 },
  { number: '201', type: 'Matrimonial', floor: 2 },
  { number: '202', type: 'Matrimonial', floor: 2 },
  { number: '301', type: 'Doble Twin', floor: 3 },
  { number: '302', type: 'Doble Twin', floor: 3 },
  { number: '401', type: 'Familiar', floor: 4 },
];

interface BookingItem {
  id: string;
  code: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  status: string;
  guestName: string;
}

export default function OccupancyCalendarRealtime({
  rooms = DEFAULT_ROOMS,
}: OccupancyCalendarProps) {
  const [activeRooms, setActiveRooms] = useState<RoomItem[]>(rooms);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [startDate, setStartDate] = useState(new Date('2026-11-10T00:00:00'));

  useEffect(() => {
    setStartDate(startOfToday());

    async function fetchData() {
      try {
        const supabase = createClient();
        
        // 1. Cargar habitaciones físicas
        const { data: roomRows, error: roomError } = await supabase
          .from('rooms')
          .select('room_number, floor, room_types(name)')
          .eq('is_active', true)
          .order('room_number', { ascending: true });

        if (!roomError && roomRows && roomRows.length > 0) {
          const loadedRooms: RoomItem[] = roomRows.map((r: any) => {
            const typeName = Array.isArray(r.room_types)
              ? r.room_types[0]?.name
              : r.room_types?.name;
            return {
              number: r.room_number,
              floor: r.floor,
              type: typeName || 'Habitación',
            };
          });
          setActiveRooms(loadedRooms);
        }

        // 2. Cargar reservas reales asignadas
        const { data: resRoomsData, error: resError } = await supabase
          .from('reservation_rooms')
          .select(`
            room_id,
            rooms!inner(room_number),
            reservations!inner(
              id,
              reservation_code,
              check_in_date,
              check_out_date,
              status,
              guests(first_name, last_name)
            )
          `)
          .in('reservations.status', ['confirmada', 'pago_en_verificacion', 'pendiente_pago']);

        if (!resError && resRoomsData) {
          const loadedBookings: BookingItem[] = resRoomsData.map((item: any) => {
            const res = item.reservations;
            const rm = item.rooms;
            const g = res?.guests;
            const guestName = g ? `${g.first_name || ''} ${g.last_name || ''}`.trim() : 'Huésped';
            return {
              id: res.id,
              code: res.reservation_code,
              roomNumber: rm?.room_number,
              checkIn: res.check_in_date,
              checkOut: res.check_out_date,
              status: res.status,
              guestName,
            };
          });
          setBookings(loadedBookings);
        }
      } catch (err) {
        console.error('Error al cargar datos reales del calendario:', err);
      }
    }

    fetchData();
  }, [rooms]);

  // Generar 14 días a partir de startDate
  const days = Array.from({ length: 14 }).map((_, i) => addDays(startDate, i));

  const handlePrev = () => setStartDate((prev) => addDays(prev, -7));
  const handleNext = () => setStartDate((prev) => addDays(prev, 7));

  return (
    <div className="apple-glass rounded-[26px] overflow-hidden border border-white/[0.08] shadow-2xl">
      {/* macOS Window Titlebar */}
      <div className="bg-slate-950/60 px-6 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="macos-dot macos-dot-red" />
            <span className="macos-dot macos-dot-yellow" />
            <span className="macos-dot macos-dot-green" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-sky-400" />
              <h3 className="text-base font-semibold text-white">
                Calendario de Ocupación Real
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Control de estadías en tiempo real sincronizado con Supabase
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/[0.06]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Confirmada
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block ml-2" /> En Verificación
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block ml-2" /> Bloqueo
          </div>

          <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] backdrop-blur-md">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-white font-mono">
              {format(startDate, 'd MMM', { locale: es })} - {format(days[13], 'd MMM', { locale: es })}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Siguiente semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla Calendario macOS */}
      <div className="overflow-x-auto p-4">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-3 text-left font-semibold text-slate-400 bg-slate-900/80 backdrop-blur-md sticky left-0 z-10 w-32 border-b border-white/[0.06] rounded-l-xl">
                Habitación
              </th>
              {days.map((day) => (
                <th
                  key={day.toISOString()}
                  className="p-2 text-center font-medium text-slate-300 border-b border-white/[0.06] min-w-[56px]"
                >
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider">
                    {format(day, 'EEE', { locale: es })}
                  </span>
                  <span className="block text-xs font-bold text-slate-200 mt-0.5">
                    {format(day, 'd')}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeRooms.map((rm) => (
              <tr key={rm.number} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="p-3 font-medium text-white bg-slate-900/80 backdrop-blur-md sticky left-0 z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-sky-400 font-mono text-xs font-bold">
                      {rm.number}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal truncate max-w-[80px]">
                      Piso {rm.floor}
                    </span>
                  </div>
                </td>
                {days.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  // Buscar reserva real que cubra este día
                  const b = bookings.find(
                    (bk) => bk.roomNumber === rm.number && dayStr >= bk.checkIn && dayStr < bk.checkOut
                  );

                  return (
                    <td key={day.toISOString()} className="p-1 text-center">
                      {b ? (
                        b.status === 'confirmada' ? (
                          <div
                            className="h-9 rounded-xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 font-semibold text-[10px] flex items-center justify-center p-1 shadow-sm cursor-pointer hover:scale-[1.02] transition-all"
                            title={`Huésped: ${b.guestName} • Confirmada (${b.code})`}
                          >
                            Ocupada
                          </div>
                        ) : b.status === 'pago_en_verificacion' ? (
                          <div
                            className="h-9 rounded-xl bg-sky-500/25 border border-sky-400/40 text-sky-200 font-semibold text-[10px] flex items-center justify-center p-1 shadow-sm cursor-pointer hover:scale-[1.02] transition-all"
                            title={`Voucher en verificación • ${b.guestName} (${b.code})`}
                          >
                            Voucher
                          </div>
                        ) : (
                          <div
                            className="h-9 rounded-xl bg-amber-500/25 border border-amber-400/40 text-amber-200 font-semibold text-[10px] flex items-center justify-center p-1 shadow-sm cursor-pointer hover:scale-[1.02] transition-all"
                            title={`Bloqueo temporal 15m • Código: ${b.code}`}
                          >
                            Bloqueo
                          </div>
                        )
                      ) : (
                        <div className="h-9 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-colors" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
