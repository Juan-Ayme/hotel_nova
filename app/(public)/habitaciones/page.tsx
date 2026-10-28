'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import RoomCardLightbox from '@/components/public/RoomCardLightbox';
import { createClient } from '@/lib/supabase/client';
import { RoomType } from '@/types/hotel.types';
import { formatCurrency } from '@/lib/utils/currency';
import {
  BedDouble,
  SlidersHorizontal,
  RotateCcw,
  Building,
  Layers,
  CheckCircle2,
  CalendarDays,
  DoorClosed,
  ArrowRight,
} from 'lucide-react';

const INITIAL_ROOM_TYPES: RoomType[] = [
  {
    id: 'room-type-1',
    name: 'Habitación Individual Estándar',
    slug: 'individual-estandar',
    description:
      'Ideal para viajeros de negocios o estadías breves. Diseñada con un estilo moderno y funcional para el máximo descanso.',
    max_guests: 1,
    beds_count: 1,
    beds_description: '1 Cama de 1.5 plazas con colchón ortopédico',
    main_features: 'Escritorio ergonómico de trabajo, iluminación cálida regulable, closet amplio y baño privado.',
    amenities: [
      'Wi-Fi 5G de alta velocidad',
      'Smart TV 43" con Netflix',
      'Baño privado con ducha española',
      'Agua caliente 24 horas',
      'Escritorio ergonómico',
    ],
    base_price_pen: 85,
    check_in_out_conditions: 'Check-in: 14:00 hrs | Check-out: 12:00 hrs. No se admiten mascotas.',
    extra_policies: 'Camas supletorias no disponibles en esta categoría.',
    photos: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    ],
    is_active: true,
  },
  {
    id: 'room-type-2',
    name: 'Habitación Matrimonial Confort',
    slug: 'matrimonial-confort',
    description:
      'Habitación amplia pensada para parejas que buscan comodidad, privacidad y descanso placentero.',
    max_guests: 2,
    beds_count: 1,
    beds_description: '1 Cama Queen Size con sábanas de 300 hilos',
    main_features:
      'Ambiente romántico y acogedor, frigobar surtido, Smart TV con cable satelital y baño privado con finos acabados.',
    amenities: [
      'Wi-Fi 5G',
      'Smart TV 50"',
      'Baño privado con agua caliente',
      'Frigobar',
      'Secadora de cabello',
      'Vista exterior',
    ],
    base_price_pen: 120,
    check_in_out_conditions: 'Check-in: 14:00 hrs | Check-out: 12:00 hrs.',
    extra_policies: 'Early check-in sujeto a disponibilidad previa.',
    photos: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    ],
    is_active: true,
  },
  {
    id: 'room-type-3',
    name: 'Habitación Doble Twin',
    slug: 'doble-twin',
    description:
      'Espaciosa habitación con dos camas independientes, perfecta para colegas de trabajo, amigos o familiares.',
    max_guests: 2,
    beds_count: 2,
    beds_description: '2 Camas de 1.5 plazas separadas',
    main_features: 'Distribución óptima para dos personas, closets independientes y escritorio compartido.',
    amenities: [
      'Wi-Fi 5G',
      'Smart TV 43"',
      'Baño privado con agua caliente',
      'Caja de seguridad',
      'Artículos de aseo gratuitos',
    ],
    base_price_pen: 130,
    check_in_out_conditions: 'Check-in: 14:00 hrs | Check-out: 12:00 hrs.',
    extra_policies: 'Posibilidad de unir las camas previa solicitud telefónica.',
    photos: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    ],
    is_active: true,
  },
  {
    id: 'room-type-4',
    name: 'Habitación Familiar Superior',
    slug: 'familiar-superior',
    description:
      'La alternativa perfecta para familias. Gran amplitud, comodidades integradas y ambiente seguro para niños.',
    max_guests: 4,
    beds_count: 3,
    beds_description: '1 Cama Matrimonial de 2 plazas + 2 Camas de 1.5 plazas',
    main_features: 'Espacio amplio con sala de estar pequeña, mesa de centro, frigobar y ventanales con luz natural.',
    amenities: [
      'Wi-Fi 5G',
      'Smart TV 55"',
      'Baño privado con tina y agua caliente',
      'Frigobar',
      'Mesa de té',
      'Cochera gratuita incluida',
    ],
    base_price_pen: 190,
    check_in_out_conditions: 'Check-in: 14:00 hrs | Check-out: 12:00 hrs.',
    extra_policies: 'Cochera sujeta a registro previo al momento de reservar.',
    photos: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
    ],
    is_active: true,
  },
];

interface PhysicalRoomItem {
  id: string;
  room_number: string;
  floor: number;
  housekeeping_status: string;
  room_type_id: string;
  room_type_name: string;
  room_type_slug: string;
  price: number;
  max_guests: number;
  beds_desc: string;
  photo: string;
}

export default function HabitacionesPage() {
  const [viewMode, setViewMode] = useState<'categorias' | 'cuartos'>('categorias');
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(INITIAL_ROOM_TYPES);
  const [physicalRooms, setPhysicalRooms] = useState<PhysicalRoomItem[]>([]);
  const [roomsByType, setRoomsByType] = useState<Record<string, string[]>>({
    'individual-estandar': ['101', '102'],
    'matrimonial-confort': ['201', '202'],
    'doble-twin': ['301', '302'],
    'familiar-superior': ['401'],
  });

  const [guestFilter, setGuestFilter] = useState<number | 'all'>('all');
  const [maxPrice, setMaxPrice] = useState<number>(250);
  const [selectedAmenity, setSelectedAmenity] = useState<string>('all');

  useEffect(() => {
    async function fetchRealRooms() {
      try {
        const supabase = createClient();
        
        // 1. Cargar Tipos de Habitación (Categorías)
        const { data: typesData } = await supabase
          .from('room_types')
          .select('*')
          .eq('is_active', true)
          .order('base_price_pen', { ascending: true });

        if (typesData && typesData.length > 0) {
          setRoomTypes(typesData as any);
        }

        // 2. Cargar Habitaciones Físicas (Los 7 cuartos)
        const { data: roomsData } = await supabase
          .from('rooms')
          .select('id, room_number, floor, housekeeping_status, room_type_id, room_types(name, slug, base_price_pen, max_guests, beds_description, photos)')
          .eq('is_active', true)
          .order('room_number', { ascending: true });

        if (roomsData && roomsData.length > 0) {
          const mapping: Record<string, string[]> = {};
          const items: PhysicalRoomItem[] = roomsData.map((r: any) => {
            const rt = Array.isArray(r.room_types) ? r.room_types[0] : r.room_types;
            const slug = rt?.slug || 'estandar';
            const typeName = rt?.name || 'Habitación';
            const price = rt?.base_price_pen || 100;
            const maxGuests = rt?.max_guests || 2;
            const bedsDesc = rt?.beds_description || 'Camas confortables';
            const photo = rt?.photos?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80';

            if (!mapping[slug]) mapping[slug] = [];
            mapping[slug].push(r.room_number);

            return {
              id: r.id,
              room_number: r.room_number,
              floor: r.floor,
              housekeeping_status: r.housekeeping_status,
              room_type_id: r.room_type_id,
              room_type_name: typeName,
              room_type_slug: slug,
              price,
              max_guests: maxGuests,
              beds_desc: bedsDesc,
              photo,
            };
          });

          setRoomsByType(mapping);
          setPhysicalRooms(items);
        }
      } catch (err) {
        console.error('Error cargando catálogo de habitaciones:', err);
      }
    }
    fetchRealRooms();
  }, []);

  const filteredRooms = useMemo(() => {
    return roomTypes.filter((room) => {
      if (guestFilter !== 'all' && room.max_guests < guestFilter) {
        return false;
      }
      if (room.base_price_pen > maxPrice) {
        return false;
      }
      if (selectedAmenity !== 'all') {
        const hasAmenity = room.amenities?.some((a) =>
          a.toLowerCase().includes(selectedAmenity.toLowerCase())
        );
        if (!hasAmenity) return false;
      }
      return true;
    });
  }, [roomTypes, guestFilter, maxPrice, selectedAmenity]);

  const handleResetFilters = () => {
    setGuestFilter('all');
    setMaxPrice(250);
    setSelectedAmenity('all');
  };

  // Filtrar los cuartos físicos con los mismos criterios dinámicos
  const filteredPhysicalRooms = useMemo(() => {
    return physicalRooms.filter((r) => {
      if (guestFilter !== 'all' && r.max_guests < guestFilter) {
        return false;
      }
      if (r.price > maxPrice) {
        return false;
      }
      if (selectedAmenity !== 'all') {
        const parentType = roomTypes.find((rt) => rt.slug === r.room_type_slug || rt.id === r.room_type_id);
        const hasAmenity = parentType?.amenities?.some((a) =>
          a.toLowerCase().includes(selectedAmenity.toLowerCase())
        );
        if (!hasAmenity) return false;
      }
      return true;
    });
  }, [physicalRooms, guestFilter, maxPrice, selectedAmenity, roomTypes]);

  // Agrupar los cuartos físicos filtrados por piso
  const roomsByFloor = useMemo(() => {
    const grouped: Record<number, PhysicalRoomItem[]> = {};
    filteredPhysicalRooms.forEach((r) => {
      if (!grouped[r.floor]) grouped[r.floor] = [];
      grouped[r.floor].push(r);
    });
    return grouped;
  }, [filteredPhysicalRooms]);

  return (
    <div className="flex flex-col gap-10 pb-24">
      {/* 1. Header estilo Keynote de Apple */}
      <section className="relative pt-24 pb-12 text-center px-4 overflow-hidden">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-stone-900 dark:text-white max-w-4xl mx-auto">
          Habitaciones y Tarifas
        </h1>
        <p className="mt-4 text-sm sm:text-base text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
          Explora nuestras categorías de alojamiento o consulta la distribución de cuartos por piso con tarifas en Soles.
        </p>

        {/* Conmutador de Vista estilo macOS Segmented Bar */}
        <div className="mt-8 inline-flex p-1.5 rounded-full bg-stone-200/60 dark:bg-black/40 border border-stone-300/60 dark:border-white/[0.12] shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setViewMode('categorias')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'categorias'
                ? 'apple-button-accent text-white shadow-lg'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Por Categorías ({filteredRooms.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cuartos')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'cuartos'
                ? 'apple-button-accent text-white shadow-lg'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Mapa por Pisos ({filteredPhysicalRooms.length})</span>
          </button>
        </div>
      </section>

      {/* Barra de Filtros Dinámicos (Aplica a Categorías y a Mapa por Pisos) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-4">
        <div className="apple-glass-card rounded-[28px] p-5 sm:p-6 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6 border">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 shrink-0">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <SlidersHorizontal className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Filtros Dinámicos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            {/* Filtro por Capacidad */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Capacidad de Huéspedes
              </label>
              <select
                value={guestFilter}
                onChange={(e) =>
                  setGuestFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
                }
                className="px-3.5 py-2.5 rounded-xl bg-stone-100/70 dark:bg-white/[0.04] border border-stone-200 dark:border-white/[0.08] text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40 cursor-pointer"
              >
                <option value="all" className="bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white">Todas las capacidades</option>
                <option value="1" className="bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white">1 huésped a más</option>
                <option value="2" className="bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white">2 huéspedes a más</option>
                <option value="4" className="bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white">4 huéspedes (Familias)</option>
              </select>
            </div>

            {/* Filtro por Precio Máximo */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[11px] font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                <span>Precio Máximo</span>
                <span className="text-orange-600 dark:text-amber-400 font-mono font-bold">
                  Hasta S/ {maxPrice}
                </span>
              </div>
              <input
                type="range"
                min={80}
                max={250}
                step={10}
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
                className="w-full accent-orange-500 cursor-pointer h-1.5 bg-stone-200 dark:bg-white/10 rounded-lg appearance-none mt-2"
              />
            </div>

            {/* Filtro por Comodidad */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Comodidad Destacada
              </label>
              <select
                value={selectedAmenity}
                onChange={(e) => setSelectedAmenity(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-stone-100/70 dark:bg-white/[0.04] border border-stone-200 dark:border-white/[0.08] text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40 cursor-pointer"
              >
                <option value="all" className="bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white">Cualquier comodidad</option>
                <option value="Frigobar" className="bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white">Con Frigobar</option>
                <option value="Cochera" className="bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white">Con Cochera privada</option>
                <option value="Smart TV" className="bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white">Smart TV 4K</option>
                <option value="Escritorio" className="bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white">Con Escritorio ergonómico</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="apple-pill-btn p-2.5 rounded-xl transition-all shrink-0 cursor-pointer"
            title="Restablecer filtros"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* VISTA 1: POR CATEGORÍA (4 MODELOS) */}
      {viewMode === 'categorias' && (
        <div className="space-y-10">
          {/* Grilla de Categorías */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            {filteredRooms.length === 0 ? (
              <div className="apple-glass-card rounded-[32px] p-12 text-center max-w-lg mx-auto space-y-4">
                <BedDouble className="w-12 h-12 text-slate-500 mx-auto" />
                <h3 className="text-lg font-bold text-white">
                  No encontramos habitaciones con esos filtros
                </h3>
                <p className="text-xs text-slate-400">
                  Intenta ampliar el rango de precio o cambiar la capacidad seleccionada.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="apple-button-accent px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Restablecer Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredRooms.map((room) => (
                  <RoomCardLightbox
                    key={room.id}
                    roomType={room}
                    physicalRooms={roomsByType[room.slug]}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* VISTA 2: MAPA DE LOS 7 CUARTOS POR PISO */}
      {viewMode === 'cuartos' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8 animate-in fade-in duration-200">
          <div className="apple-glass-card rounded-[28px] p-6 text-center max-w-2xl mx-auto border">
            <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">
              Directorio de las 7 Habitaciones Físicas
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Nuestro hotel cuenta con 7 habitaciones distribuidas estratégicamente a lo largo de 4 pisos para asegurar privacidad, silencio y comodidad.
            </p>
          </div>

          {filteredPhysicalRooms.length === 0 ? (
            <div className="apple-glass-card rounded-[32px] p-12 text-center max-w-lg mx-auto space-y-4">
              <BedDouble className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">
                No encontramos habitaciones en los pisos con esos filtros
              </h3>
              <p className="text-xs text-slate-400">
                Intenta ampliar el rango de precio o cambiar la capacidad seleccionada.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="apple-button-accent px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : (
            [1, 2, 3, 4]
              .filter((floorNum) => (roomsByFloor[floorNum] || []).length > 0)
              .map((floorNum) => {
                const floorRooms = roomsByFloor[floorNum] || [];
                return (
                  <div key={floorNum} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-600/15 border border-orange-500/30 text-orange-700 dark:text-orange-400 flex items-center justify-center font-mono font-bold text-sm">
                        {floorNum}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-stone-900 dark:text-white">
                          Piso {floorNum}
                        </h4>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          {floorRooms.length} {floorRooms.length === 1 ? 'habitación disponible' : 'habitaciones disponibles'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {floorRooms.map((r) => (
                        <div
                          key={r.id}
                          className="apple-glass-card rounded-[24px] p-5 border hover:border-orange-500/40 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
                        >
                          <div className="space-y-3">
                            <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-stone-900">
                              <Image
                                src={r.photo}
                                alt={`Habitación ${r.room_number}`}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-white font-mono font-black text-sm border border-white/20">
                                Hab. {r.room_number}
                              </div>
                              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 backdrop-blur-md flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Disponible</span>
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-orange-700 dark:text-orange-400 font-bold block">
                                Piso {r.floor} • Capacidad: {r.max_guests} huéspedes
                              </span>
                              <h5 className="text-lg font-bold text-stone-900 dark:text-white mt-0.5">
                                {r.room_type_name}
                              </h5>
                              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                                {r.beds_desc}
                              </p>
                            </div>
                          </div>

                          <div className="pt-4 mt-4 border-t border-stone-200 dark:border-white/[0.06] flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-stone-500 dark:text-stone-400 block">Tarifa Oficial</span>
                              <span className="font-mono text-lg font-bold text-orange-700 dark:text-emerald-400">
                                {formatCurrency(r.price)}
                              </span>
                            </div>
                            <Link
                              href={`/reservaciones?roomType=${r.room_type_id}&tipo=${r.room_type_slug}`}
                              className="apple-button-accent px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                            >
                              <CalendarDays className="w-3.5 h-3.5" />
                              <span>Reservar Hab. {r.room_number}</span>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
          )}
        </section>
      )}
    </div>
  );
}
