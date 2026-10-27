'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { formatCurrency } from '@/lib/utils/currency';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  CreditCard,
  QrCode,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  FileText,
  Clock,
  RefreshCw,
  Layers,
  Percent,
  CheckCircle2,
  AlertCircle,
  Building,
  Smartphone,
  PhoneCall,
  Globe,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

interface ReportSummary {
  totalRecaudado: number;
  totalPendiente: number;
  totalReservas: number;
  ticketPromedio: number;
  occupancyRate: number;
  occupiedRooms: number;
  totalRooms: number;
}

interface PaymentMethodStat {
  label: string;
  count: number;
  total: number;
  color: string;
  percentage: number;
}

interface ChannelStat {
  label: string;
  count: number;
  total: number;
}

interface DayStat {
  date: string;
  dayName: string;
  amount: number;
  bookingsCount: number;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  staffEmail: string;
  action: string;
  table: string;
  ip: string;
}

export default function AdminReportesPage() {
  const [selectedRange, setSelectedRange] = useState<'hoy' | 'semana' | 'mes' | 'todo'>('mes');
  const [loading, setLoading] = useState(true);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const [summary, setSummary] = useState<ReportSummary>({
    totalRecaudado: 0,
    totalPendiente: 0,
    totalReservas: 0,
    ticketPromedio: 0,
    occupancyRate: 0,
    occupiedRooms: 0,
    totalRooms: 7,
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodStat[]>([]);
  const [channels, setChannels] = useState<ChannelStat[]>([]);
  const [last7Days, setLast7Days] = useState<DayStat[]>([]);
  const [statusSummary, setStatusSummary] = useState({
    confirmadas: 0,
    en_verificacion: 0,
    pendientes: 0,
    finalizadas: 0,
    canceladas: 0,
    total: 0,
  });
  const [roomStatusCounts, setRoomStatusCounts] = useState({
    disponible: 0,
    ocupada: 0,
    en_limpieza: 0,
    mantenimiento: 0,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditSearch, setAuditSearch] = useState('');

  // Carga de datos reales desde el backend
  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/reports?range=${selectedRange}`);
      const data = await res.json();

      if (data.success) {
        setSummary(data.summary);
        setPaymentMethods(data.paymentMethods || []);
        setChannels(data.channels || []);
        setLast7Days(data.last7Days || []);
        setStatusSummary(data.statusSummary || {});
        setRoomStatusCounts(data.roomStatusCounts || {});
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Error al cargar datos de reportes:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Cálculo del valor máximo para escalar el gráfico de barras
  const maxDayAmount = useMemo(() => {
    const max = Math.max(...last7Days.map((d) => d.amount), 1);
    return Math.ceil(max / 500) * 500 || 1000;
  }, [last7Days]);

  // Exportar a Excel con 3 hojas organizadas
  const handleExportExcel = () => {
    // Hoja 1: Resumen General
    const wsSummary = XLSX.utils.json_to_sheet([
      { Concepto: 'Total Recaudado (PEN)', Valor: formatCurrency(summary.totalRecaudado) },
      { Concepto: 'Pendiente de Cobro / Verificación (PEN)', Valor: formatCurrency(summary.totalPendiente) },
      { Concepto: 'Total de Reservas Registradas', Valor: summary.totalReservas },
      { Concepto: 'Ticket Promedio por Estadía', Valor: formatCurrency(summary.ticketPromedio) },
      { Concepto: 'Tasa de Ocupación Actual', Valor: `${summary.occupancyRate}% (${summary.occupiedRooms} de ${summary.totalRooms} habs)` },
    ]);

    // Hoja 2: Ingresos por Método de Pago
    const wsPayments = XLSX.utils.json_to_sheet(
      paymentMethods.map((p) => ({
        'Medio de Pago': p.label,
        'N.° Operaciones': p.count,
        'Total Recaudado (S/)': p.total,
        'Participación (%)': `${p.percentage}%`,
      }))
    );

    // Hoja 3: Canales de Venta
    const wsChannels = XLSX.utils.json_to_sheet(
      channels.map((c) => ({
        'Canal de Reserva': c.label,
        'Cantidad de Reservas': c.count,
        'Monto Total (S/)': c.total,
      }))
    );

    // Hoja 4: Bitácora de Auditoría
    const wsLogs = XLSX.utils.json_to_sheet(
      auditLogs.map((l) => ({
        'Fecha y Hora': l.timestamp,
        'Usuario Responsable': l.staffEmail,
        'Acción Efectuada': l.action,
        'Entidad Afectada': l.table,
        'Dirección IP': l.ip,
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Ejecutivo');
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Por Medio de Pago');
    XLSX.utils.book_append_sheet(wb, wsChannels, 'Por Canal');
    XLSX.utils.book_append_sheet(wb, wsLogs, 'Bitácora de Auditoría');

    XLSX.writeFile(wb, `Reporte_HotelNovaInn_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Filtrado de la bitácora
  const filteredLogs = useMemo(() => {
    if (!auditSearch.trim()) return auditLogs;
    const term = auditSearch.toLowerCase();
    return auditLogs.filter(
      (l) =>
        l.staffEmail.toLowerCase().includes(term) ||
        l.action.toLowerCase().includes(term) ||
        l.table.toLowerCase().includes(term)
    );
  }, [auditLogs, auditSearch]);

  return (
    <div className="space-y-8 select-none">
      {/* Encabezado Principal estilo macOS Titlebar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-widest text-sky-400 uppercase">
              Centro de Métricas Financieras y Auditoría
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Reportes y Rendimiento
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Datos en vivo de ocupación, ingresos en Soles (PEN) y bitácora del personal del Hotel Nova Inn.
          </p>
        </div>

        {/* Controles de Rango y Exportación */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Rango estilo macOS Segmented Control */}
          <div className="p-1 rounded-2xl bg-slate-900/90 border border-white/[0.08] flex items-center gap-1 shadow-inner">
            {(
              [
                { id: 'hoy', label: 'Hoy' },
                { id: 'semana', label: '7 Días' },
                { id: 'mes', label: 'Mes' },
                { id: 'todo', label: 'Histórico' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedRange(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedRange === tab.id
                    ? 'apple-button-accent text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Botón Refrescar */}
          <button
            type="button"
            onClick={fetchReportData}
            disabled={loading}
            className="apple-pill-btn p-2.5 rounded-2xl text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {/* Botón Exportar Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="apple-button-accent flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-xl cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* FILA 1: KPIs Ejecutivos con micro-indicadores visuales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Recaudado */}
        <div className="apple-glass-card rounded-[24px] p-5 border border-white/[0.08] shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Total Recaudado</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {formatCurrency(summary.totalRecaudado)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Verificado en cuentas oficiales</span>
            </div>
          </div>
          <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60" />
        </div>

        {/* KPI 2: Por Cobrar / En Verificación */}
        <div className="apple-glass-card rounded-[24px] p-5 border border-white/[0.08] shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Por Validar / Cobrar</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono tracking-tight">
              {formatCurrency(summary.totalPendiente)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{statusSummary.en_verificacion} pagos esperando verificación</span>
            </div>
          </div>
          <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400 opacity-60" />
        </div>

        {/* KPI 3: Ocupación Real */}
        <div className="apple-glass-card rounded-[24px] p-5 border border-white/[0.08] shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Tasa de Ocupación</span>
            <div className="p-2.5 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {summary.occupancyRate}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              <strong className="text-sky-400 font-semibold">{summary.occupiedRooms}</strong> de {summary.totalRooms} habitaciones ocupadas
            </div>
          </div>
          <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-blue-600 opacity-60" />
        </div>

        {/* KPI 4: Ticket Promedio */}
        <div className="apple-glass-card rounded-[24px] p-5 border border-white/[0.08] shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Ticket Promedio</span>
            <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {formatCurrency(summary.ticketPromedio)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              En <strong className="text-purple-300 font-semibold">{summary.totalReservas}</strong> reservas generadas
            </div>
          </div>
          <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-60" />
        </div>
      </div>

      {/* FILA 2: GRÁFICOS INTERACTIVOS (Barras de Ingresos + Donut de Métodos de Pago) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO 1: Evolución de Ingresos de los Últimos 7 Días (2 columnas en desktop) */}
        <div className="lg:col-span-2 apple-glass-card rounded-[28px] p-6 sm:p-7 border border-white/[0.08] shadow-2xl space-y-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="macos-dot macos-dot-red" />
                <span className="macos-dot macos-dot-yellow" />
                <span className="macos-dot macos-dot-green" />
                <h3 className="text-base font-bold text-white tracking-tight ml-1">
                  Evolución de Ingresos Diarios (PEN)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 ml-6">
                Montos recaudados por fecha en la última semana
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-blue-600 to-sky-400" />
              <span>Ingresos en Soles</span>
            </div>
          </div>

          {/* Contenedor del Gráfico de Barras SVG / Tailwind */}
          <div className="relative pt-6 pb-2">
            {/* Líneas horizontales de referencia */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-white border-dashed w-full" />
              <div className="border-b border-white border-dashed w-full" />
              <div className="border-b border-white border-dashed w-full" />
              <div className="border-b border-white border-dashed w-full" />
            </div>

            {/* Barras verticales */}
            <div className="relative z-10 grid grid-cols-7 gap-3 sm:gap-6 items-end h-56 px-2">
              {last7Days.map((day, idx) => {
                const heightPercentage = Math.max(8, Math.round((day.amount / maxDayAmount) * 100));
                const isHovered = hoveredBarIndex === idx;

                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Tooltip flotante al pasar el mouse */}
                    <div
                      className={`transition-all duration-200 text-center pointer-events-none mb-1 ${
                        isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-95'
                      }`}
                    >
                      <div className="px-2 py-1 rounded-lg bg-slate-900 border border-sky-400 text-[10px] font-bold text-sky-300 shadow-xl font-mono whitespace-nowrap">
                        {formatCurrency(day.amount)}
                        <span className="block text-[9px] text-slate-400 font-normal">
                          {day.bookingsCount} {day.bookingsCount === 1 ? 'reserva' : 'reservas'}
                        </span>
                      </div>
                    </div>

                    {/* Barra con gradiente y efecto glow */}
                    <div className="w-full max-w-[42px] bg-white/[0.04] rounded-2xl p-1 flex items-end justify-center h-full">
                      <div
                        style={{ height: `${heightPercentage}%` }}
                        className={`w-full rounded-xl transition-all duration-500 ${
                          isHovered
                            ? 'bg-gradient-to-t from-blue-500 to-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.8)]'
                            : 'bg-gradient-to-t from-blue-700 via-sky-600 to-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                        }`}
                      />
                    </div>

                    {/* Etiqueta del Día */}
                    <div className="text-center pt-1">
                      <span className="text-[11px] font-bold text-slate-300 block">{day.dayName}</span>
                      <span className="text-[9px] text-slate-500 block font-mono">
                        {day.date.slice(8, 10)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* GRÁFICO 2: Métodos de Pago (Donut / Barra de Distribución) */}
        <div className="apple-glass-card rounded-[28px] p-6 sm:p-7 border border-white/[0.08] shadow-2xl flex flex-col justify-between space-y-5">
          <div className="border-b border-white/[0.06] pb-3">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <QrCode className="w-4 h-4 text-sky-400" />
              <span>Participación de Pagos</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribución porcentual por billetera y banco
            </p>
          </div>

          {/* Gráfico circular Donut SVG */}
          <div className="relative flex items-center justify-center py-2">
            <svg viewBox="0 0 100 100" className="w-40 h-40 -rotate-90 transform">
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="14"
              />
              {(() => {
                let accumulatedPercent = 0;
                return paymentMethods.map((m) => {
                  const strokeDasharray = `${m.percentage * 2.387} 238.7`;
                  const strokeDashoffset = -accumulatedPercent * 2.387;
                  accumulatedPercent += m.percentage;

                  return (
                    <circle
                      key={m.label}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke={m.color}
                      strokeWidth="14"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-700 hover:opacity-80"
                    />
                  );
                });
              })()}
            </svg>

            {/* Centro del Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total
              </span>
              <span className="text-sm font-extrabold text-white font-mono">
                {formatCurrency(summary.totalRecaudado)}
              </span>
            </div>
          </div>

          {/* Leyenda interactiva con porcentajes y montos */}
          <div className="space-y-2 pt-2">
            {paymentMethods.map((m) => (
              <div key={m.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: m.color }}
                  />
                  <span className="text-slate-300 font-medium truncate">{m.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono">
                  <span className="font-bold text-white">{formatCurrency(m.total)}</span>
                  <span className="text-[10px] text-slate-400 w-8 text-right">
                    {m.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILA 3: Canales de Venta & Estado de Habitaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Canales de Reserva (Web vs Presencial vs Teléfono) */}
        <div className="apple-glass-card rounded-[28px] p-6 border border-white/[0.08] shadow-2xl space-y-4">
          <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>Canales de Reserva</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Origen de los huéspedes registrados
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded-full">
              {summary.totalReservas} reservas
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {channels.map((c) => {
              const pct = summary.totalReservas > 0 ? Math.round((c.count / summary.totalReservas) * 100) : 0;
              return (
                <div key={c.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-semibold">{c.label}</span>
                    <span className="text-slate-400 font-mono">
                      {c.count} reservas ({pct}%) • <strong className="text-sky-300">{formatCurrency(c.total)}</strong>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-700"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estado Operativo de Habitaciones (Housekeeping) */}
        <div className="apple-glass-card rounded-[28px] p-6 border border-white/[0.08] shadow-2xl space-y-4">
          <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                <span>Estado del Hotel (7 Habitaciones)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Situación en tiempo real para ventas
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Operativo 100%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Disponibles
              </span>
              <span className="text-2xl font-black text-white font-mono block">
                {roomStatusCounts.disponible}
              </span>
              <span className="text-[10px] text-slate-400 block">Listas para web</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center space-y-1">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                Ocupadas
              </span>
              <span className="text-2xl font-black text-white font-mono block">
                {roomStatusCounts.ocupada}
              </span>
              <span className="text-[10px] text-slate-400 block">Con huésped</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Limpieza
              </span>
              <span className="text-2xl font-black text-white font-mono block">
                {roomStatusCounts.en_limpieza}
              </span>
              <span className="text-[10px] text-slate-400 block">Housekeeping</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                Taller
              </span>
              <span className="text-2xl font-black text-white font-mono block">
                {roomStatusCounts.mantenimiento}
              </span>
              <span className="text-[10px] text-slate-400 block">Mantenimiento</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILA 4: Bitácora de Auditoría en Vivo (macOS Console) */}
      <div className="apple-glass rounded-[28px] border border-white/[0.08] shadow-2xl overflow-hidden">
        {/* Titlebar macOS Console */}
        <div className="bg-slate-950/80 px-6 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="macos-dot macos-dot-red" />
              <span className="macos-dot macos-dot-yellow" />
              <span className="macos-dot macos-dot-green" />
            </div>
            <span className="text-xs font-bold text-slate-200 tracking-wide">
              macOS Console • Bitácora Inalterable de Auditoría ({auditLogs.length} eventos)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Filtrar por acción o usuario..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
          </div>
        </div>

        {/* Tabla de Registros de Auditoría */}
        <div className="overflow-x-auto p-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400 font-semibold">
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Usuario Staff (Google)</th>
                <th className="p-3">Acción Efectuada</th>
                <th className="p-3">Entidad / Registro</th>
                <th className="p-3">IP Origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                    No hay eventos de auditoría que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="p-3 text-slate-400">{l.timestamp}</td>
                    <td className="p-3 font-semibold text-white">{l.staffEmail}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/25 text-[10px] font-bold">
                        {l.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 font-sans">{l.table}</td>
                    <td className="p-3 text-slate-500">{l.ip}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
