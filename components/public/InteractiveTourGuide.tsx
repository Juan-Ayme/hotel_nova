'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BedDouble,
  CalendarDays,
  User,
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Check,
} from 'lucide-react';

export interface TourStep {
  targetId: string;
  mobileTargetId?: string;
  title: string;
  subtitle: string;
  description: string;
  tip: string;
  icon: typeof BedDouble;
  placementPreference?: 'top' | 'bottom' | 'auto';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-nav-habitaciones',
    mobileTargetId: 'tour-mobile-habitaciones',
    title: 'Catálogo de Habitaciones',
    subtitle: 'Fotos reales, precios y detalles',
    description:
      'Explora nuestras 4 categorías de habitación (Simple, Matrimonial, Doble y Familiar). Puedes ver fotos reales, servicios incluidos (Wi-Fi 5G, Smart TV, baño privado) y tarifas oficiales en Soles.',
    tip: 'Haz clic en cualquier habitación para ver su galería completa y amenidades.',
    icon: BedDouble,
    placementPreference: 'bottom',
  },
  {
    targetId: 'tour-nav-reservar',
    mobileTargetId: 'tour-mobile-reservar',
    title: 'Motor de Reservaciones',
    subtitle: 'Bloqueo temporal de 15 minutos',
    description:
      'Al presionar "Reservar", inicias el proceso directo en 3 pasos. Tu habitación seleccionada queda bloqueada por 15 minutos para que nadie te la gane mientras realizas tu pago seguro.',
    tip: 'Aceptamos transferencias, Yape, Plin y bancos (BCP, BBVA) sin recargo.',
    icon: CalendarDays,
    placementPreference: 'bottom',
  },
  {
    targetId: 'tour-user-menu',
    mobileTargetId: 'tour-mobile-menu-btn',
    title: 'Tu Avatar y Menú Personal',
    subtitle: 'Mis Reservas, Vouchers y Acceso Staff',
    description:
      'Haz clic en tu avatar para consultar tus reservas activas y descargar tu comprobante de reserva en PDF. Si eres administrador del hotel, aquí también aparece el acceso directo a tu Panel de Control.',
    tip: 'Tu sesión guarda tus comprobantes para que los descargues cuando quieras.',
    icon: User,
    placementPreference: 'bottom',
  },
  {
    targetId: 'tour-booking-bar',
    title: 'Buscador de Disponibilidad',
    subtitle: 'Elige tus fechas de estadía',
    description:
      '¿Cuándo te hospedas? Ingresa tu fecha de llegada (Check-in 14:00) y de salida (Check-out 12:00) junto con la cantidad de personas. El sistema te mostrará cuartos libres y el total exacto en tiempo real.',
    tip: 'Check-in: desde las 14:00 hrs | Check-out: hasta las 12:00 hrs.',
    icon: Search,
    placementPreference: 'top',
  },
];

interface InteractiveTourGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export default function InteractiveTourGuide({ isOpen, onClose }: InteractiveTourGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [bubblePosition, setBubblePosition] = useState<{
    top: number;
    left: number;
    placement: 'top' | 'bottom';
    arrowX: number;
  }>({
    top: 100,
    left: 20,
    placement: 'bottom',
    arrowX: 50,
  });
  const [isElementVisible, setIsElementVisible] = useState(true);

  const bubbleRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const step = TOUR_STEPS[currentStepIndex];
  const StepIcon = step?.icon ?? Sparkles;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  // Buscar el elemento objetivo actual en el DOM
  const getActiveElement = useCallback(() => {
    if (!step) return null;
    const desktopEl = document.getElementById(step.targetId);
    if (desktopEl && desktopEl.offsetParent !== null) {
      return desktopEl;
    }
    if (step.mobileTargetId) {
      const mobileEl = document.getElementById(step.mobileTargetId);
      if (mobileEl && mobileEl.offsetParent !== null) {
        return mobileEl;
      }
    }
    return desktopEl;
  }, [step]);

  // Recalcular posición del foco y de la burbuja flotante
  const updatePosition = useCallback(() => {
    if (!isOpen) return;

    const el = getActiveElement();
    if (!el) {
      setIsElementVisible(false);
      setTargetRect(null);
      // Posición centrada de respaldo si el elemento no existe en la página actual
      setBubblePosition({
        top: Math.max(80, window.innerHeight / 2 - 160),
        left: Math.max(16, (window.innerWidth - Math.min(380, window.innerWidth - 32)) / 2),
        placement: 'bottom',
        arrowX: Math.min(380, window.innerWidth - 32) / 2,
      });
      return;
    }

    const rect = el.getBoundingClientRect();
    setIsElementVisible(true);
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
    });

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const bubbleWidth = Math.min(380, windowWidth - 32);
    const bubbleEstimatedHeight = 280;
    const padding = 14;

    // Decidir si colocar la burbuja ARRIBA o ABAJO del elemento
    let placement: 'top' | 'bottom' = 'bottom';
    if (step.placementPreference === 'top' && rect.top > bubbleEstimatedHeight + padding) {
      placement = 'top';
    } else if (step.placementPreference === 'bottom' && windowHeight - rect.bottom > bubbleEstimatedHeight + padding) {
      placement = 'bottom';
    } else if (windowHeight - rect.bottom < bubbleEstimatedHeight + padding && rect.top > bubbleEstimatedHeight + padding) {
      placement = 'top';
    } else {
      placement = 'bottom';
    }

    // Calcular coordenada Y de la burbuja
    let bubbleTop = 0;
    if (placement === 'bottom') {
      bubbleTop = rect.bottom + padding;
      // Evitar salirse por abajo
      if (bubbleTop + bubbleEstimatedHeight > windowHeight - 16) {
        bubbleTop = Math.max(16, windowHeight - bubbleEstimatedHeight - 16);
      }
    } else {
      bubbleTop = rect.top - bubbleEstimatedHeight - padding;
      // Evitar salirse por arriba
      if (bubbleTop < 16) {
        bubbleTop = 16;
      }
    }

    // Calcular coordenada X de la burbuja (centrada con respecto al elemento objetivo)
    const targetCenterX = rect.left + rect.width / 2;
    let bubbleLeft = targetCenterX - bubbleWidth / 2;

    // Asegurar margen con los bordes de la pantalla
    const screenMargin = 16;
    if (bubbleLeft < screenMargin) {
      bubbleLeft = screenMargin;
    } else if (bubbleLeft + bubbleWidth > windowWidth - screenMargin) {
      bubbleLeft = windowWidth - bubbleWidth - screenMargin;
    }

    // Calcular la posición horizontal de la flecha/puntero relativa a la burbuja
    let arrowX = targetCenterX - bubbleLeft;
    arrowX = Math.max(24, Math.min(bubbleWidth - 24, arrowX));

    setBubblePosition({
      top: bubbleTop,
      left: bubbleLeft,
      placement,
      arrowX,
    });
  }, [isOpen, getActiveElement, step]);

  // Desplazar automáticamente hacia el elemento y recalcular
  useEffect(() => {
    if (!isOpen) return;

    const el = getActiveElement();
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Actualizar varias veces durante y después del scroll suave
    const timeouts = [50, 150, 300, 500].map((delay) =>
      setTimeout(() => {
        updatePosition();
      }, delay)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isOpen, currentStepIndex, getActiveElement, updatePosition]);

  // Escuchar scroll y redimensionamiento de ventana
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        updatePosition();
      });
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isOpen, updatePosition]);

  // Navegación con teclado (Flechas y Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleNext = () => {
    if (isLast) {
      handleClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleClose = () => {
    try {
      localStorage.setItem('novainn_interactive_tour_seen', 'true');
      localStorage.setItem('novainn_guest_tutorial_seen', 'true');
    } catch {
      // Ignorar error si localStorage no está disponible
    }
    onClose();
  };

  if (!isOpen || !step) return null;

  const spotlightPadding = 6;
  const bubbleWidth = typeof window !== 'undefined' ? Math.min(380, window.innerWidth - 32) : 380;

  return (
    <div className="fixed inset-0 z-[100] select-none">
      {/* Fondo con máscara SVG tipo foco/spotlight transparente sobre el elemento objetivo */}
      {targetRect && isElementVisible ? (
        <svg
          className="fixed inset-0 w-full h-full pointer-events-auto cursor-default"
          onClick={handleClose}
          aria-hidden="true"
        >
          <defs>
            <mask id="tour-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - spotlightPadding}
                y={targetRect.top - spotlightPadding}
                width={targetRect.width + spotlightPadding * 2}
                height={targetRect.height + spotlightPadding * 2}
                rx="18"
                ry="18"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(12, 10, 9, 0.72)"
            mask="url(#tour-spotlight-mask)"
          />
        </svg>
      ) : (
        <div
          className="fixed inset-0 bg-stone-950/75 backdrop-blur-xs pointer-events-auto"
          onClick={handleClose}
        />
      )}

      {/* Marco brillante y halo pulsante alrededor del componente exacto */}
      {targetRect && isElementVisible && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top - spotlightPadding,
            left: targetRect.left - spotlightPadding,
            width: targetRect.width + spotlightPadding * 2,
            height: targetRect.height + spotlightPadding * 2,
            borderRadius: 18,
          }}
          className="pointer-events-none z-[101] border-2 border-orange-500 shadow-[0_0_30px_rgba(234,88,12,0.65)] ring-4 ring-orange-500/25 transition-all duration-300 animate-pulse"
        />
      )}

      {/* BURBUJA DE DIÁLOGO FLOTANTE CON PUNTERO / FLECHA APUNTANDO AL COMPONENTE */}
      <div
        ref={bubbleRef}
        style={{
          position: 'fixed',
          top: bubblePosition.top,
          left: bubblePosition.left,
          width: bubbleWidth,
        }}
        className="z-[102] transition-all duration-300 ease-out animate-in fade-in zoom-in-95"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-bubble-title"
      >
        {/* Contenedor tipo Globo de Cómic / Burbuja de Apple */}
        <div className="relative bg-stone-900/95 dark:bg-stone-950/95 border-2 border-orange-500/50 backdrop-blur-2xl text-stone-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-5 flex flex-col gap-4">
          {/* FLECHA / PUNTERO DE LA BURBUJA */}
          {isElementVisible && (
            <>
              {bubblePosition.placement === 'bottom' ? (
                // Puntero apuntando hacia ARRIBA (al elemento superior)
                <div
                  className="absolute -top-3 w-6 h-3 -translate-x-1/2 pointer-events-none"
                  style={{ left: bubblePosition.arrowX }}
                >
                  <svg
                    viewBox="0 0 24 12"
                    className="w-full h-full drop-shadow-[0_-3px_5px_rgba(234,88,12,0.6)]"
                  >
                    <path
                      d="M12 0 L24 12 L0 12 Z"
                      fill="#1c1917"
                      stroke="#ea580c"
                      strokeWidth="1.5"
                    />
                  </svg>
                  {/* Punto luminoso pulsante en la punta de la flecha */}
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_#f97316] animate-ping" />
                </div>
              ) : (
                // Puntero apuntando hacia ABAJO (al elemento inferior)
                <div
                  className="absolute -bottom-3 w-6 h-3 -translate-x-1/2 pointer-events-none"
                  style={{ left: bubblePosition.arrowX }}
                >
                  <svg
                    viewBox="0 0 24 12"
                    className="w-full h-full drop-shadow-[0_3px_5px_rgba(234,88,12,0.6)]"
                  >
                    <path
                      d="M12 12 L24 0 L0 0 Z"
                      fill="#1c1917"
                      stroke="#ea580c"
                      strokeWidth="1.5"
                    />
                  </svg>
                  {/* Punto luminoso pulsante en la punta de la flecha */}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_#f97316] animate-ping" />
                </div>
              )}
            </>
          )}

          {/* Cabecera de la burbuja: Badge de Paso + Botón Saltar */}
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/35 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span>
                  Paso {currentStepIndex + 1} de {TOUR_STEPS.length}
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="text-stone-400 hover:text-white p-1 rounded-full hover:bg-white/[0.08] transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Saltar tutorial"
            >
              <span className="text-[11px] font-medium hidden sm:inline">Saltar</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cuerpo de la burbuja: Ícono + Título + Descripción */}
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-500 p-0.5 shadow-md shadow-orange-600/30 shrink-0 mt-0.5">
              <div className="w-full h-full bg-stone-900 rounded-[14px] flex items-center justify-center">
                <StepIcon className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <h4
                id="tour-bubble-title"
                className="text-sm font-bold text-white tracking-tight leading-snug"
              >
                {step.title}
              </h4>
              <p className="text-[11px] font-medium text-orange-400/90 leading-tight">
                {step.subtitle}
              </p>
              <p className="text-xs text-stone-300 leading-relaxed pt-1 font-normal">
                {step.description}
              </p>
            </div>
          </div>

          {/* Micro-tip práctico */}
          <div className="px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[11px] text-orange-200/90 flex items-start gap-2">
            <span className="font-bold text-orange-400 shrink-0">💡 Tip:</span>
            <span>{step.tip}</span>
          </div>

          {/* Barra inferior: Indicadores de puntos + Botones Anterior / Siguiente */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.08]">
            {/* Puntos de progreso */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-5 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                      : 'w-1.5 bg-stone-700 hover:bg-stone-500'
                  }`}
                  aria-label={`Ir al paso ${idx + 1}`}
                />
              ))}
            </div>

            {/* Botones de Navegación */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-stone-300 hover:text-white hover:bg-white/[0.08] transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Atrás</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-md shadow-orange-600/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isLast ? (
                  <>
                    <span>¡Listo, reservar!</span>
                    <Check className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Siguiente</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
