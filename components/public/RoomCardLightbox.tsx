'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RoomType } from '@/types/hotel.types';
import { formatCurrency } from '@/lib/utils/currency';
import {
  Users,
  BedDouble,
  Check,
  X,
  ZoomIn,
  ArrowRight,
  Clock,
  Building,
  Info,
  ChevronRight,
  Wifi,
  Tv,
  ShowerHead,
  Coffee,
} from 'lucide-react';

interface RoomCardLightboxProps {
  roomType: RoomType;
  physicalRooms?: string[];
}

function getAmenityIcon(amenityName: string) {
  const lower = amenityName.toLowerCase();
  if (lower.includes('wi-fi') || lower.includes('wifi') || lower.includes('internet')) {
    return <Wifi className="w-3.5 h-3.5 text-orange-600 dark:text-amber-400" />;
  }
  if (lower.includes('tv') || lower.includes('smart') || lower.includes('netflix')) {
    return <Tv className="w-3.5 h-3.5 text-amber-700 dark:text-orange-400" />;
  }
  if (lower.includes('baño') || lower.includes('ducha') || lower.includes('agua')) {
    return <ShowerHead className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />;
  }
  if (lower.includes('frigobar') || lower.includes('café') || lower.includes('té')) {
    return <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />;
  }
  return <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
}

export default function RoomCardLightbox({
  roomType,
  physicalRooms = [],
}: RoomCardLightboxProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'fotos' | 'ficha'>('fotos');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const photos =
    roomType.photos && roomType.photos.length > 0
      ? roomType.photos
      : ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'];

  const handleOpenPhotos = () => {
    setModalTab('fotos');
    setModalOpen(true);
  };

  const handleOpenFicha = () => {
    setModalTab('ficha');
    setModalOpen(true);
  };

  const previewAmenities = roomType.amenities.slice(0, 3);
  const remainingCount = Math.max(0, roomType.amenities.length - 3);

  return (
    <>
      {/* Tarjeta de Habitación Adaptativa (Modo Claro & Modo Oscuro) */}
      <div className="apple-glass-card rounded-[32px] overflow-hidden border transition-all duration-300 flex flex-col group hover:shadow-[0_12px_40px_rgba(234,88,12,0.14)] dark:hover:shadow-[0_12px_40px_rgba(234,88,12,0.22)]">
        
        {/* Imagen principal con Badges flotantes */}
        <div className="relative h-60 sm:h-64 w-full overflow-hidden bg-stone-900">
          <Image
            src={photos[0]}
            alt={roomType.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 cursor-pointer"
            onClick={handleOpenPhotos}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

          {/* Badge de Precio estilo Glassmorphism sobre imagen */}
          <div className="absolute top-3.5 right-3.5 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white font-mono font-bold text-sm sm:text-base border border-white/20 shadow-2xl">
            <span className="text-white">
              {formatCurrency(roomType.base_price_pen)}
            </span>
            <span className="text-[11px] font-normal text-stone-300 ml-1">/ noche</span>
          </div>


          {/* Botón rápido de fotos */}
          <button
            type="button"
            onClick={handleOpenPhotos}
            className="apple-pill-btn absolute bottom-3 right-3 px-3 py-1 rounded-xl text-white text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer"
          >
            <ZoomIn className="w-3 h-3 text-amber-300" />
            <span>{photos.length} {photos.length === 1 ? 'foto' : 'fotos'}</span>
          </button>
        </div>

        {/* Contenido Limpio y Estilizado */}
        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Fila de Especificaciones Clave */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-white/[0.04] border border-stone-200/80 dark:border-white/[0.08] text-stone-700 dark:text-stone-300 font-medium">
                <Users className="w-3.5 h-3.5 text-orange-600 dark:text-amber-400" />
                <span>Hasta {roomType.max_guests} {roomType.max_guests === 1 ? 'huésped' : 'huéspedes'}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-white/[0.04] border border-stone-200/80 dark:border-white/[0.08] text-stone-700 dark:text-stone-300 font-medium">
                <BedDouble className="w-3.5 h-3.5 text-orange-600 dark:text-amber-400" />
                <span>{roomType.beds_count} {roomType.beds_count === 1 ? 'cama' : 'camas'}</span>
              </span>

              {physicalRooms && physicalRooms.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300 font-medium">
                  <Building className="w-3.5 h-3.5 text-orange-600 dark:text-amber-400" />
                  <span>{physicalRooms.length} cuartos ({physicalRooms.map(r => `Hab. ${r}`).join(', ')})</span>
                </span>
              )}
            </div>

            {/* Título de la Habitación */}
            <h3 className="text-xl font-bold text-stone-900 dark:text-white tracking-tight hover:text-orange-600 dark:hover:text-amber-400 transition-colors">
              {roomType.name}
            </h3>

            {/* Descripción Breve */}
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-2">
              {roomType.description}
            </p>

            {/* Micro-Chips de Comodidades */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {previewAmenities.map((am) => (
                <span
                  key={am}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100/70 dark:bg-white/[0.03] border border-stone-200 dark:border-white/[0.06] text-stone-700 dark:text-stone-300 text-[11px]"
                >
                  {getAmenityIcon(am)}
                  <span className="truncate max-w-[150px]">{am}</span>
                </span>
              ))}

              {remainingCount > 0 && (
                <button
                  type="button"
                  onClick={handleOpenFicha}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 text-orange-700 dark:text-orange-300 text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Ver todos los servicios y equipamiento"
                >
                  <span>+{remainingCount} más</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Acciones de la Tarjeta */}
          <div className="pt-2 border-t border-stone-200 dark:border-white/[0.06] flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenFicha}
              className="apple-pill-btn flex-1 py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              title="Ver distribución de camas, políticas y ficha completa"
            >
              <Info className="w-3.5 h-3.5 text-orange-600 dark:text-amber-400" />
              <span>Ficha Técnica</span>
            </button>

            <Link
              href={`/reservaciones?roomType=${roomType.id}`}
              className="apple-button-accent flex-1 py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider text-center shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Reservar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Quick Look Estilo macOS */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="apple-glass border rounded-[30px] max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-stone-900 dark:text-white">
            
            {/* macOS Window Titlebar */}
            <div className="bg-stone-100/90 dark:bg-stone-950/80 px-5 py-3.5 border-b border-stone-200 dark:border-white/[0.08] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className="macos-dot macos-dot-red"
                    onClick={() => setModalOpen(false)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span className="macos-dot macos-dot-yellow" />
                  <span className="macos-dot macos-dot-green" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">{roomType.name}</h3>
                  <span className="text-[11px] font-mono text-orange-700 dark:text-amber-400 font-semibold">
                    {formatCurrency(roomType.base_price_pen)} / noche
                  </span>
                </div>
              </div>

              {/* Selector de Pestañas */}
              <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-black/40 p-1 rounded-xl border border-stone-300/40 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setModalTab('fotos')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    modalTab === 'fotos'
                      ? 'apple-button-accent text-white shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  Fotos ({photos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('ficha')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    modalTab === 'ficha'
                      ? 'apple-button-accent text-white shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  Ficha & Políticas
                </button>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido del Modal con Scroll */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
              
              {/* TAB 1: GALERÍA DE FOTOS */}
              {modalTab === 'fotos' && (
                <div className="space-y-4">
                  <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-black/40 border border-stone-200 dark:border-white/[0.08] shadow-inner">
                    <Image
                      src={photos[selectedPhotoIndex]}
                      alt={`${roomType.name} - Vista ${selectedPhotoIndex + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {photos.length > 1 && (
                    <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
                      {photos.map((ph, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedPhotoIndex(idx)}
                          className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                            idx === selectedPhotoIndex
                              ? 'border-orange-500 scale-105 shadow-md shadow-orange-500/30'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <Image src={ph} alt="Miniatura" fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: FICHA TÉCNICA Y POLÍTICAS */}
              {modalTab === 'ficha' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  
                  {/* Resumen Bento Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-stone-100/60 dark:bg-white/[0.03] border border-stone-200 dark:border-white/[0.08] space-y-1">
                      <div className="flex items-center gap-2 text-orange-600 dark:text-amber-400 text-xs font-semibold">
                        <Users className="w-4 h-4" />
                        <span>Capacidad</span>
                      </div>
                      <p className="text-sm font-bold text-stone-900 dark:text-white">
                        Hasta {roomType.max_guests} personas
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">Adultos y niños bienvenidos</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-100/60 dark:bg-white/[0.03] border border-stone-200 dark:border-white/[0.08] space-y-1">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-orange-400 text-xs font-semibold">
                        <BedDouble className="w-4 h-4" />
                        <span>Camas Disponibles</span>
                      </div>
                      <p className="text-sm font-bold text-stone-900 dark:text-white">
                        {roomType.beds_count} {roomType.beds_count === 1 ? 'Cama' : 'Camas'}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">{roomType.beds_description}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-100/60 dark:bg-white/[0.03] border border-stone-200 dark:border-white/[0.08] space-y-1">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        <Building className="w-4 h-4" />
                        <span>Cuartos en Hotel</span>
                      </div>
                      <p className="text-sm font-bold text-stone-900 dark:text-white">
                        {physicalRooms.length} habitaciones
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                        {physicalRooms.map(r => `Hab. ${r}`).join(', ') || 'Consultar recepción'}
                      </p>
                    </div>
                  </div>

                  {/* Descripción Detallada */}
                  <div className="p-4 rounded-2xl bg-stone-100/40 dark:bg-white/[0.02] border border-stone-200 dark:border-white/[0.06] space-y-1.5">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-200 uppercase tracking-wider">
                      Descripción del Ambiente
                    </h4>
                    <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                      {roomType.description}
                    </p>
                    {roomType.main_features && (
                      <p className="text-xs text-stone-600 dark:text-stone-400 pt-1 leading-relaxed">
                        <strong className="text-stone-800 dark:text-stone-300 font-medium">Equipamiento destacado:</strong> {roomType.main_features}
                      </p>
                    )}
                  </div>

                  {/* Lista Completa de Servicios y Equipamiento */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-200 uppercase tracking-wider">
                      Todos los Servicios Incluidos ({roomType.amenities.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {roomType.amenities.map((am) => (
                        <div
                          key={am}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-stone-100/60 dark:bg-white/[0.03] border border-stone-200 dark:border-white/[0.06] text-xs text-stone-800 dark:text-stone-200"
                        >
                          <div className="w-6 h-6 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                            {getAmenityIcon(am)}
                          </div>
                          <span>{am}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Horarios y Políticas del Hotel */}
                  <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-orange-700 dark:text-amber-300 font-bold">
                      <Clock className="w-4 h-4" />
                      <span>Horarios y Reglas de Estadía</span>
                    </div>
                    <p className="text-stone-800 dark:text-stone-300">
                      {roomType.check_in_out_conditions}
                    </p>
                    {roomType.extra_policies && (
                      <p className="text-stone-600 dark:text-stone-400 italic text-[11px] pt-1 border-t border-orange-500/20">
                        {roomType.extra_policies}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer con CTA de Reserva */}
            <div className="bg-stone-100/90 dark:bg-stone-950/80 px-6 py-4 border-t border-stone-200 dark:border-white/[0.08] flex items-center justify-between shrink-0">
              <div>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block">Tarifa por noche</span>
                <span className="text-lg font-bold font-mono text-stone-900 dark:text-white">
                  {formatCurrency(roomType.base_price_pen)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="apple-pill-btn px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cerrar
                </button>
                <Link
                  href={`/reservaciones?roomType=${roomType.id}`}
                  className="apple-button-accent px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <span>Reservar Ahora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
