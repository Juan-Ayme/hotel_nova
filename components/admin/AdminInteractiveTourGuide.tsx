'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  BedDouble,
  FileSpreadsheet,
  PlusCircle,
  CalendarDays,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
} from 'lucide-react';

export interface AdminTourStep {
  targetId: string;
  title: string;
  subtitle: string;
  description: string;
  tip: string;
  icon: typeof LayoutDashboard;
  placementPreference?: 'top' | 'bottom' | 'right' | 'auto';
}

const ADMIN_TOUR_STEPS: AdminTourStep[] = [
  {
    targetId: 'admin-tour-nueva-reserva',
    title: 'Nueva Reserva',
    subtitle: 'Presencial o Telefónica',
    description: 'Registra ingresos Walk-in o llamadas directas en menos de 1 minuto.',
    tip: 'Bloquea la habitación y actualiza el calendario al instante.',
    icon: PlusCircle,
    placementPreference: 'bottom',
  },
  {
    targetId: 'admin-tour-kpis',
    title: 'Control del Día',
    subtitle: 'Llegadas, Salidas y Vouchers',
    description: 'Supervisa check-ins, habitaciones por limpiar y pagos por validar.',
    tip: 'Haz clic en "Revisar comprobantes" para validar Yape o Plin.',
    icon: LayoutDashboard,
    placementPreference: 'bottom',
  },
  {
    targetId: 'admin-tour-calendar',
    title: 'Calendario en Vivo',
    subtitle: 'Disponibilidad de 7 habitaciones',
    description: 'Visualiza qué habitaciones están ocupadas, libres o reservadas.',
    tip: 'Se actualiza automáticamente en tiempo real.',
    icon: CalendarDays,
    placementPreference: 'top',
  },
  {
    targetId: 'admin-tour-nav-pagos',
    title: 'Verificar Pagos',
    subtitle: 'Yape, Plin y transferencias',
    description: 'Revisa comprobantes enviados desde la web y apruébalos con 1 clic.',
    tip: 'Al aprobar, se confirma la reserva y genera el voucher.',
    icon: CreditCard,
    placementPreference: 'right',
  },
  {
    targetId: 'admin-tour-nav-habitaciones',
    title: 'Limpieza y Cuartos',
    subtitle: 'Housekeeping y Tarifas',
    description: 'Actualiza el estado a disponible, en limpieza o mantenimiento.',
    tip: 'Solo los cuartos limpios se habilitan para venta en la web.',
    icon: BedDouble,
    placementPreference: 'right',
  },
  {
    targetId: 'admin-tour-nav-reportes',
    title: 'Reportes y Excel',
    subtitle: 'Balance contable',
    description: 'Revisa ingresos por método de pago y descarga el balance en Excel.',
    tip: 'Cada acción del personal queda registrada en la auditoría.',
    icon: FileSpreadsheet,
    placementPreference: 'right',
  },
];

interface AdminInteractiveTourGuideProps {
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

export default function AdminInteractiveTourGuide({
  isOpen,
  onClose,
}: AdminInteractiveTourGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [bubblePosition, setBubblePosition] = useState<{
    top: number;
    left: number;
    placement: 'top' | 'bottom' | 'right';
    arrowX?: number;
    arrowY?: number;
  }>({
    top: 100,
    left: 20,
    placement: 'bottom',
    arrowX: 50,
  });
  const [isElementVisible, setIsElementVisible] = useState(true);

  const bubbleRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const step = ADMIN_TOUR_STEPS[currentStepIndex];
  const StepIcon = step?.icon ?? Sparkles;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === ADMIN_TOUR_STEPS.length - 1;

  // Buscar el elemento objetivo en el DOM
  const getActiveElement = useCallback(() => {
    if (!step) return null;
    const el = document.getElementById(step.targetId);
    if (el && el.offsetParent !== null) {
      return el;
    }
    return el;
  }, [step]);

  // Recalcular posición del foco y de la burbuja flotante
  const updatePosition = useCallback(() => {
    if (!isOpen) return;

    const el = getActiveElement();
    if (!el) {
      setIsElementVisible(false);
      setTargetRect(null);
      // Posición centrada de respaldo si el elemento no está en la vista actual
      setBubblePosition({
        top: Math.max(80, window.innerHeight / 2 - 120),
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
    const bubbleEstimatedHeight = 200;
    const padding = 14;

    // Decidir posición: 'right', 'top' o 'bottom'
    let placement: 'top' | 'bottom' | 'right' = 'bottom';

    // Si prefiere 'right' (por ejemplo para elementos del sidebar) y cabe a la derecha
    if (
      step.placementPreference === 'right' &&
      windowWidth - rect.right > bubbleWidth + padding + 16
    ) {
      placement = 'right';
    } else if (
      step.placementPreference === 'top' &&
      rect.top > bubbleEstimatedHeight + padding
    ) {
      placement = 'top';
    } else if (
      step.placementPreference === 'bottom' &&
      windowHeight - rect.bottom > bubbleEstimatedHeight + padding
    ) {
      placement = 'bottom';
    } else if (
      windowHeight - rect.bottom < bubbleEstimatedHeight + padding &&
      rect.top > bubbleEstimatedHeight + padding
    ) {
      placement = 'top';
    } else {
      placement = 'bottom';
    }

    let bubbleTop = 0;
    let bubbleLeft = 0;
    let arrowX = 50;
    let arrowY = 50;

    if (placement === 'right') {
      bubbleLeft = rect.right + padding;
      bubbleTop = rect.top + rect.height / 2 - bubbleEstimatedHeight / 2;
      // Mantener dentro de los límites verticales
      bubbleTop = Math.max(16, Math.min(windowHeight - bubbleEstimatedHeight - 16, bubbleTop));
      arrowY = rect.top + rect.height / 2 - bubbleTop;
      arrowY = Math.max(20, Math.min(bubbleEstimatedHeight - 20, arrowY));
    } else if (placement === 'bottom') {
      bubbleTop = rect.bottom + padding;
      if (bubbleTop + bubbleEstimatedHeight > windowHeight - 16) {
        bubbleTop = Math.max(16, windowHeight - bubbleEstimatedHeight - 16);
      }
      const targetCenterX = rect.left + rect.width / 2;
      bubbleLeft = targetCenterX - bubbleWidth / 2;
      bubbleLeft = Math.max(16, Math.min(windowWidth - bubbleWidth - 16, bubbleLeft));
      arrowX = targetCenterX - bubbleLeft;
      arrowX = Math.max(24, Math.min(bubbleWidth - 24, arrowX));
    } else {
      bubbleTop = rect.top - bubbleEstimatedHeight - padding;
      if (bubbleTop < 16) {
        bubbleTop = 16;
      }
      const targetCenterX = rect.left + rect.width / 2;
      bubbleLeft = targetCenterX - bubbleWidth / 2;
      bubbleLeft = Math.max(16, Math.min(windowWidth - bubbleWidth - 16, bubbleLeft));
      arrowX = targetCenterX - bubbleLeft;
      arrowX = Math.max(24, Math.min(bubbleWidth - 24, arrowX));
    }

    setBubblePosition({
      top: bubbleTop,
      left: bubbleLeft,
      placement,
      arrowX,
      arrowY,
    });
  }, [isOpen, getActiveElement, step]);

  // Scroll suave al elemento objetivo
  useEffect(() => {
    if (!isOpen) return;

    const el = getActiveElement();
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const timeouts = [50, 150, 300, 500].map((delay) =>
      setTimeout(() => {
        updatePosition();
      }, delay)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isOpen, currentStepIndex, getActiveElement, updatePosition]);

  // Listener para scroll y resize
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

  // Teclado
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
      localStorage.setItem('novainn_admin_interactive_tour_seen', 'true');
      localStorage.setItem('novainn_admin_tutorial_seen', 'true');
    } catch {
      // ignore
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
            <mask id="admin-tour-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - spotlightPadding}
                y={targetRect.top - spotlightPadding}
                width={targetRect.width + spotlightPadding * 2}
                height={targetRect.height + spotlightPadding * 2}
                rx="16"
                ry="16"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(10, 15, 30, 0.75)"
            mask="url(#admin-tour-spotlight-mask)"
          />
        </svg>
      ) : (
        <div
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs pointer-events-auto"
          onClick={handleClose}
        />
      )}

      {/* Marco brillante y halo pulsante alrededor del componente exacto con color azul/sky */}
      {targetRect && isElementVisible && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top - spotlightPadding,
            left: targetRect.left - spotlightPadding,
            width: targetRect.width + spotlightPadding * 2,
            height: targetRect.height + spotlightPadding * 2,
            borderRadius: 16,
          }}
          className="pointer-events-none z-[101] border-2 border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.7)] ring-4 ring-sky-500/30 transition-all duration-300 animate-pulse"
        />
      )}

      {/* BURBUJA FLOTANTE DE DIÁLOGO */}
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
        aria-labelledby="admin-tour-bubble-title"
      >
        <div className="relative bg-slate-900/95 dark:bg-slate-950/95 border-2 border-sky-500/50 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-4 sm:p-4.5 flex flex-col gap-3">
          {/* FLECHA / PUNTERO DE LA BURBUJA */}
          {isElementVisible && (
            <>
              {bubblePosition.placement === 'bottom' && (
                <div
                  className="absolute -top-3 w-6 h-3 -translate-x-1/2 pointer-events-none"
                  style={{ left: bubblePosition.arrowX }}
                >
                  <svg
                    viewBox="0 0 24 12"
                    className="w-full h-full drop-shadow-[0_-3px_5px_rgba(56,189,248,0.6)]"
                  >
                    <path
                      d="M12 0 L24 12 L0 12 Z"
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-ping" />
                </div>
              )}

              {bubblePosition.placement === 'top' && (
                <div
                  className="absolute -bottom-3 w-6 h-3 -translate-x-1/2 pointer-events-none"
                  style={{ left: bubblePosition.arrowX }}
                >
                  <svg
                    viewBox="0 0 24 12"
                    className="w-full h-full drop-shadow-[0_3px_5px_rgba(56,189,248,0.6)]"
                  >
                    <path
                      d="M12 12 L24 0 L0 0 Z"
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-ping" />
                </div>
              )}

              {bubblePosition.placement === 'right' && (
                <div
                  className="absolute -left-3 w-3 h-6 -translate-y-1/2 pointer-events-none"
                  style={{ top: bubblePosition.arrowY ?? 50 }}
                >
                  <svg
                    viewBox="0 0 12 24"
                    className="w-full h-full drop-shadow-[-3px_0_5px_rgba(56,189,248,0.6)]"
                  >
                    <path
                      d="M0 12 L12 0 L12 24 Z"
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-ping" />
                </div>
              )}
            </>
          )}

          {/* Cabecera: Paso actual + Botón Saltar */}
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/35 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                <span>
                  Paso {currentStepIndex + 1} de {ADMIN_TOUR_STEPS.length}
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/[0.08] transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Cerrar guía"
            >
              <span className="text-[11px] font-medium hidden sm:inline">Saltar</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cuerpo: Ícono + Título + Descripción */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 shadow-md shadow-sky-500/30 shrink-0 mt-0.5">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <StepIcon className="w-5 h-5 text-sky-400" />
              </div>
            </div>

            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <h4
                  id="admin-tour-bubble-title"
                  className="text-sm font-bold text-white tracking-tight leading-snug"
                >
                  {step.title}
                </h4>
                <span className="text-[10px] font-medium text-sky-400/90 shrink-0">
                  {step.subtitle}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal pt-0.5">
                {step.description}
              </p>
            </div>
          </div>

          {/* Micro-tip práctico */}
          <div className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-200/90 flex items-center gap-2">
            <span className="font-bold text-sky-400 shrink-0">💡 Tip:</span>
            <span className="leading-tight truncate">{step.tip}</span>
          </div>

          {/* Barra inferior: Puntos de progreso + Botones Anterior / Siguiente */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.08]">
            <div className="flex items-center gap-1.5">
              {ADMIN_TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-5 bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                      : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Ir al paso ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Atrás</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-md shadow-sky-600/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isLast ? (
                  <>
                    <span>¡Entendido!</span>
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
