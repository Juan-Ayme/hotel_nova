import HeroSlider from '@/components/public/HeroSlider';
import Link from 'next/link';
import Image from 'next/image';
import {
  Wifi,
  Car,
  ShowerHead,
  Tv,
  Clock,
  Coffee,
  Star,
  MapPin,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { DEFAULT_HOTEL_INFO } from '@/lib/constants/hotel-info';
import { formatCurrency } from '@/lib/utils/currency';

const SERVICES = [
  {
    icon: Wifi,
    title: 'Wi-Fi 5G de Alta Velocidad',
    desc: 'Conectividad de fibra óptica simétrica ultrarrápida en habitaciones y áreas comunes para videollamadas o streaming.',
  },
  {
    icon: Car,
    title: 'Estacionamiento Privado',
    desc: 'Cochera techada y vigilada dentro de las instalaciones con acceso restringido 24/7.',
  },
  {
    icon: ShowerHead,
    title: 'Agua Caliente 24 Horas',
    desc: 'Sistema presurizado constante con duchas españolas en baños privados de finos acabados.',
  },
  {
    icon: Tv,
    title: 'Smart TV con Streaming',
    desc: 'Pantallas 4K de 43" a 55" con Netflix, YouTube y señal digital satelital de alta definición.',
  },
  {
    icon: Clock,
    title: 'Recepción 24 Horas',
    desc: 'Atención ininterrumpida y personalizada para tu check-in, check-out express o asistencia.',
  },
  {
    icon: Coffee,
    title: 'Cafetería & Desayunador',
    desc: 'Selección de café peruano de altura, infusiones y opciones nutritivas para comenzar tu jornada.',
  },
];

const FEATURED_ROOMS = [
  {
    name: 'Habitación Matrimonial Confort',
    type: 'Parejas / Individual',
    price: 120,
    beds: '1 Cama Queen Size',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    amenities: ['Baño Privado', 'Wi-Fi 5G', 'Smart TV 50"', 'Frigobar'],
  },
  {
    name: 'Habitación Doble Twin',
    type: '2 Personas',
    price: 130,
    beds: '2 Camas de 1.5 Plazas',
    image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
    amenities: ['Baño Privado', 'Wi-Fi 5G', 'Smart TV 43"', 'Closet Amplio'],
  },
  {
    name: 'Habitación Familiar Superior',
    type: 'Hasta 4 Personas',
    price: 190,
    beds: '1 Matrimonial + 2 de 1.5 Plazas',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    amenities: ['Baño con Tina', 'Wi-Fi 5G', 'Smart TV 55"', 'Cochera Gratis'],
  },
];

const REVIEWS = [
  {
    name: 'Carlos Mendoza R.',
    origin: 'Lima, Perú',
    rating: 5,
    date: 'Hace 2 semanas',
    comment:
      'Excelente relación calidad-precio. La cama fue muy cómoda, la habitación impecable y el agua caliente funcionó de maravilla. Pagar con Yape fue rapidísimo.',
  },
  {
    name: 'Mariana Valdivia',
    origin: 'Arequipa, Perú',
    rating: 5,
    date: 'Hace 1 mes',
    comment:
      'Llegué de madrugada por un viaje de negocios y la atención en recepción fue muy amable y atenta. La conexión Wi-Fi es realmente rápida y la cochera muy segura.',
  },
  {
    name: 'Roberto Gómez P.',
    origin: 'Trujillo, Perú',
    rating: 5,
    date: 'Hace 3 semanas',
    comment:
      'Viajé con mi familia y la suite familiar superó nuestras expectativas. Espaciosa, limpia y muy bien ubicada. Definitivamente volveremos al Hotel Nova Inn.',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-24 pb-24">
      {/* 1. Hero Slider con Buscador Flotante */}
      <HeroSlider />

      {/* 2. Sección: Servicios y Comodidades Principales */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Diseñados para tu Descanso
          </h2>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Cada rincón de nuestras instalaciones ha sido pensado para ofrecerte tranquilidad, conectividad de alta velocidad y seguridad permanente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.title}
                className="group apple-glass-card rounded-[28px] p-6 sm:p-7 border border-white/[0.08] hover:border-blue-500/40 hover:shadow-[0_0_35px_rgba(10,132,255,0.15)] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-inner">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 tracking-tight">
                  {srv.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {srv.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Sección: Habitaciones Destacadas */}
      <section className="relative py-20 border-y border-white/[0.06] bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Alojamiento Premium
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mt-1 tracking-tight">
                Habitaciones Destacadas
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Precios transparentes expresados en Soles (PEN) con todos los servicios y tributos incluidos.
              </p>
            </div>
            <Link
              href="/habitaciones"
              className="apple-pill-btn px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-white inline-flex items-center gap-2 hover:text-blue-300 transition-all w-fit"
            >
              <span>Ver catálogo completo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURED_ROOMS.map((room) => (
              <div
                key={room.name}
                className="apple-glass-card rounded-[32px] overflow-hidden border border-white/[0.08] hover:border-blue-500/40 hover:shadow-[0_0_35px_rgba(10,132,255,0.18)] transition-all duration-300 flex flex-col group"
              >
                <div className="relative h-60 w-full overflow-hidden bg-slate-900">
                  <Image
                    src={room.image}
                    alt={room.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3.5 right-3.5 apple-glass px-3.5 py-1.5 rounded-full text-white font-mono font-bold text-sm border border-white/[0.15] shadow-lg backdrop-blur-xl">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-amber-200">
                      {formatCurrency(room.price)}
                    </span>
                    <span className="text-[10px] font-normal text-slate-300 ml-1">/ noche</span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                      {room.type}
                    </span>
                    <h3 className="text-xl font-bold text-white mb-1.5 tracking-tight">
                      {room.name}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 font-medium">
                      {room.beds}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {room.amenities.map((am) => (
                        <span
                          key={am}
                          className="px-2.5 py-1 rounded-xl bg-white/[0.04] text-[11px] text-slate-300 font-medium border border-white/[0.08]"
                        >
                          {am}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/reservaciones`}
                    className="apple-button-accent w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider text-center shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Consultar y Reservar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Sección: Por qué Elegirnos / Valor Institucional */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Hospitalidad Basada en la Confianza
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              En Hotel Nova Inn entendemos que tu descanso es lo principal. Por ello, hemos simplificado cada paso: reserva en línea en menos de dos minutos y paga cómodamente con Yape, Plin o transferencias verificadas.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Protocolos Rigurosos de Limpieza y Confort
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ropa de cama esterilizada y desinfección profunda diaria de cada dormitorio y baño privado.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Sin Cargos Ocultos ni Comisiones Sorpresa
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tarifas transparentes con IGV incluido y comprobante fiscal formal (Boleta o Factura electrónica).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Ubicación Estratégica con Fácil Acceso
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    A minutos del centro, terminales de transporte y zonas comerciales con cochera propia.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/nosotros"
                className="apple-pill-btn inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider text-white transition-all shadow-md"
              >
                <span>Conoce Más Sobre Nosotros</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="relative h-[480px] rounded-[32px] overflow-hidden shadow-2xl border border-white/[0.1]">
            <Image
              src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
              alt="Instalaciones Hotel Nova Inn"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-8 text-white">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest font-mono">
                Recepción & Asistencia 24 Horas
              </span>
              <p className="text-xl font-bold mt-1 tracking-tight">
                Siempre listos para brindarte la más cálida bienvenida.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Sección: Opiniones y Reseñas Verificadas */}
      <section className="relative py-20 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Testimonios Reales
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-1 tracking-tight">
              Lo que Opinan Nuestros Huéspedes
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              La satisfacción de quienes nos visitan es nuestra mejor garantía de calidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((rev) => (
              <div
                key={rev.name}
                className="apple-glass-card rounded-[28px] p-7 border border-white/[0.08] flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center gap-1 mb-4 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic mb-6">
                    "{rev.comment}"
                  </p>
                </div>
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{rev.name}</h4>
                    <span className="text-[11px] text-slate-400">{rev.origin}</span>
                  </div>
                  <span className="text-[10px] text-blue-400 font-mono">{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Sección: Ubicación y Mapa Interactivo con Google Maps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="apple-glass-card rounded-[32px] p-8 sm:p-12 border border-white/[0.08] shadow-2xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative overflow-hidden">
          {/* macOS traffic lights at corner */}
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className="macos-dot macos-dot-red" />
            <span className="macos-dot macos-dot-yellow" />
            <span className="macos-dot macos-dot-green" />
          </div>

          <div className="lg:col-span-1 space-y-4 pt-4 lg:pt-0">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Ubicación Estratégica
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight">
              Fácil Acceso en Toda la Ciudad
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Nos encontramos en una zona segura, accesible para taxis, vehículos particulares y transporte turístico.
            </p>
            <div className="pt-2 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{DEFAULT_HOTEL_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Recepción abierta 24/7 para tu llegada</span>
              </div>
            </div>

            <div className="pt-4">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  DEFAULT_HOTEL_INFO.address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="apple-button-accent inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
              >
                <span>Calcular Ruta en Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-2 h-72 sm:h-96 rounded-2xl overflow-hidden border border-white/[0.08] shadow-inner">
            <iframe
              src={DEFAULT_HOTEL_INFO.google_maps_embed_url || ''}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de Ubicación Hotel Nova Inn"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
