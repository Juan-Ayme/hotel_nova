'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Hotel,
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  BedDouble,
  FileSpreadsheet,
  LogOut,
  User,
  ExternalLink,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import AdminInteractiveTourGuide from '@/components/admin/AdminInteractiveTourGuide';

interface AdminSidebarProps {
  userEmail: string;
  fullName: string;
  avatarUrl: string | null;
  role: 'recepcionista' | 'administrador';
}

export default function AdminSidebar({
  userEmail,
  fullName,
  avatarUrl,
  role,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [adminTutorialOpen, setAdminTutorialOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login?alerta=sesion_cerrada';
    } catch (err) {
      console.error('Error cerrando sesión:', err);
      window.location.href = '/login';
    }
  };

  // Auto-mostrar mini tutorial al personal la primera vez que entra
  useEffect(() => {
    const seen = localStorage.getItem('novainn_admin_interactive_tour_seen');
    if (!seen) {
      const timer = setTimeout(() => {
        setAdminTutorialOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const NAV_ITEMS = [
    {
      href: '/admin',
      label: 'Dashboard Recepción',
      icon: LayoutDashboard,
      adminOnly: false,
      tourId: 'admin-tour-nav-dashboard',
    },
    {
      href: '/admin/reservas',
      label: 'Gestión de Reservas',
      icon: CalendarDays,
      adminOnly: false,
      tourId: 'admin-tour-nav-reservas',
    },
    {
      href: '/admin/pagos',
      label: 'Verificar Pagos (Yape/Plin)',
      icon: CreditCard,
      adminOnly: false,
      tourId: 'admin-tour-nav-pagos',
    },
    {
      href: '/admin/habitaciones',
      label: 'Habitaciones & Limpieza',
      icon: BedDouble,
      adminOnly: true,
      tourId: 'admin-tour-nav-habitaciones',
    },
    {
      href: '/admin/reportes',
      label: 'Reportes & Auditoría',
      icon: FileSpreadsheet,
      adminOnly: true,
      tourId: 'admin-tour-nav-reportes',
    },
  ];

  return (
    <>
      <aside className="w-64 bg-slate-950/95 backdrop-blur-3xl text-slate-300 flex flex-col justify-between border-r border-white/10 shrink-0 min-h-screen relative z-30 select-none shadow-2xl">
        <div>
          {/* macOS Window Controls (Traffic Lights) */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <div className="flex items-center gap-2">
              <span className="macos-dot macos-dot-red hover:opacity-80 transition-opacity" title="Cerrar" />
              <span className="macos-dot macos-dot-yellow hover:opacity-80 transition-opacity" title="Minimizar" />
              <span className="macos-dot macos-dot-green hover:opacity-80 transition-opacity" title="Maximizar" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">macOS</span>
          </div>

          {/* Cabecera con Logotipo */}
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 shadow-md shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center">
                <Hotel className="w-4 h-4 text-sky-400" />
              </div>
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold tracking-tight text-white block truncate">
                Nova Inn OS
              </span>
              <span className="text-[10px] font-medium tracking-wide text-sky-400/90 block">
                Control Operativo
              </span>
            </div>
          </div>

          {/* Perfil del Trabajador Autenticado estilo Apple ID */}
          <div className="p-3 mx-3 mt-3 rounded-2xl bg-slate-900/90 border border-white/10 backdrop-blur-xl flex items-center gap-3 shadow-md">
            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-800 shrink-0 ring-1 ring-white/20">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={fullName} fill className="object-cover" />
              ) : (
                <User className="w-5 h-5 text-sky-400 m-auto mt-2" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-white truncate">{fullName || userEmail.split('@')[0]}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    role === 'administrador'
                      ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                  }`}
                >
                  {role}
                </span>
              </div>
            </div>
          </div>

          {/* Menú de Navegación macOS */}
          <div className="px-5 pt-5 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Aplicaciones
            </span>
          </div>
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              if (item.adminOnly && role !== 'administrador') return null;
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  id={item.tourId}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer del Sidebar con Botones estilo Mac */}
        <div className="p-3 border-t border-white/[0.06] space-y-2">
          {/* Botón de Guía del Sistema */}
          <button
            type="button"
            onClick={() => setAdminTutorialOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-white text-xs font-semibold transition-colors border border-sky-500/25 cursor-pointer shadow-xs"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guía de Operación</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition-colors border border-white/[0.06]"
          >
            <span>Sitio Web Público</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 text-rose-300 text-xs font-medium transition-colors border border-rose-500/20 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
          </button>
        </div>
      </aside>

      {/* Guía Interactiva con Burbujas para Administración */}
      <AdminInteractiveTourGuide
        isOpen={adminTutorialOpen}
        onClose={() => setAdminTutorialOpen(false)}
      />
    </>
  );
}
