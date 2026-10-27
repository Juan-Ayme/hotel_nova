'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Hotel, Phone, Mail, MapPin, Clock, BookOpen, ShieldCheck, CreditCard, ChevronRight, Lock } from 'lucide-react';
import { DEFAULT_HOTEL_INFO } from '@/lib/constants/hotel-info';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="apple-glass text-stone-700 dark:text-stone-300 border-t border-stone-200 dark:border-white/[0.08] pt-14 pb-10 mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Columna 1: Presentación e Identidad */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-700 p-0.5 shadow-md shadow-orange-600/20">
                <div className="w-full h-full bg-stone-100 dark:bg-stone-950/90 rounded-[14px] flex items-center justify-center">
                  <Hotel className="w-5 h-5 text-orange-600 dark:text-amber-400" />
                </div>
              </div>
              <span className="text-lg font-bold tracking-tight text-stone-900 dark:text-white">
                Hotel Nova Inn
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              {DEFAULT_HOTEL_INFO.short_description}
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-orange-700 dark:text-amber-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-orange-600 dark:text-amber-400" />
              <span>Garantía de confort y bioseguridad certificada</span>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos y Secciones */}
          <div>
            <h3 className="text-xs font-semibold text-stone-900 dark:text-white uppercase tracking-wider mb-4 border-b border-stone-200 dark:border-white/[0.06] pb-2">
              Navegación Oficial
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/" className="hover:text-orange-600 dark:hover:text-white transition-colors flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                  <ChevronRight className="w-3.5 h-3.5 text-orange-500/60" /> Inicio
                </Link>
              </li>
              <li>
                <Link href="/nosotros" className="hover:text-orange-600 dark:hover:text-white transition-colors flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                  <ChevronRight className="w-3.5 h-3.5 text-orange-500/60" /> Nosotros e Instalaciones
                </Link>
              </li>
              <li>
                <Link href="/habitaciones" className="hover:text-orange-600 dark:hover:text-white transition-colors flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                  <ChevronRight className="w-3.5 h-3.5 text-orange-500/60" /> Habitaciones y Tarifas
                </Link>
              </li>
              <li>
                <Link href="/reservaciones" className="hover:text-orange-600 dark:hover:text-white transition-colors flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                  <ChevronRight className="w-3.5 h-3.5 text-orange-500/60" /> Reservar en Línea
                </Link>
              </li>
              <li>
                <Link href="/mis-reservas" className="hover:text-orange-600 dark:hover:text-white transition-colors flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                  <ChevronRight className="w-3.5 h-3.5 text-orange-500/60" /> Mis Reservas (Consultar / Pagar)
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-orange-600 dark:hover:text-white transition-colors flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                  <ChevronRight className="w-3.5 h-3.5 text-orange-500/60" /> Contacto y Asistencia
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Horarios y Contacto Oficial */}
          <div>
            <h3 className="text-xs font-semibold text-stone-900 dark:text-white uppercase tracking-wider mb-4 border-b border-stone-200 dark:border-white/[0.06] pb-2">
              Atención y Horarios
            </h3>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-orange-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-stone-800 dark:text-stone-200">Horarios Oficiales:</p>
                  <p className="text-stone-600 dark:text-stone-400">Check-in: A partir de las 14:00 hrs</p>
                  <p className="text-stone-600 dark:text-stone-400">Check-out: Hasta las 12:00 hrs</p>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-orange-600 dark:text-amber-400 shrink-0" />
                <a href={`tel:${DEFAULT_HOTEL_INFO.phone_number}`} className="hover:text-orange-600 dark:hover:text-white transition-colors text-stone-700 dark:text-stone-300">
                  {DEFAULT_HOTEL_INFO.phone_number}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-orange-600 dark:text-amber-400 shrink-0" />
                <a href={`mailto:${DEFAULT_HOTEL_INFO.email}`} className="hover:text-orange-600 dark:hover:text-white transition-colors text-stone-700 dark:text-stone-300">
                  {DEFAULT_HOTEL_INFO.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="text-stone-600 dark:text-stone-400">{DEFAULT_HOTEL_INFO.address}</span>
              </li>
            </ul>
          </div>

          {/* Columna 4: Cumplimiento Legal y Libro de Reclamaciones */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-stone-900 dark:text-white uppercase tracking-wider mb-4 border-b border-stone-200 dark:border-white/[0.06] pb-2">
              Normativa y Seguridad
            </h3>
            
            {/* Libro de Reclamaciones INDECOPI estilo Apple Glass Card */}
            <Link
              href="/libro-de-reclamaciones"
              className="group block p-3.5 rounded-2xl border apple-glass-card hover:border-orange-500/30 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-stone-900 dark:text-white block group-hover:text-orange-600 dark:group-hover:text-amber-300 transition-colors">
                    Libro de Reclamaciones
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
                    Conforme al D.S. N° 011-2011-PCM INDECOPI
                  </span>
                </div>
              </div>
            </Link>

            <div className="text-[11px] text-stone-600 dark:text-stone-400 space-y-1 leading-relaxed">
              <p className="flex items-center gap-1.5 text-stone-800 dark:text-stone-300 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-orange-600 dark:text-amber-400" />
                Moneda Oficial: Soles Peruanos (S/ - PEN)
              </p>
              <p>
                Todos los comprobantes se emiten de acuerdo a las disposiciones tributarias de SUNAT (Boleta o Factura).
              </p>
            </div>
          </div>
        </div>

        {/* Barra Inferior de Derechos */}
        <div className="pt-6 border-t border-stone-200 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>
            © {currentYear} Hotel Nova Inn. Diseñado con estándares de calidad y confort.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Protección de Datos: Ley N.° 29733</span>
            <span>•</span>
            <Link
              href="/login?role=admin"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-white/[0.03] border border-stone-200 dark:border-white/[0.06] hover:border-orange-500/30 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
              title="Portal exclusivo para recepción y administración"
            >
              <Lock className="w-3 h-3 text-stone-500 dark:text-stone-400" />
              <span>Acceso Personal (Staff)</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
