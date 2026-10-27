'use client';

import { useState, useEffect, useCallback } from 'react';
import OccupancyCalendarRealtime from '@/components/admin/OccupancyCalendarRealtime';
import WalkInBookingModal from '@/components/admin/WalkInBookingModal';
import { createClient } from '@/lib/supabase/client';
import { formatDateOnly } from '@/lib/utils/dates';
import {
  LogIn,
  LogOut,
  CreditCard,
  Percent,
  Plus,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/currency';

export default function ReceptionDashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    checkIns: 0,
    checkInsPending: 0,
    checkOuts: 0,
    pendingVouchers: 0,
    occupiedRooms: 0,
    totalRooms: 7,
  });

  const loadKpis = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const today = formatDateOnly(new Date());

      // 1. Check-ins de hoy
      const { count: checkInsTotal } = await supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('check_in_date', today)
        .in('status', ['confirmada', 'pago_en_verificacion']);

      const { count: checkInsPending } = await supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('check_in_date', today)
        .is('checked_in_at', null)
        .in('status', ['confirmada', 'pago_en_verificacion']);

      // 2. Check-outs de hoy
      const { count: checkOutsTotal } = await supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('check_out_date', today);

      // 3. Vouchers pendientes de verificación
      const { count: pendingVouchersTotal } = await supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'en_verificacion');

      // 4. Ocupación real
      const { count: occupiedCount } = await supabase
        .from('rooms')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('housekeeping_status', 'ocupada');

      const { count: totalRoomsCount } = await supabase
        .from('rooms')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      setStats({
        checkIns: checkInsTotal || 0,
        checkInsPending: checkInsPending || 0,
        checkOuts: checkOutsTotal || 0,
        pendingVouchers: pendingVouchersTotal || 0,
        occupiedRooms: occupiedCount || 0,
        totalRooms: totalRoomsCount || 7,
      });
    } catch (err) {
      console.error('Error al cargar métricas del Dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKpis();
  }, [loadKpis, refreshKey]);

  const occupancyRate = stats.totalRooms > 0 
    ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) 
    : 0;

  // KPIs reales desde Supabase
  const kpis = [
    {
      title: 'Llegadas de Hoy (Check-Ins)',
      value: stats.checkIns.toString(),
      sub: stats.checkInsPending > 0 ? `${stats.checkInsPending} pendientes de ingreso` : 'Sin llegadas pendientes',
      icon: LogIn,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      title: 'Salidas de Hoy (Check-Outs)',
      value: stats.checkOuts.toString(),
      sub: stats.checkOuts > 0 ? `${stats.checkOuts} habitaciones pasarán a limpieza` : 'Sin salidas programadas hoy',
      icon: LogOut,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      title: 'Vouchers por Verificar',
      value: stats.pendingVouchers.toString(),
      sub: stats.pendingVouchers > 0 ? 'Yape / Plin pendientes de revisión' : 'Al día, 0 comprobantes pendientes',
      icon: CreditCard,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      actionHref: '/admin/pagos',
    },
    {
      title: 'Ocupación Actual',
      value: `${occupancyRate}%`,
      sub: `${stats.occupiedRooms} de ${stats.totalRooms} habitaciones ocupadas`,
      icon: Percent,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Encabezado del Dashboard estilo macOS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold tracking-wider text-sky-400 uppercase">
              Control Operativo en Vivo
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Dashboard de Recepción
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setRefreshKey((k) => k + 1);
            }}
            disabled={loading}
            className="apple-pill-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-slate-300 hover:text-white font-medium text-xs active:scale-95 transition-all cursor-pointer"
            title="Actualizar datos en vivo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            id="admin-tour-nueva-reserva"
            type="button"
            onClick={() => setModalOpen(true)}
            className="apple-button-accent flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide active:scale-95 transition-all cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva Reserva</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI estilo iOS Control Center */}
      <div id="admin-tour-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="apple-glass-card p-5 rounded-[22px] flex flex-col justify-between hover:border-white/20 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                  {kpi.title}
                </span>
                <div className={`p-2.5 rounded-2xl border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <span className="text-3xl font-bold text-white tracking-tight font-mono">{kpi.value}</span>
                <p className="text-[11px] text-slate-400 mt-1">{kpi.sub}</p>
              </div>

              {kpi.actionHref ? (
                <Link
                  href={kpi.actionHref}
                  className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <span>Revisar comprobantes</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
                  <span>Actualizado en vivo</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400/80" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Calendario de Ocupación en Tiempo Real */}
      <div id="admin-tour-calendar">
        <OccupancyCalendarRealtime key={refreshKey} />
      </div>

      {/* Modal de Reserva Walk-in */}
      <WalkInBookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}
