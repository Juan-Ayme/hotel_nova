'use client';

import { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Calendar,
  QrCode,
  FileText,
  CheckCircle2,
  BedDouble,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface GuestTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    stepNumber: '1',
    title: 'Elige tus Fechas y Habitación',
    subtitle: 'Búsqueda rápida en tiempo real',
    description:
      'Ingresa la fecha de llegada (Check-in desde las 14:00) y de salida (Check-out hasta las 12:00). Puedes elegir entre nuestras 4 categorías de habitación con precios transparentes en Soles.',
    icon: BedDouble,
    badge: 'Paso 1 de 3',
    tip: 'Tip: Puedes ver fotos detalladas y ficha técnica de cada habitación haciendo clic en el catálogo.',
  },
  {
    stepNumber: '2',
    title: 'Pago Fácil con Yape, Plin o Bancos',
    subtitle: 'Bloqueo temporal de 15 minutos',
    description:
      'Al confirmar tus datos, tu cuarto queda bloqueado para ti por 15 minutos. Realiza el pago por Yape, Plin o transferencia bancaria e ingresa tu número de operación. ¡Subir la foto del voucher es 100% opcional!',
    icon: QrCode,
    badge: 'Paso 2 de 3',
    tip: 'Aceptamos Yape, Plin, BCP, BBVA y tarjetas de crédito o débito sin recargos ocultos.',
  },
  {
    stepNumber: '3',
    title: 'Voucher Oficial y Gestión de Estadía',
    subtitle: 'Confirmación inmediata y comprobante PDF',
    description:
      'Recibirás tu código de reserva oficial. Podrás descargar tu voucher en PDF con validez formal y revisar el estado de tu pago ingresando a tu cuenta desde el avatar superior.',
    icon: FileText,
    badge: 'Paso 3 de 3',
    tip: 'Al llegar a recepción solo presenta tu DNI y tu código de reserva para recibir tus llaves.',
  },
];

export default function GuestTutorialModal({ isOpen, onClose }: GuestTutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('novainn_guest_tutorial_seen', 'true');
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="apple-glass border rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-stone-900 dark:text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-modal-title"
      >
        {/* Cabecera estilo macOS */}
        <div className="px-6 py-4 bg-stone-100/80 dark:bg-stone-950/80 border-b border-stone-200 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
              Guía Rápida para Huéspedes
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-white/[0.08] text-stone-500 dark:text-stone-400 transition-colors cursor-pointer"
            aria-label="Cerrar tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido Central del Paso */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Badge del Paso */}
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/25">
              {step.badge}
            </span>

            {/* Indicador de Bolitas */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStep
                      ? 'w-6 bg-orange-600 dark:bg-orange-500'
                      : 'w-2 bg-stone-300 dark:bg-white/20 hover:bg-orange-400'
                  }`}
                  aria-label={`Ir al paso ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Ilustración / Ícono Grande */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-500 p-0.5 shadow-xl shrink-0">
              <div className="w-full h-full bg-stone-50 dark:bg-stone-950 rounded-[22px] flex items-center justify-center">
                <Icon className="w-8 h-8 text-orange-600 dark:text-amber-400" />
              </div>
            </div>

            <div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium block">
                {step.subtitle}
              </span>
              <h3
                id="tutorial-modal-title"
                className="text-xl font-black text-stone-900 dark:text-white tracking-tight"
              >
                {step.title}
              </h3>
            </div>
          </div>

          {/* Explicación en lenguaje sencillo */}
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
            {step.description}
          </p>

          {/* Consejo Útil */}
          <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-800 dark:text-orange-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-orange-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{step.tip}</span>
          </div>
        </div>

        {/* Footer con Botones de Navegación */}
        <div className="px-6 py-4 bg-stone-100/60 dark:bg-stone-950/60 border-t border-stone-200 dark:border-white/[0.08] flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="apple-pill-btn px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('novainn_guest_tutorial_seen', 'true');
                onClose();
              }}
              className="px-3 py-2 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-medium transition-colors cursor-pointer"
            >
              Saltar
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="apple-button-accent px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <span>{isLast ? '¡Entendido!' : 'Siguiente'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
