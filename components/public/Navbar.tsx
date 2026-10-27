'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Hotel,
  Menu,
  X,
  User,
  CalendarDays,
  LayoutDashboard,
  FileText,
  LogOut,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';
import Image from 'next/image';
import ThemeToggle from '@/components/public/ThemeToggle';
import InteractiveTourGuide from '@/components/public/InteractiveTourGuide';

// Enlaces públicos oficiales (Mis Reservas se traslada al menú privado de usuario)
const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/habitaciones', label: 'Habitaciones' },
  { href: '/reservaciones', label: 'Reservaciones' },
  { href: '/contacto', label: 'Contacto' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{
    email?: string;
    user_metadata?: { full_name?: string; avatar_url?: string };
  } | null>(null);
  const [isStaff, setIsStaff] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Auto-mostrar tour interactivo guiado con burbujas a visitantes por primera vez
  useEffect(() => {
    const seen = localStorage.getItem('novainn_interactive_tour_seen');
    if (!seen) {
      const timer = setTimeout(() => {
        setTutorialOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Cerrar menú desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar menús al cambiar de página
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Detección de scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Suscripción al estado de autenticación y rol de staff
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user?.email) {
        const { data: staff } = await supabase
          .from('staff_profiles')
          .select('id, is_active')
          .ilike('google_email', data.user.email)
          .single();
        if (staff && staff.is_active) {
          setIsStaff(true);
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        const { data: staff } = await supabase
          .from('staff_profiles')
          .select('id, is_active')
          .ilike('google_email', session.user.email)
          .single();
        setIsStaff(!!(staff && staff.is_active));
      } else {
        setIsStaff(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-3 pb-2 transition-all duration-300">
        <div
          className={`max-w-7xl mx-auto rounded-full transition-all duration-300 px-4 sm:px-6 ${
            scrolled ? 'apple-dock shadow-2xl py-2' : 'apple-glass py-2.5'
          }`}
        >
          <div className="flex items-center justify-between h-14">
            {/* Logotipo con paleta Terracota y Cobre Cálido */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-500 p-0.5 shadow-md shadow-orange-600/20 group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full bg-stone-100 dark:bg-stone-950/90 rounded-[14px] flex items-center justify-center">
                  <Hotel className="w-5 h-5 text-orange-600 dark:text-amber-400" />
                </div>
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-stone-900 dark:text-white block">
                  Hotel Nova Inn
                </span>
                <span className="text-[9px] uppercase tracking-widest text-orange-700 dark:text-amber-400 font-semibold block">
                  Hospedaje & Confort
                </span>
              </div>
            </Link>

            {/* Menú de Escritorio estilo macOS Segmented Navigation */}
            <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-stone-200/50 dark:bg-white/[0.04] border border-stone-300/40 dark:border-white/[0.06]">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                const isHabitaciones = link.href === '/habitaciones';
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    id={isHabitaciones ? 'tour-nav-habitaciones' : undefined}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-stone-900 dark:text-white bg-white dark:bg-white/10 font-bold shadow-sm'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Acciones de la Derecha */}
            <div className="hidden sm:flex items-center gap-2.5">
              {/* Botón Tour Interactivo Guiado con Burbujas */}
              <button
                type="button"
                onClick={() => setTutorialOpen(true)}
                className="apple-pill-btn hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-orange-600 dark:hover:text-white transition-all cursor-pointer"
                title="Ver tour interactivo por la plataforma"
              >
                <HelpCircle className="w-3.5 h-3.5 text-orange-600 dark:text-amber-400" />
                <span>Tour guiado</span>
              </button>

              {/* Conmutador de Modo Oscuro / Modo Claro */}
              <ThemeToggle />

              {/* Usuario Autenticado con Dropdown Popover */}
              {user ? (
                <div className="relative" ref={userMenuRef} id="tour-user-menu">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                      userMenuOpen
                        ? 'bg-orange-500/15 border-orange-500/40 text-stone-900 dark:text-white shadow-md ring-2 ring-orange-500/20'
                        : 'bg-stone-100 dark:bg-white/[0.04] border-stone-200 dark:border-white/[0.08] text-stone-800 dark:text-stone-200 hover:border-orange-500/30'
                    }`}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    title="Opciones de cuenta"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt="Avatar"
                        width={22}
                        height={22}
                        className="rounded-full ring-1 ring-orange-500/60"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold">
                        {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="max-w-[110px] truncate font-medium text-xs">
                      {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                    </span>
                    {isStaff && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-orange-600 text-white shadow-xs">
                        Admin
                      </span>
                    )}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                        userMenuOpen ? 'rotate-180 text-orange-600 dark:text-orange-400' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Popover estilo Apple */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl apple-glass-card border border-stone-200 dark:border-white/[0.1] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-stone-900 dark:text-white">
                      {/* Tarjeta de Identificación */}
                      <div className="px-3 py-2.5 border-b border-stone-200/80 dark:border-white/[0.06]">
                        <p className="text-xs font-bold truncate">
                          {user.user_metadata?.full_name || 'Usuario'}
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                          {user.email}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 dark:bg-white/[0.06] border border-stone-200 dark:border-white/[0.08] text-stone-600 dark:text-stone-300">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isStaff ? 'bg-orange-500' : 'bg-emerald-500'
                            }`}
                          />
                          <span>{isStaff ? 'Personal Administrativo' : 'Huésped Registrado'}</span>
                        </div>
                      </div>

                      {/* Enlaces según Rol */}
                      <div className="py-1 space-y-0.5">
                        {/* Opción para Administrador / Staff */}
                        {isStaff && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-orange-700 dark:text-orange-400 hover:bg-orange-500/10 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Panel de Administración</span>
                          </Link>
                        )}

                        {/* Opción Mis Reservas (para cliente y admin) */}
                        <Link
                          href="/mis-reservas"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors"
                        >
                          <FileText className="w-4 h-4 text-orange-600 dark:text-amber-400" />
                          <span>Mis Reservas</span>
                        </Link>

                        {/* Mini Guía de Reserva */}
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setTutorialOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                        >
                          <HelpCircle className="w-4 h-4 text-orange-600 dark:text-amber-400" />
                          <span>¿Cómo funciona la reserva?</span>
                        </button>
                      </div>

                      {/* Salir */}
                      <div className="pt-1 mt-1 border-t border-stone-200/80 dark:border-white/[0.06]">
                        <Link
                          href="/auth/signout"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Cerrar Sesión</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  id="tour-user-menu"
                  className="apple-pill-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white transition-all"
                >
                  <User className="w-3.5 h-3.5 text-orange-600 dark:text-amber-400" />
                  <span>Ingresar</span>
                </Link>
              )}

              {/* Botón de Acción Principal */}
              <Link
                href="/reservaciones"
                id="tour-nav-reservar"
                className="apple-button-accent flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs tracking-wide shadow-md active:scale-95 transition-all"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Reservar</span>
              </Link>
            </div>

            {/* Botón de Menú Móvil */}
            <div className="flex sm:hidden items-center gap-2">
              <ThemeToggle />
              <Link
                href="/reservaciones"
                id="tour-mobile-reservar"
                className="apple-button-accent px-3 py-1.5 rounded-full font-semibold text-xs"
              >
                Reservar
              </Link>
              <button
                type="button"
                id="tour-mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-white/[0.08] cursor-pointer"
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Móvil estilo iOS */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 mx-auto max-w-7xl apple-dock rounded-[24px] p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <nav className="flex flex-col space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    id={link.href === '/habitaciones' ? 'tour-mobile-habitaciones' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-stone-900 dark:text-white bg-stone-200 dark:bg-white/10 font-bold'
                        : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Botón Guía en Móvil */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setTutorialOpen(true);
              }}
              className="apple-pill-btn flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-stone-800 dark:text-stone-200 text-xs font-semibold cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-orange-600 dark:text-amber-400" />
              <span>¿Cómo funciona la reserva? (Guía)</span>
            </button>

            <div className="pt-3 border-t border-stone-200 dark:border-white/[0.08] flex flex-col gap-2">
              {user ? (
                <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-stone-100/70 dark:bg-white/[0.03] border border-stone-200 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {user.user_metadata?.avatar_url ? (
                        <Image
                          src={user.user_metadata.avatar_url}
                          alt="Avatar"
                          width={28}
                          height={28}
                          className="rounded-full ring-1 ring-orange-500"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                          {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-xs text-stone-900 dark:text-white truncate max-w-[170px]">
                          {user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </p>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate max-w-[170px]">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/auth/signout"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs text-rose-500 font-semibold p-1 hover:underline"
                      title="Cerrar sesión"
                    >
                      Salir
                    </Link>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-200 dark:border-white/[0.06]">
                    {isStaff && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 py-2 px-3 rounded-xl bg-orange-500/15 text-orange-700 dark:text-orange-400 font-bold text-xs"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Panel de Administración (Staff)</span>
                      </Link>
                    )}

                    <Link
                      href="/mis-reservas"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 py-2 px-3 rounded-xl text-stone-800 dark:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-white/[0.06] text-xs font-medium"
                    >
                      <FileText className="w-4 h-4 text-orange-600 dark:text-amber-400" />
                      <span>Mis Reservas</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="apple-pill-btn flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-stone-800 dark:text-stone-200 text-xs font-semibold"
                >
                  <User className="w-4 h-4 text-orange-600 dark:text-amber-400" />
                  <span>Ingresar / Mi Cuenta</span>
                </Link>
              )}

              <Link
                href="/reservaciones"
                onClick={() => setMobileMenuOpen(false)}
                className="apple-button-accent flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-xs tracking-wide shadow-md"
              >
                <CalendarDays className="w-4 h-4" />
                <span>Reservar Habitación</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Tour Guiado Interactivo con Burbujas Apuntando a Componentes Clave */}
      <InteractiveTourGuide
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
      />
    </>
  );
}
