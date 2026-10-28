'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';
import {
  Clock,
  QrCode,
  Copy,
  Check,
  Upload,
  AlertTriangle,
  Building2,
  CreditCard,
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  Send,
  LogIn,
  User,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { DEFAULT_HOTEL_INFO } from '@/lib/constants/hotel-info';

interface PaymentTimerAndUploadProps {
  reservationId: string;
  reservationCode: string;
  totalAmount: number;
  expiresAt: string;
  guestEmail?: string;
  guestName?: string;
  onPaymentSubmitted: (data: { method: string; operationNumber: string }) => void;
}

export default function PaymentTimerAndUpload({
  reservationId,
  reservationCode,
  totalAmount,
  expiresAt,
  guestEmail,
  guestName,
  onPaymentSubmitted,
}: PaymentTimerAndUploadProps) {
  const [activeTab, setActiveTab] = useState<'yape' | 'plin' | 'transferencia' | 'tarjeta'>('yape');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [operationNumber, setOperationNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Estado de Autenticación del Huésped
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string; name?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Formulario de Inicio de Sesión / Envío de Código
  const [authEmail, setAuthEmail] = useState(guestEmail || '');
  const [authPassword, setAuthPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (guestEmail && !authEmail) {
      setAuthEmail(guestEmail);
    }
  }, [guestEmail, authEmail]);

  // Verificar sesión activa y escuchar cambios de auth
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
        });
      } else {
        setCurrentUser(null);
      }
      setAuthChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
        });
        setAuthError(null);
        setAuthSuccess('¡Sesión activa! Tu reserva se asociará automáticamente a tu cuenta.');

        try {
          if (session.user.email) {
            localStorage.setItem('novainn_guest_email', session.user.email);
            const raw = localStorage.getItem('novainn_saved_codes');
            const list: string[] = raw ? JSON.parse(raw) : [];
            if (!list.includes(reservationCode)) {
              list.unshift(reservationCode);
              localStorage.setItem('novainn_saved_codes', JSON.stringify(list));
            }

            await supabase
              .from('guests')
              .update({ auth_user_id: session.user.id })
              .ilike('email', session.user.email);
          }
        } catch {
          // ignore
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [reservationCode]);

  // Enviar código / enlace de acceso al correo
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = authEmail.trim().toLowerCase();
    if (!targetEmail) {
      setAuthError('Por favor ingresa tu correo para enviarte el código de acceso.');
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError(null);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
        },
      });
      if (error) throw error;
      setOtpSent(true);
      setAuthSuccess(`¡Código enviado a ${targetEmail}! Revisa tu bandeja de entrada o spam.`);
    } catch (err: unknown) {
      console.error('Error enviando código:', err);
      setAuthError(err instanceof Error ? err.message : 'Error al enviar código');
    } finally {
      setAuthLoading(false);
    }
  };

  // Verificar código de 6 dígitos ingresado
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setAuthError('Ingresa el código de 6 dígitos que te enviamos.');
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError(null);
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email: authEmail.trim().toLowerCase(),
        token: otpCode.trim(),
        type: 'email',
      });
      if (error) throw error;
      if (data.user) {
        setCurrentUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
        });
        setAuthSuccess('¡Sesión verificada! Tu reserva ha quedado vinculada a tu cuenta.');
      }
    } catch (err: unknown) {
      console.error('Error verificando código:', err);
      setAuthError('Código incorrecto o expirado. Por favor, solicita uno nuevo.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Iniciar sesión con contraseña tradicional
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword) {
      setAuthError('Ingresa tu correo y contraseña.');
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError(null);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim().toLowerCase(),
        password: authPassword,
      });
      if (error) throw error;
      if (data.user) {
        setCurrentUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
        });
        setAuthSuccess('¡Sesión iniciada con éxito!');
      }
    } catch (err: unknown) {
      console.error('Error al iniciar sesión:', err);
      setAuthError('Correo o contraseña incorrectos. Si no tienes contraseña, pulsa "Código a mi Correo".');
    } finally {
      setAuthLoading(false);
    }
  };

  // Crear cuenta rápida con contraseña
  const handleQuickRegister = async () => {
    if (!authEmail.trim() || !authPassword) {
      setAuthError('Ingresa tu correo y una contraseña para crear tu cuenta.');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError(null);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: authEmail.trim().toLowerCase(),
        password: authPassword,
        options: {
          data: {
            full_name: guestName || undefined,
          },
        },
      });
      if (error) throw error;
      if (data.session?.user) {
        setCurrentUser({
          id: data.session.user.id,
          email: data.session.user.email,
          name: guestName || data.session.user.email?.split('@')[0],
        });
        setAuthSuccess('¡Cuenta creada y sesión iniciada! Reserva vinculada.');
      } else {
        setAuthSuccess('¡Cuenta registrada! Te hemos enviado un correo de confirmación.');
      }
    } catch (err: unknown) {
      console.error('Error al crear cuenta:', err);
      setAuthError(err instanceof Error ? err.message : 'Error al registrar usuario');
    } finally {
      setAuthLoading(false);
    }
  };

  // Cronómetro de 15 minutos
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number; isExpired: boolean }>({
    minutes: 15,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const expiry = new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ minutes, seconds, isExpired: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleVoucherUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setUploadError('Para finalizar el pago y que tu reserva quede guardada en tu cuenta, debes iniciar sesión arriba con tu correo o código.');
      const el = document.getElementById('auth-verification-box');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!operationNumber.trim()) {
      setUploadError('Por favor ingresa el número de operación del pago.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('reservationId', reservationId);
      formData.append('reservationCode', reservationCode);
      formData.append(
        'paymentMethod',
        activeTab === 'yape'
          ? 'yape'
          : activeTab === 'plin'
          ? 'plin'
          : activeTab === 'transferencia'
          ? 'transferencia_bancaria'
          : 'tarjeta_credito_debito'
      );
      formData.append('operationNumber', operationNumber.trim());
      formData.append('amount', totalAmount.toString());

      // La imagen de comprobante es 100% opcional
      if (selectedFile) {
        formData.append('voucherFile', selectedFile);
      }

      const res = await fetch('/api/guest/payments', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Error al procesar el pago');
      }

      onPaymentSubmitted({
        method: activeTab,
        operationNumber: operationNumber.trim(),
      });
    } catch (err: unknown) {
      console.error('Error al procesar comprobante:', err);
      setUploadError(err instanceof Error ? err.message : 'Error al procesar el pago');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Cronómetro Regresivo - Estilo iOS Dynamic Island / Apple Timer */}
      <div
        className={`apple-glass-card rounded-[28px] p-4 sm:p-5 flex items-center justify-between shadow-2xl relative overflow-hidden transition-all ${
          timeLeft.isExpired
            ? 'border-rose-500/40 bg-rose-500/10'
            : 'border-blue-500/30'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              timeLeft.isExpired
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-blue-500/15 border-blue-500/30 text-blue-400 shadow-[0_0_20px_rgba(10,132,255,0.25)]'
            }`}
          >
            {timeLeft.isExpired ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Clock className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  timeLeft.isExpired ? 'text-rose-400' : 'text-blue-400'
                }`}
              >
                {timeLeft.isExpired ? 'Bloqueo Expirado' : 'Habitación Bloqueada'}
              </span>
              {!timeLeft.isExpired && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-slate-300 font-medium">
                  15 min hold
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {timeLeft.isExpired
                ? 'El tiempo para completar el pago ha concluido. La habitación puede haberse liberado.'
                : 'Completa tu pago y adjunta tu constancia antes de que el contador llegue a cero.'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 pl-3">
          <span
            className={`font-mono text-2xl sm:text-3xl font-black tracking-tight ${
              timeLeft.isExpired
                ? 'text-rose-400'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-300'
            }`}
          >
            {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Tiempo Restante</p>
        </div>
      </div>

      {/* Selector de Medios de Pago - iOS Segmented Control */}
      <div className="p-1.5 rounded-2xl bg-black/40 border border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-1.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('yape')}
          className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'yape'
              ? 'bg-[#730D88] text-white shadow-lg shadow-[#730D88]/30 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Yape</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plin')}
          className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'plin'
              ? 'bg-[#00D4B2] text-slate-950 shadow-lg shadow-[#00D4B2]/30 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Plin</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transferencia')}
          className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'transferencia'
              ? 'apple-button-gold text-slate-950 shadow-lg scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Transferencia</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tarjeta')}
          className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'tarjeta'
              ? 'apple-button-accent text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Tarjeta</span>
        </button>
      </div>

      {/* Contenido del Medio de Pago */}
      <div className="apple-glass-card rounded-[32px] p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* macOS Window Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="macos-dot macos-dot-red" />
            <span className="macos-dot macos-dot-yellow" />
            <span className="macos-dot macos-dot-green" />
          </div>
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
            Pasarela de Pago Segura • Nova Inn
          </span>
          <div className="w-12" />
        </div>

        {/* ============================================================ */}
        {/* SECCIÓN OBLIGATORIA: IDENTIFICACIÓN Y VINCULACIÓN DE CUENTA  */}
        {/* ============================================================ */}
        {currentUser ? (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    {currentUser.name || currentUser.email}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                    Sesión Activa
                  </span>
                </div>
                <p className="text-emerald-300/80 text-[11px] mt-0.5">
                  Esta reserva ({reservationCode}) quedará guardada permanentemente en tu cuenta ({currentUser.email}).
                </p>
              </div>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 self-start sm:self-auto bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              <Check className="w-4 h-4" />
              <span>Cuenta Vinculada</span>
            </span>
          </div>
        ) : (
          <div
            id="auth-verification-box"
            className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-blue-950/40 border-2 border-amber-500/40 shadow-2xl space-y-4 relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Inicia sesión para terminar tu pago</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Requerido
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Para que tu pago quede registrado y tu reserva se guarde en tu perfil de cliente, identifícate en segundos.
                  </p>
                </div>
              </div>
            </div>

            {/* Pestañas de método de acceso */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setAuthMethod('otp')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMethod === 'otp'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Código a mi Correo</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('password')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMethod === 'password'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Con Contraseña</span>
              </button>
            </div>

            {/* Formulario OTP (Código / Enlace a correo) */}
            {authMethod === 'otp' && (
              <div className="space-y-3 pt-1">
                {!otpSent ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Correo Electrónico del Huésped
                      </label>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={authLoading}
                      className="apple-button-accent w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {authLoading ? (
                        <span>Enviando código...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Código / Enlace a mi Correo</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25 text-xs text-sky-200">
                      <p className="font-semibold">¡Te enviamos un código de 6 dígitos a <span className="text-white underline">{authEmail}</span>!</p>
                      <p className="text-[11px] text-sky-300/80 mt-0.5">Ingrésalo aquí abajo o abre el enlace que te llegó al correo.</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={8}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="Código de 6 dígitos"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/20 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={authLoading}
                        className="apple-button-gold px-4 py-2.5 rounded-xl text-xs font-bold uppercase cursor-pointer disabled:opacity-50"
                      >
                        {authLoading ? 'Verificando...' : 'Ingresar'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={authLoading}
                      className="text-[11px] text-slate-400 hover:text-white underline block mx-auto cursor-pointer"
                    >
                      ¿No te llegó? Reenviar código
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Formulario Contraseña */}
            {authMethod === 'password' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handlePasswordLogin}
                    disabled={authLoading}
                    className="apple-button-accent py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Iniciar Sesión</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickRegister}
                    disabled={authLoading}
                    className="apple-pill-btn py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Crear Cuenta</span>
                  </button>
                </div>
              </div>
            )}

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
                {authError}
              </div>
            )}

            {authSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{authSuccess}</span>
              </div>
            )}
          </div>
        )}

        {/* PAGO CON YAPE O PLIN */}
        {(activeTab === 'yape' || activeTab === 'plin') && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
              <div className="text-center sm:text-left space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  {activeTab === 'yape' ? 'Billetera Digital Yape' : 'Billetera Digital Plin'}
                </span>
                <h4 className="text-2xl font-black text-white tracking-tight">
                  Transfiere <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-300">{formatCurrency(totalAmount)}</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Titular autorizado: <strong className="text-slate-200">{activeTab === 'yape' ? DEFAULT_HOTEL_INFO.yape_holder_name : DEFAULT_HOTEL_INFO.plin_holder_name}</strong>
                </p>

                {/* Número con botón Copiar al toque */}
                <div className="pt-2 flex items-center gap-2 justify-center sm:justify-start">
                  <div className="px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-sm font-mono font-bold text-white shadow-inner">
                    {activeTab === 'yape' ? DEFAULT_HOTEL_INFO.yape_phone_number : DEFAULT_HOTEL_INFO.plin_phone_number}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        activeTab === 'yape' ? DEFAULT_HOTEL_INFO.yape_phone_number || '' : DEFAULT_HOTEL_INFO.plin_phone_number || '',
                        'wallet-phone'
                      )
                    }
                    className="apple-pill-btn flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer active:scale-95 transition-all"
                  >
                    {copiedField === 'wallet-phone' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-slate-200">Copiar Número</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Código QR Ilustrativo estilo Apple Card */}
              <div className="flex flex-col items-center p-4 rounded-3xl bg-white text-slate-950 shadow-2xl shrink-0 border border-white/20">
                <QrCode className="w-32 h-32 text-slate-900" />
                <span className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-wider">
                  Escanea con {activeTab === 'yape' ? 'Yape' : 'Plin'}
                </span>
              </div>
            </div>

            {/* Formulario de Carga de Comprobante */}
            <form onSubmit={handleVoucherUpload} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Número de Operación de {activeTab === 'yape' ? 'Yape' : 'Plin'} *
                </label>
                <input
                  type="text"
                  placeholder="Ej. 849201"
                  value={operationNumber}
                  onChange={(e) => setOperationNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono placeholder:text-slate-600 transition-all"
                  required
                />
              </div>

              {/* AirDrop style file dropzone */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Subir Captura de Pantalla / Comprobante
                  </label>
                  <span className="text-[10px] text-sky-400 font-semibold bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                    Opcional
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Si no tienes la imagen a la mano, con solo ingresar el número de operación arriba tu pago será verificado.
                </p>
                <div className="p-4 rounded-2xl border-2 border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-xs text-emerald-400 flex items-center justify-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Archivo seleccionado: {selectedFile.name}</span>
                    </p>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  {uploadError}
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="apple-button-accent w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {uploading ? (
                  <span>Verificando y enviando comprobante...</span>
                ) : !currentUser ? (
                  <>
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Identifícate arriba para Confirmar Pago</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Confirmar y Enviar Comprobante</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* PAGO CON TRANSFERENCIA BANCARIA */}
        {activeTab === 'transferencia' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                Cuentas Bancarias Oficiales en Soles (S/)
              </span>
              <p className="text-xs text-slate-400">
                Realiza la transferencia desde la app de tu banco o ventanilla y adjunta tu constancia.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {DEFAULT_HOTEL_INFO.bank_accounts.map((acc) => (
                <div
                  key={acc.account_number}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2 hover:border-white/[0.15] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{acc.bank}</span>
                    <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                      Soles (PEN)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">N.° de Cuenta:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white font-semibold">{acc.account_number}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(acc.account_number, `acc-${acc.account_number}`)}
                        className="apple-pill-btn p-1.5 rounded-lg text-slate-300 hover:text-white"
                        title="Copiar número de cuenta"
                      >
                        {copiedField === `acc-${acc.account_number}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Código CCI:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white font-semibold">{acc.cci}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(acc.cci, `cci-${acc.cci}`)}
                        className="apple-pill-btn p-1.5 rounded-lg text-slate-300 hover:text-white"
                        title="Copiar CCI"
                      >
                        {copiedField === `cci-${acc.cci}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-white/[0.06]">
                    Titular: <strong className="text-slate-200">{acc.holder}</strong>
                  </p>
                </div>
              ))}
            </div>

            {/* Formulario de comprobante bancario */}
            <form onSubmit={handleVoucherUpload} className="space-y-4 pt-4 border-t border-white/[0.08]">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Número de Operación Bancaria *
                </label>
                <input
                  type="text"
                  placeholder="Ej. 104928"
                  value={operationNumber}
                  onChange={(e) => setOperationNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono placeholder:text-slate-600 transition-all"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Subir Voucher o Constancia en PDF/Imagen
                  </label>
                  <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Opcional
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Si no tienes la imagen a la mano, con solo ingresar el número de operación arriba tu pago será verificado.
                </p>
                <div className="p-4 rounded-2xl border-2 border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-xs text-emerald-400 flex items-center justify-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Archivo: {selectedFile.name}</span>
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="apple-button-gold w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {uploading ? (
                  'Enviando comprobante...'
                ) : !currentUser ? (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-900" />
                    <span>Identifícate arriba para Confirmar</span>
                  </span>
                ) : (
                  'Confirmar Transferencia'
                )}
              </button>
            </form>
          </div>
        )}

        {/* PAGO CON TARJETA DE CRÉDITO/DÉBITO */}
        {activeTab === 'tarjeta' && (
          <div className="space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                Tarjeta de Crédito o Débito
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Aceptamos Visa, Mastercard, American Express y Diners Club. Confirmación automática inmediata.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Número de Tarjeta
                </label>
                <input
                  type="text"
                  placeholder="4557 •••• •••• ••••"
                  maxLength={19}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Vencimiento (MM/AA)
                  </label>
                  <input
                    type="text"
                    placeholder="12/28"
                    maxLength={5}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    placeholder="•••"
                    maxLength={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-300 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cifrado SSL conforme a PCI-DSS nivel bancario. Jamás almacenamos datos de tu tarjeta.</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  setUploadError('Para pagar y que tu reserva quede guardada en tu cuenta, debes identificarte arriba.');
                  const el = document.getElementById('auth-verification-box');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  return;
                }
                onPaymentSubmitted({
                  method: 'tarjeta_credito_debito',
                  operationNumber: `AUTH-${Date.now().toString().slice(-6)}`,
                });
              }}
              className="apple-button-accent w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {!currentUser ? (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Identifícate arriba para Pagar</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pagar {formatCurrency(totalAmount)}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
