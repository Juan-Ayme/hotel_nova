'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Hotel, Menu, X, User, CalendarDays } from 'lucide-react';
import Image from 'next/image';
import ThemeToggle from '@/components/public/ThemeToggle';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/habitaciones', label: 'Habitaciones' },
  { href: '/reservaciones', label: 'Reservaciones' },
  { href: '/mis-reservas', label: 'Mis Reservas' },
  { href: '/contacto', label: 'Contacto' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string; avatar_url?: string } } | null>(null);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-3 pb-2 transition-all duration-300">
      <div
        className={`max-w-7xl mx-auto rounded-full transition-all duration-300 px-4 sm:px-6 ${
          scrolled
            ? 'apple-dock shadow-2xl py-2'
            : 'apple-glass py-2.5'
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
              return (
                <Link
                  key={link.href}
                  href={link.href}
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

          {/* Acciones de la Derecha estilo Apple */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Conmutador de Modo Oscuro / Modo Claro */}
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-2">
                {isStaff && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-[11px] font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-500/25 transition-colors"
                  >
                    <span>Panel Staff</span>
                  </Link>
                )}
                <Link
                  href="/mis-reservas"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-white/[0.04] border border-stone-200 dark:border-white/[0.08] text-xs text-stone-800 dark:text-stone-200 hover:border-orange-500/30 transition-colors"
                >
                  {user.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      width={22}
                      height={22}
                      className="rounded-full ring-1 ring-orange-500"
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 text-orange-600 dark:text-amber-400" />
                  )}
                  <span className="max-w-[100px] truncate font-medium text-[11px]">
                    {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                </Link>
                <Link
                  href="/auth/signout"
                  className="text-xs text-stone-500 dark:text-stone-400 hover:text-rose-500 px-2 py-1 transition-colors"
                  title="Cerrar sesión"
                >
                  Salir
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="apple-pill-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white transition-all"
              >
                <User className="w-3.5 h-3.5 text-orange-600 dark:text-amber-400" />
                <span>Ingresar / Registrarse</span>
              </Link>
            )}

            <Link
              href="/reservaciones"
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
              className="apple-button-accent px-3 py-1.5 rounded-full font-semibold text-xs"
            >
              Reservar
            </Link>
            <button
              type="button"
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

          <div className="pt-3 border-t border-stone-200 dark:border-white/[0.08] flex flex-col gap-2">
            {user ? (
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-stone-100/70 dark:bg-white/[0.03] border border-stone-200 dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-stone-800 dark:text-stone-200">
                    <User className="w-4 h-4 text-orange-600 dark:text-amber-400" />
                    <span className="font-medium truncate max-w-[180px]">{user.email}</span>
                  </div>
                  <Link
                    href="/auth/signout"
                    className="text-xs text-rose-500 font-semibold px-2 py-1"
                  >
                    Salir
                  </Link>
                </div>
                {isStaff && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-1.5 px-3 rounded-lg bg-orange-500/15 text-orange-700 dark:text-orange-400 font-bold text-xs"
                  >
                    Panel Administrativo (Staff)
                  </Link>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="apple-pill-btn flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-stone-800 dark:text-stone-200 text-xs font-semibold"
              >
                <User className="w-4 h-4 text-orange-600 dark:text-amber-400" />
                <span>Ingresar / Registrarse</span>
              </Link>
            )}

            <Link
              href="/reservaciones"
              onClick={() => setMobileMenuOpen(false)}
              className="apple-button-accent flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-xs tracking-wide"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Reservar Habitación</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
