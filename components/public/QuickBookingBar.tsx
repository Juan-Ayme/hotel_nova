'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, BedDouble, Search } from 'lucide-react';
import { formatDateOnly } from '@/lib/utils/dates';
import { addDays } from 'date-fns';

export default function QuickBookingBar() {
  const router = useRouter();

  const [today, setToday] = useState('2026-11-10');
  const [checkIn, setCheckIn] = useState('2026-11-10');
  const [checkOut, setCheckOut] = useState('2026-11-11');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);

  useEffect(() => {
    const t = formatDateOnly(new Date());
    setToday(t);
    setCheckIn(t);
    setCheckOut(formatDateOnly(addDays(new Date(), 1)));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams({
      checkIn,
      checkOut,
      guests: guests.toString(),
      rooms: rooms.toString(),
    });
    router.push(`/reservaciones?${query.toString()}`);
  };

  return (
    <form
      id="tour-booking-bar"
      onSubmit={handleSearch}
      className="w-full max-w-5xl mx-auto apple-glass rounded-[28px] p-4 sm:p-5 border border-white/[0.12] shadow-2xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-center">
        {/* Entrada: Check-in estilo iOS */}
        <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-colors">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Ingreso (Check-in)</span>
          </label>
          <input
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (e.target.value >= checkOut) {
                const nextDay = addDays(new Date(e.target.value + 'T12:00:00'), 1);
                setCheckOut(formatDateOnly(nextDay));
              }
            }}
            className="w-full bg-transparent text-white text-sm font-semibold focus:outline-none [color-scheme:dark] cursor-pointer"
            required
          />
        </div>

        {/* Salida: Check-out estilo iOS */}
        <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-colors">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Salida (Check-out)</span>
          </label>
          <input
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent text-white text-sm font-semibold focus:outline-none [color-scheme:dark] cursor-pointer"
            required
          />
        </div>

        {/* Huéspedes y Habitaciones estilo iOS */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-colors">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>Huéspedes</span>
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value, 10))}
              className="w-full bg-transparent text-white text-xs font-semibold focus:outline-none [color-scheme:dark] cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num} className="bg-slate-900 text-white">
                  {num} {num === 1 ? 'persona' : 'personas'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-colors">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1">
              <BedDouble className="w-3 h-3" />
              <span>Habitaciones</span>
            </label>
            <select
              value={rooms}
              onChange={(e) => setRooms(parseInt(e.target.value, 10))}
              className="w-full bg-transparent text-white text-xs font-semibold focus:outline-none [color-scheme:dark] cursor-pointer"
            >
              {[1, 2, 3, 4].map((num) => (
                <option key={num} value={num} className="bg-slate-900 text-white">
                  {num} {num === 1 ? 'hab.' : 'habs.'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botón de Búsqueda estilo Apple */}
        <button
          type="submit"
          className="apple-button-accent h-full min-h-[56px] flex items-center justify-center gap-2 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          <Search className="w-4 h-4 stroke-[2.5]" />
          <span>Buscar Disponibilidad</span>
        </button>
      </div>
    </form>
  );
}
