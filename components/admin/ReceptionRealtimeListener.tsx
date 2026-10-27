'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle2, DollarSign } from 'lucide-react';

export default function ReceptionRealtimeListener() {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reproductor de sonido sintetizado Web Audio (inmune a archivos externos faltantes)
  const playChimeSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Nota D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // Nota A5

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn('AudioContext no permitido o bloqueado por el navegador:', e);
    }
  };

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('hotel-nova-inn-admin-sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments' },
        (payload) => {
          playChimeSound();
          setToastMessage(`¡Nuevo comprobante de pago recibido! Monto: S/ ${payload.new.amount_pen}`);
          router.refresh();
          setTimeout(() => setToastMessage(null), 5000);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reservations' },
        (payload) => {
          playChimeSound();
          setToastMessage(`¡Nueva reserva creada! Código: ${payload.new.reservation_code}`);
          router.refresh();
          setTimeout(() => setToastMessage(null), 5000);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms' },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  if (!toastMessage) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="apple-glass rounded-2xl p-4 border border-white/[0.14] shadow-2xl backdrop-blur-2xl text-white flex items-center gap-3.5 max-w-sm">
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(10,132,255,0.3)]">
          <Bell className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400">Notificación Nova Inn</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <p className="text-xs font-semibold text-slate-100 mt-0.5">{toastMessage}</p>
        </div>
      </div>
    </div>
  );
}
