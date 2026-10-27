'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils/currency';
import { createClient } from '@/lib/supabase/client';
import {
  BedDouble,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Tag,
  Plus,
  Save,
  RefreshCw,
} from 'lucide-react';
import { RoomHousekeepingStatus } from '@/types/hotel.types';

interface RoomState {
  number: string;
  type: string;
  floor: number;
  status: RoomHousekeepingStatus;
}

const INITIAL_ROOMS: RoomState[] = [
  { number: '101', type: 'Individual Estándar', floor: 1, status: 'disponible' },
  { number: '102', type: 'Individual Estándar', floor: 1, status: 'disponible' },
  { number: '201', type: 'Matrimonial Confort', floor: 2, status: 'disponible' },
  { number: '202', type: 'Matrimonial Confort', floor: 2, status: 'disponible' },
  { number: '301', type: 'Doble Twin', floor: 3, status: 'disponible' },
  { number: '302', type: 'Doble Twin', floor: 3, status: 'disponible' },
  { number: '401', type: 'Familiar Superior', floor: 4, status: 'disponible' },
];

export default function AdminHabitacionesPage() {
  const [rooms, setRooms] = useState<RoomState[]>(INITIAL_ROOMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRooms() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from('rooms')
          .select('room_number, floor, housekeeping_status, room_types(name)')
          .eq('is_active', true)
          .order('room_number', { ascending: true });

        if (!error && data && data.length > 0) {
          const loaded: RoomState[] = data.map((r: any) => {
            const typeName = Array.isArray(r.room_types) ? r.room_types[0]?.name : r.room_types?.name;
            return {
              number: r.room_number,
              floor: r.floor,
              type: typeName || 'Habitación',
              status: r.housekeeping_status as RoomHousekeepingStatus,
            };
          });
          setRooms(loaded);
        }
      } catch (err) {
        console.error('Error al cargar habitaciones:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
  }, []);

  const changeStatus = async (roomNumber: string, newStatus: RoomHousekeepingStatus) => {
    // Actualización optimista en interfaz
    setRooms((prev) =>
      prev.map((r) => (r.number === roomNumber ? { ...r, status: newStatus } : r))
    );

    // Persistencia real en Supabase
    try {
      const supabase = createClient();
      await supabase
        .from('rooms')
        .update({ housekeeping_status: newStatus })
        .eq('room_number', roomNumber);
    } catch (err) {
      console.error('Error al persistir estado de habitación:', err);
    }
  };

  const statusConfigs: Record<RoomHousekeepingStatus, { label: string; color: string; badge: string }> = {
    disponible: {
      label: 'Disponible',
      color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
      badge: 'bg-emerald-500 text-slate-950',
    },
    ocupada: {
      label: 'Ocupada',
      color: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
      badge: 'bg-blue-500 text-white',
    },
    en_limpieza: {
      label: 'En Limpieza',
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
      badge: 'bg-amber-500 text-slate-950',
    },
    mantenimiento: {
      label: 'Mantenimiento',
      color: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
      badge: 'bg-rose-500 text-white',
    },
  };

  return (
    <div className="space-y-8">
      {/* Header estilo macOS */}
      <div className="pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-1">
          <BedDouble className="w-4 h-4 text-sky-400" />
          <span className="text-[11px] font-semibold tracking-wider text-sky-400 uppercase">
            Control de Habitaciones y Limpieza
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Estado Físico de Habitaciones y Tarifas
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Gestiona los estados de limpieza para habilitar habitaciones a la venta web y ajusta tarifas por categoría.
        </p>
      </div>

      {/* 1. Tablero de Estados de Limpieza (Housekeeping Board) */}
      <div className="apple-glass rounded-[26px] p-6 sm:p-7 border border-white/[0.08] shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="macos-dot macos-dot-red" />
              <span className="macos-dot macos-dot-yellow" />
              <span className="macos-dot macos-dot-green" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Tablero de Housekeeping (Limpieza y Mantenimiento)
              </h2>
              <p className="text-xs text-slate-400">
                Sincronización instantánea con el motor de reservas y recepción.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 bg-white/[0.03] px-3.5 py-1.5 rounded-full border border-white/[0.06]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Disponible</span>
            <span className="flex items-center gap-1.5 ml-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Ocupada</span>
            <span className="flex items-center gap-1.5 ml-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Limpieza</span>
            <span className="flex items-center gap-1.5 ml-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Taller</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rooms.map((rm) => {
            const conf = statusConfigs[rm.status];
            return (
              <div
                key={rm.number}
                className="apple-glass-card p-5 rounded-[22px] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-2xl font-bold text-white group-hover:text-sky-300 transition-colors">
                      {rm.number}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.06]">
                      Piso {rm.floor}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-300">{rm.type}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Estado Actual:
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        rm.status === 'disponible'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                          : rm.status === 'ocupada'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                          : rm.status === 'en_limpieza'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                      }`}
                    >
                      {rm.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Segmented controls estilo iOS para cambio de estado */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] p-1 rounded-xl bg-black/30 border border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => changeStatus(rm.number, 'disponible')}
                      className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                        rm.status === 'disponible'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      Disponible
                    </button>
                    <button
                      type="button"
                      onClick={() => changeStatus(rm.number, 'ocupada')}
                      className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                        rm.status === 'ocupada'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      Ocupada
                    </button>
                    <button
                      type="button"
                      onClick={() => changeStatus(rm.number, 'en_limpieza')}
                      className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                        rm.status === 'en_limpieza'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      Limpieza
                    </button>
                    <button
                      type="button"
                      onClick={() => changeStatus(rm.number, 'mantenimiento')}
                      className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                        rm.status === 'mantenimiento'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      Taller
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Catálogo de Tarifas y Precios Oficiales */}
      <div className="apple-glass rounded-[26px] p-6 sm:p-7 border border-white/[0.08] shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-bold text-white">Tarifas por Categoría (Soles PEN)</h2>
            <p className="text-xs text-slate-400">Precios base aplicados al motor de reservas web oficial.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {[
            { name: 'Individual Estándar', price: 85, cap: '1 pers.', beds: '1 cama de 1.5 pl' },
            { name: 'Matrimonial Confort', price: 120, cap: '2 pers.', beds: '1 cama Queen' },
            { name: 'Doble Twin', price: 130, cap: '2 pers.', beds: '2 camas de 1.5 pl' },
            { name: 'Familiar Superior', price: 190, cap: '4 pers.', beds: '1 Matrimonial + 2 camas' },
          ].map((cat) => (
            <div
              key={cat.name}
              className="apple-glass-card p-4 rounded-2xl flex items-center justify-between border border-white/[0.06] hover:border-white/[0.12] transition-colors"
            >
              <div>
                <h4 className="font-semibold text-white text-sm">{cat.name}</h4>
                <p className="text-slate-400 mt-0.5">{cat.cap} • {cat.beds}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-bold text-sky-400 block">
                  {formatCurrency(cat.price)}
                </span>
                <span className="text-[10px] text-slate-500">por noche</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
