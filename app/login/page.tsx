import Link from 'next/link';
import EmailAuthForm from '@/components/auth/EmailAuthForm';
import { Hotel, ShieldCheck, ArrowLeft, Lock } from 'lucide-react';

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string; alerta?: string; role?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isDirectStaff = params.role === 'admin' || (params.next && params.next.startsWith('/admin'));
  const next = params.next || (isDirectStaff ? '/admin' : '/mis-reservas');
  const error = params.error;
  const alerta = params.alerta;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070b12] via-[#0c121d] to-[#080d16] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden select-none">
      {/* Luces y ambientación estilo macOS */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <Link
          href="/"
          className="apple-pill-btn inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs text-slate-300 hover:text-white transition-all mb-6 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="apple-glass rounded-[32px] p-7 sm:p-9 shadow-2xl border border-white/[0.12] space-y-6">
          {/* macOS Window Controls */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <span className="macos-dot macos-dot-red" />
              <span className="macos-dot macos-dot-yellow" />
              <span className="macos-dot macos-dot-green" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              {isDirectStaff ? 'Staff Portal • Hotel Nova Inn' : 'Portal de Huéspedes • Nova Inn'}
            </span>
          </div>

          <div className="text-center pt-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-500 p-0.5 shadow-xl shadow-blue-500/20 flex items-center justify-center mb-3">
              <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center">
                <Hotel className="w-7 h-7 text-sky-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {isDirectStaff ? 'Portal de Personal' : 'Mi Cuenta Nova Inn'}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              {isDirectStaff
                ? 'Acceso para recepción, limpieza y gerencia'
                : 'Inicia sesión para gestionar tus reservas o regístrate en segundos'}
            </p>
          </div>

          {alerta === 'sesion_cerrada' && (
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/25 p-3 text-xs text-emerald-300 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Tu sesión se ha cerrado correctamente.</span>
            </div>
          )}

          {alerta === 'restablecer_password' && (
            <div className="rounded-xl bg-blue-500/15 border border-blue-500/25 p-3 text-xs text-blue-300 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Revisa tu correo para completar el cambio de contraseña.</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-500/25 p-3 text-xs text-rose-300">
              {error === 'enlace_invalido_o_expirado'
                ? 'El enlace de acceso ha expirado o ya fue utilizado. Por favor, solicita uno nuevo.'
                : 'Ocurrió un error al procesar tu acceso. Intenta nuevamente.'}
            </div>
          )}

          <div>
            <EmailAuthForm nextUrl={next} initialRole={isDirectStaff ? 'staff' : 'guest'} />
          </div>

          <div className="pt-4 border-t border-white/[0.06] text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Plataforma segura y protegida</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
