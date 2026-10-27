'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import QuickBookingBar from './QuickBookingBar';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { DEFAULT_HOTEL_INFO } from '@/lib/constants/hotel-info';

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80',
    title: 'Descanso, Elegancia y Confort en Cada Detalle',
  },
  {
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=80',
    title: 'Tu Espacio Ideal para el Trabajo o las Vacaciones',
  },
  {
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1920&q=80',
    title: 'Disfruta de una Estadía Inolvidable al Mejor Precio',
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-[92vh] flex flex-col justify-between pt-16 pb-16 overflow-hidden">
      {/* Fondos del Carrusel con fade suave */}
      {SLIDES.map((slide, idx) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={idx === 0}
            className="object-cover scale-105 transition-transform duration-[10000ms] ease-out"
          />
          {/* Overlay oscuro degradado estilo Apple */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b12] via-[#070b12]/80 to-[#070b12]/50" />
        </div>
      ))}

      {/* Contenido Central */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex-1 flex flex-col items-center justify-center">

        {/* Título Principal */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight max-w-5xl leading-tight sm:leading-tight mb-6">
          {SLIDES[currentSlide].title}
        </h1>

        {/* Mensaje Elegante y Directo sin caja pesada */}
        <p className="max-w-2xl text-base sm:text-lg text-slate-200/90 leading-relaxed font-light mb-8 drop-shadow-md">
          Hospedaje moderno en Perú con atención personalizada 24 horas y reserva inmediata al mejor precio.
        </p>

        {/* Botones de Acción Rápida */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-8">
          <Link
            href="/reservaciones"
            className="apple-button-accent px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider shadow-2xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Reservar Ahora</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/habitaciones"
            className="apple-pill-btn px-8 py-4 rounded-2xl text-white font-semibold text-sm tracking-wide transition-all duration-200"
          >
            Ver Habitaciones
          </Link>
        </div>

        {/* Micro-características esenciales sin redundancia */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Confirmación Oficial Inmediata</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>Pagos con Yape • Plin • Transferencia</span>
          </div>
        </div>
      </div>

      {/* Buscador Flotante QuickBookingBar */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-6">
        <QuickBookingBar />
      </div>

      {/* Indicadores de diapositivas estilo iOS Pager */}
      <div className="relative z-10 flex items-center justify-center gap-2 mt-6">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
              idx === currentSlide
                ? 'w-8 bg-blue-500 shadow-[0_0_10px_rgba(10,132,255,0.6)]'
                : 'w-2 bg-white/20 hover:bg-white/50'
            }`}
            aria-label={`Ir a diapositiva ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
