import { Suspense } from 'react';
import BookingStepper from '@/components/public/BookingStepper';

export default function ReservacionesPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white text-center px-4">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
          Gestiona tu Reserva
        </h1>
        <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed font-light">
          Elige tus fechas, ingresa tus datos y asegura tu habitación con confirmación inmediata.
        </p>
      </section>

      {/* Stepper envuelto en Suspense */}
      <Suspense
        fallback={
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs text-slate-500">Cargando disponibilidad y tarifas...</p>
          </div>
        }
      >
        <BookingStepper />
      </Suspense>
    </div>
  );
}
