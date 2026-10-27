'use client';

import { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  CreditCard,
  BedDouble,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface AdminTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADMIN_STEPS = [
  {
    stepNumber: '1',
    title: 'Control de Llegadas y Nueva Reserva',
    subtitle: 'Dashboard Operativo de Recepción',
    description:
      'En el Dashboard principal supervisas los Check-ins y Check-outs programados para la fecha. Puedes usar el botón "+ Nueva Reserva" para registrar huéspedes presenciales (Walk-In) o llamadas telefónicas en menos de 1 minuto.',
    icon: LayoutDashboard,
    badge: 'Módulo 1 de 4',
    tip: 'Las reservas Walk-In bloquean inmediatamente la habitación y actualizan el calendario en tiempo real.',
  },
  {
    stepNumber: '2',
    title: 'Verificación de Pagos Yape y Plin',
    subtitle: 'Aprobación o Rechazo con 1 Clic',
    description:
      'En la sección "Verificar Pagos", verás cada pago enviado por la web con su número de operación y comprobante opcional. Al hacer clic en "Aprobar", la reserva se confirma automáticamente y se genera su voucher oficial.',
    icon: CreditCard,
    badge: 'Módulo 2 de 4',
    tip: 'Si el cliente se equivocó en el monto o número de operación, puedes rechazar el pago ingresando el motivo.',
  },
  {
    stepNumber: '3',
    title: 'Gestión de Limpieza y Habitaciones',
    subtitle: 'Housekeeping y Disponibilidad Web',
    description:
      'En "Habitaciones & Limpieza", actualiza el estado físico de los 7 dormitorios (Limpia, Sucia o Mantenimiento). Solo las habitaciones marcadas como "Limpia" quedan habilitadas para su venta automática en la web.',
    icon: BedDouble,
    badge: 'Módulo 3 de 4',
    tip: 'Cuando un huésped realiza el Check-out, la habitación cambia automáticamente a estado "Sucia" para el equipo de aseo.',
  },
  {
    stepNumber: '4',
    title: 'Reportes y Exportación Contable',
    subtitle: 'Balance de Ingresos y Auditoría',
    description:
      'En "Reportes & Auditoría", visualiza los ingresos consolidados por canal de pago (Yape, Plin, Transferencias y Tarjetas). Puedes descargar el reporte financiero completo en formato Excel (.xlsx) con un solo clic.',
    icon: FileSpreadsheet,
    badge: 'Módulo 4 de 4',
    tip: 'Cada acción del personal queda registrada con fecha, hora y usuario en la bitácora inalterable.',
  },
];

export default function AdminTutorialModal({ isOpen, onClose }: AdminTutorialModalProps) {
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

  const step = ADMIN_STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === ADMIN_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('novainn_admin_tutorial_seen', 'true');
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
        className="apple-glass-card border border-white/[0.12] rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-tutorial-modal-title"
      >
        {/* Cabecera estilo macOS con Traffic Lights */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="macos-dot macos-dot-red" />
              <span className="macos-dot macos-dot-yellow" />
              <span className="macos-dot macos-dot-green" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Manual Rápido de Operación • Hotel Nova Inn
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido Central */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Badge del Módulo */}
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
              {step.badge}
            </span>

            {/* Indicador de Bolitas */}
            <div className="flex items-center gap-1.5">
              {ADMIN_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStep ? 'w-6 bg-sky-500' : 'w-2 bg-white/20 hover:bg-sky-400'
                  }`}
                  aria-label={`Ir al módulo ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Ilustración / Ícono Grande */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 shadow-xl shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                <Icon className="w-8 h-8 text-sky-400" />
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-medium block">
                {step.subtitle}
              </span>
              <h3
                id="admin-tutorial-modal-title"
                className="text-xl font-bold text-white tracking-tight"
              >
                {step.title}
              </h3>
            </div>
          </div>

          {/* Explicación Operativa */}
          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            {step.description}
          </p>

          {/* Consejo para Recepción */}
          <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-xs text-sky-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{step.tip}</span>
          </div>
        </div>

        {/* Footer con Controles */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-white/[0.08] flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="apple-pill-btn px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer text-slate-300"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('novainn_admin_tutorial_seen', 'true');
                onClose();
              }}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white font-medium transition-colors cursor-pointer"
            >
              Saltar
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="apple-button-accent px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <span>{isLast ? '¡Empezar!' : 'Siguiente'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
