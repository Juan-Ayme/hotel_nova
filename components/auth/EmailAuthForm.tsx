'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Mail,
  KeyRound,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  User,
  Phone,
  Shield,
  UserPlus,
  LogIn,
} from 'lucide-react';

interface EmailAuthFormProps {
  nextUrl?: string;
  className?: string;
  initialRole?: 'guest' | 'staff';
}

export default function EmailAuthForm({
  nextUrl = '/mis-reservas',
  className = '',
  initialRole = 'guest',
}: EmailAuthFormProps) {
  const router = useRouter();

  // Modo Staff vs Huésped
  const [isStaff, setIsStaff] = useState<boolean>(initialRole === 'staff');

  // Modo Principal: 'login' (Ya tengo cuenta) vs 'register' (Crear cuenta)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Sub-método de Inicio de Sesión: 'password' | 'otp'
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  // Estados Formulario Inicio de Sesión
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpCode, setLoginOtpCode] = useState('');

  // Estados Formulario Registro (Crear Usuario)
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Estados Generales
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Redirección efectiva
  const targetDestination = isStaff ? '/admin' : nextUrl;

  // 1. INICIAR SESIÓN CON CONTRASEÑA (Para los que ya crearon cuenta)
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        router.push(targetDestination);
        router.refresh();
      }
    } catch (err: unknown) {
      console.error('Error al iniciar sesión:', err);
      setErrorMsg(
        'Correo o contraseña incorrectos. Si aún no te has registrado, selecciona "Crear Cuenta".'
      );
    } finally {
      setLoading(false);
    }
  };

  // 2. ENVIAR CÓDIGO O ENLACE MÁGICO (OTP)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      const { error } = await supabase.auth.signInWithOtp({
        email: loginEmail.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(targetDestination)}`,
        },
      });

      if (error) {
        throw error;
      }

      setLoginOtpSent(true);
      setSuccessMsg(`¡Acceso enviado a ${loginEmail.trim()}! Revisa tu bandeja de entrada o spam.`);
    } catch (err: unknown) {
      console.error('Error al enviar OTP:', err);
      const msg = err instanceof Error ? err.message : 'Error al conectar con el servicio de correo';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // 3. VALIDAR CÓDIGO OTP DE 6 DÍGITOS
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOtpCode.trim() || !loginEmail.trim()) return;

    try {
      setLoading(true);
      setErrorMsg(null);

      const supabase = createClient();

      let { data, error } = await supabase.auth.verifyOtp({
        email: loginEmail.trim().toLowerCase(),
        token: loginOtpCode.trim(),
        type: 'email',
      });

      if (error) {
        const signupVerify = await supabase.auth.verifyOtp({
          email: loginEmail.trim().toLowerCase(),
          token: loginOtpCode.trim(),
          type: 'signup',
        });
        if (!signupVerify.error) {
          data = signupVerify.data;
          error = null;
        }
      }

      if (error) {
        throw error;
      }

      if (data.session || data.user) {
        router.push(targetDestination);
        router.refresh();
      }
    } catch (err: unknown) {
      console.error('Error al verificar código:', err);
      setErrorMsg('Código incorrecto o expirado. Verifica los 6 dígitos o haz clic en el enlace del correo.');
    } finally {
      setLoading(false);
    }
  };

  // 4. CREAR CUENTA NUEVA (REGISTRO DE USUARIO)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword) return;

    if (regPassword.length < 6) {
      setErrorMsg('La contraseña debe tener un mínimo de 6 caracteres por seguridad.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Por favor, verifícalas con atención.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      const { data, error } = await supabase.auth.signUp({
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        options: {
          data: {
            full_name: regFullName.trim(),
            phone: regPhone.trim(),
          },
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(targetDestination)}`,
        },
      });

      if (error) {
        throw error;
      }

      // Si la sesión se creó de inmediato sin confirmación previa
      if (data.session) {
        router.push(targetDestination);
        router.refresh();
        return;
      }

      // Si Supabase envía correo de confirmación
      setRegSuccess(true);
      setSuccessMsg(
        `¡Cuenta creada exitosamente para ${regEmail.trim()}! Revisa tu correo electrónico para confirmar tu cuenta y poder ingresar.`
      );
    } catch (err: unknown) {
      console.error('Error al registrar cuenta:', err);
      const msg = err instanceof Error ? err.message : 'Error al registrar tu cuenta';
      if (msg.toLowerCase().includes('already registered')) {
        setErrorMsg('Este correo ya está registrado. Por favor, cambia a la opción "Iniciar Sesión".');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // 5. RECUPERAR CONTRASEÑA
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = loginEmail.trim() || regEmail.trim();
    if (!targetEmail) {
      setErrorMsg('Por favor ingresa tu correo electrónico para enviarte el enlace de recuperación.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail.toLowerCase(), {
        redirectTo: `${origin}/login?alerta=restablecer_password`,
      });

      if (error) throw error;
      setSuccessMsg(`Se ha enviado un enlace de recuperación a ${targetEmail}.`);
      setShowForgotPassword(false);
    } catch (err: unknown) {
      console.error('Error al recuperar:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Cabecera / Indicador de Modo Staff vs Huésped */}
      {isStaff && (
        <div className="mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Modo: Personal Administrativo / Staff</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsStaff(false);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-[11px] text-amber-400 underline hover:text-white transition-colors cursor-pointer"
          >
            ← Volver a Huéspedes
          </button>
        </div>
      )}

      {/* Selector Superior: INICIAR SESIÓN vs CREAR CUENTA */}
      {!isStaff && (
        <div className="flex rounded-2xl bg-black/40 p-1.5 mb-6 border border-white/[0.08] shadow-inner">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              authMode === 'login'
                ? 'apple-button-accent text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg(null);
              setSuccessMsg(null);
              setRegSuccess(false);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              authMode === 'register'
                ? 'apple-button-accent text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Cuenta</span>
          </button>
        </div>
      )}

      {/* Alertas Dinámicas */}
      {errorMsg && (
        <div className="mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && !regSuccess && (
        <div className="mb-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-start gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. SECCIÓN: INICIAR SESIÓN (Ya tienen cuenta)           */}
      {/* ======================================================== */}
      {(authMode === 'login' || isStaff) && (
        <div className="space-y-4">
          {/* Sub-selector: Contraseña vs Código OTP por correo */}
          <div className="flex rounded-xl bg-white/[0.03] p-1 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('password');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 px-3 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                loginMethod === 'password'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Con Contraseña
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('otp');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 px-3 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                loginMethod === 'otp'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Con Código / Enlace Mágico
            </button>
          </div>

          {/* Opción A: Contraseña */}
          {loginMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4 text-sky-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={isStaff ? 'admin.staff@novainn.com' : 'tu-correo@ejemplo.com'}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(!showForgotPassword)}
                    className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-sky-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                  />
                </div>
              </div>

              {showForgotPassword && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-2 animate-in fade-in">
                  <p className="text-slate-300">
                    Te enviaremos un correo para que puedas restablecer tu contraseña.
                  </p>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading || !loginEmail.trim()}
                    className="apple-button-accent py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Enviar correo de recuperación
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !loginEmail.trim() || !loginPassword}
                className="apple-button-accent w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Ingresar a Mi Cuenta</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Opción B: Código OTP / Magic Link */}
          {loginMethod === 'otp' && (
            <div>
              {!loginOtpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4 text-sky-400" />
                      </div>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="tu-correo@ejemplo.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Te enviaremos un código de 6 dígitos o enlace directo a tu correo. Sin contraseñas.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !loginEmail.trim()}
                    className="apple-button-accent w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar Código al Correo</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-3.5">
                  <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3.5 text-xs text-sky-200">
                    <div className="flex items-center gap-2 font-bold text-sky-300 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-sky-400" />
                      <span>Mensaje enviado a:</span>
                    </div>
                    <p className="text-white font-mono break-all">{loginEmail}</p>
                    <p className="mt-2 text-[11px] text-slate-300">
                      Haz clic en el enlace de tu correo o ingresa el código numérico:
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Código de 6 dígitos
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <KeyRound className="w-4 h-4 text-sky-400" />
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={8}
                          required
                          value={loginOtpCode}
                          onChange={(e) => setLoginOtpCode(e.target.value)}
                          placeholder="123456"
                          className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-center font-mono tracking-widest text-lg font-bold text-sky-400 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !loginOtpCode.trim()}
                      className="apple-button-accent w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Validar Código e Ingresar</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginOtpSent(false);
                        setLoginOtpCode('');
                        setErrorMsg(null);
                      }}
                      className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      ← Cambiar correo
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-sky-400 hover:text-sky-300 font-medium transition-colors cursor-pointer"
                    >
                      Reenviar correo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conmutador inferior para registrarse */}
          {!isStaff && (
            <div className="pt-3 border-t border-white/[0.06] text-center text-xs text-slate-400">
              <span>¿Todavía no tienes una cuenta? </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-sky-400 font-bold hover:underline cursor-pointer"
              >
                Crear cuenta nueva
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SECCIÓN: CREAR CUENTA NUEVA (Para nuevos usuarios)   */}
      {/* ======================================================== */}
      {authMode === 'register' && !isStaff && (
        <div>
          {!regSuccess ? (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre y Apellidos
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4 text-sky-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Ej. Juan Pérez Quispe"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4 text-sky-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="tu-correo@ejemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Teléfono / Celular (Opcional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4 text-sky-400" />
                  </div>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4 text-sky-400" />
                    </div>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mín. 6 caracteres"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4 text-sky-400" />
                    </div>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repite contraseña"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !regEmail.trim() || !regPassword || !regConfirmPassword}
                className="apple-button-accent w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs tracking-wide shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Crear Mi Cuenta de Huésped</span>
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-white/[0.06] text-center text-xs text-slate-400">
                <span>¿Ya tienes una cuenta creada? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-sky-400 font-bold hover:underline cursor-pointer"
                >
                  Iniciar sesión aquí
                </button>
              </div>
            </form>
          ) : (
            <div className="apple-glass rounded-2xl p-6 border border-white/[0.08] text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">
                ¡Cuenta creada con éxito!
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hemos enviado un correo a <span className="font-mono text-white font-bold">{regEmail}</span>. Revisa tu bandeja de entrada o spam para confirmar tu cuenta y luego inicia sesión.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLoginEmail(regEmail);
                    setRegSuccess(false);
                    setErrorMsg(null);
                  }}
                  className="apple-button-accent w-full py-2.5 px-4 rounded-xl font-semibold text-xs shadow-md cursor-pointer"
                >
                  Ir a Iniciar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. BOTÓN DISCRETO: ACCESO DE ADMINISTRACIÓN / STAFF       */}
      {/* ======================================================== */}
      {!isStaff && (
        <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
          <button
            type="button"
            onClick={() => {
              setIsStaff(true);
              setAuthMode('login');
              setLoginMethod('password');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-[11px] text-slate-400 hover:text-slate-200 transition-all cursor-pointer border border-white/[0.04]"
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Acceso de Personal y Recepción</span>
          </button>
        </div>
      )}
    </div>
  );
}
