'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    setIsDark(isCurrentlyDark);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('nova_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('nova_theme', 'light');
    }
  };

  // Evita inconsistencias de renderizado en SSR inicial
  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 opacity-50" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative p-2 rounded-full border transition-all duration-300 cursor-pointer active:scale-90 bg-white/10 dark:bg-stone-800/80 border-stone-200/80 dark:border-stone-700/60 text-stone-700 dark:text-amber-400 hover:border-orange-500/50 shadow-sm"
      title={isDark ? 'Cambiar a Modo Claro (Arena Cálida)' : 'Cambiar a Modo Oscuro (Terracota Nocturno)'}
      aria-label="Alternar modo claro u oscuro"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-orange-600 animate-in spin-in-90 duration-300" />
      )}
    </button>
  );
}
