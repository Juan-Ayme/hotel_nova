import Image from 'next/image';
import Link from 'next/link';
import {
  Target,
  Clock,
  Compass,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { DEFAULT_HOTEL_INFO } from '@/lib/constants/hotel-info';

const GALLERY_AREAS = [
  {
    title: 'Recepción y Hall de Ingreso',
    category: 'Recepción',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    desc: 'Ambiente cálido y acogedor con atención permanente las 24 horas.',
  },
  {
    title: 'Dormitorios Matrimoniales',
    category: 'Habitaciones',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    desc: 'Camas Queen Size ortopédicas con sábanas de 300 hilos y aislamiento acústico.',
  },
  {
    title: 'Cafetería y Zona de Desayuno',
    category: 'Comedor',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    desc: 'Espacio relajante para disfrutar de café selecto peruano y desayunos nutritivos.',
  },
  {
    title: 'Cochera Techada y Vigilada',
    category: 'Estacionamiento',
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    desc: 'Espacio exclusivo y seguro para los vehículos de nuestros huéspedes.',
  },
];

export default function NosotrosPage() {
  return (
    <div className="flex flex-col gap-20 pb-24">
      {/* 1. Header Institucional estilo Apple Keynote */}
      <section className="relative py-24 text-white overflow-hidden text-center">
        <div className="absolute inset-0 opacity-15">
          <Image
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80"
            alt="Fondo Hotel Nova Inn"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4">

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Sobre el Hotel Nova Inn
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
            {DEFAULT_HOTEL_INFO.about_us_presentation}
          </p>
        </div>
      </section>

      {/* 2. Misión y Visión - Apple Glass Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="apple-glass-card rounded-[32px] p-8 border border-white/[0.08] shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Nuestra Misión
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {DEFAULT_HOTEL_INFO.mission}
            </p>
          </div>

          <div className="apple-glass-card rounded-[32px] p-8 border border-white/[0.08] shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Nuestra Visión
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {DEFAULT_HOTEL_INFO.vision}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Estándares de Bioseguridad y Protocolos de Higiene */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="apple-glass-card rounded-[32px] border border-white/[0.08] p-8 sm:p-12 shadow-2xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
              Protocolos de Higiene y Limpieza
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {DEFAULT_HOTEL_INFO.hygiene_protocols}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Desinfección con amonio cuaternario en pasillos y cuartos</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Lavado de lencería a temperaturas esterilizadoras</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ventilación natural continua previa al ingreso del huésped</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dispensadores de alcohol en gel en cada nivel</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Galería de Áreas Comunes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
            Recorrido Visual
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-1 tracking-tight">
            Instalaciones Preparadas para Ti
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Descubre los espacios comunes y dormitorios que ponemos a tu entera disposición.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {GALLERY_AREAS.map((item) => (
            <div
              key={item.title}
              className="apple-glass-card rounded-[28px] overflow-hidden border border-white/[0.08] shadow-xl flex flex-col group hover:border-blue-500/40 transition-all duration-300"
            >
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2.5 left-2.5 px-3 py-1 rounded-full apple-glass text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                  {item.category}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Guía de Puntos de Interés Cercanos */}
      <section className="relative py-16 border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Conectividad Urbana
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-1 tracking-tight">
              Puntos Turísticos y Estratégicos Cercanos
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Ubicación privilegiada con tiempos mínimos de traslado hacia los principales centros de interés.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DEFAULT_HOTEL_INFO.nearby_attractions.map((att) => (
              <div
                key={att.name}
                className="apple-glass-card p-6 rounded-[28px] border border-white/[0.08] flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 font-bold text-xs font-mono">
                      {att.time_minutes} min
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1.5">{att.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{att.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/reservaciones"
              className="apple-button-accent inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-2xl active:scale-95 transition-all"
            >
              <span>Elige tus fechas y reserva</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
