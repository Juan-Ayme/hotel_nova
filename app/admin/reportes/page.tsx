'use client';

import { useState } from 'react';
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
  FileText,
  Clock,
} from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: string;
  staffEmail: string;
  action: string;
  table: string;
  ip: string;
}

const SAMPLE_LOGS: AuditEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-11-10 10:15:32',
    staffEmail: 'admin.novainn@gmail.com',
    action: 'APROBAR_PAGO_YAPE',
    table: 'payments (ID: pay-1)',
    ip: '190.237.45.12',
  },
  {
    id: 'log-2',
    timestamp: '2026-11-10 09:40:11',
    staffEmail: 'recepcion.novainn@gmail.com',
    action: 'REGISTRAR_CHECK_IN',
    table: 'reservations (NOVA-2026-8491)',
    ip: '190.237.45.12',
  },
  {
    id: 'log-3',
    timestamp: '2026-11-09 18:30:00',
    staffEmail: 'admin.novainn@gmail.com',
    action: 'ACTUALIZAR_TARIFA_HABITACION',
    table: 'room_types (Matrimonial Confort)',
    ip: '190.237.45.12',
  },
];

export default function AdminReportesPage() {
  const [logs] = useState<AuditEntry[]>(SAMPLE_LOGS);

  const reportData = [
    { medio: 'Yape', transacciones: 18, total: 3240 },
    { medio: 'Plin', transacciones: 12, total: 2160 },
    { medio: 'Transferencia Bancaria (BCP/BBVA)', transacciones: 15, total: 4250 },
    { medio: 'Tarjeta de Crédito / Débito', transacciones: 9, total: 2890 },
    { medio: 'Efectivo en Recepción', transacciones: 8, total: 1520 },
  ];

  const totalRecaudado = reportData.reduce((acc, curr) => acc + curr.total, 0);

  const handleExportExcel = () => {
    // 1. Crear hoja de ingresos
    const wsIncome = XLSX.utils.json_to_sheet(
      reportData.map((d) => ({
        'Medio de Pago': d.medio,
        'N.° Transacciones': d.transacciones,
        'Total en Soles (PEN)': d.total,
      }))
    );

    // 2. Crear hoja de logs de auditoría
    const wsLogs = XLSX.utils.json_to_sheet(
      logs.map((l) => ({
        'Fecha y Hora': l.timestamp,
        'Usuario Google': l.staffEmail,
        'Acción Efectuada': l.action,
        'Tabla Afectada': l.table,
        'Dirección IP': l.ip,
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsIncome, 'Ingresos por Medio');
    XLSX.utils.book_append_sheet(wb, wsLogs, 'Bitácora de Auditoría');

    XLSX.writeFile(wb, `Reporte_HotelNovaInn_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-8">
      {/* Header estilo macOS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-4 h-4 text-sky-400" />
            <span className="text-[11px] font-semibold tracking-wider text-sky-400 uppercase">
              Contabilidad y Reportes Financieros
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Reportes Financieros y Bitácora
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualiza los ingresos consolidados por canal de pago y la bitácora inalterable de acciones del personal.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          className="apple-button-accent flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide active:scale-95 transition-all cursor-pointer shadow-lg self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar a Excel (.xlsx)</span>
        </button>
      </div>

      {/* Tarjeta de Ingresos Totales estilo macOS Financial Card */}
      <div className="apple-glass rounded-[26px] p-6 sm:p-7 border border-white/[0.08] shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="macos-dot macos-dot-red" />
              <span className="macos-dot macos-dot-yellow" />
              <span className="macos-dot macos-dot-green" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
                Ingresos Consolidados del Período
              </span>
              <div className="text-3xl font-bold text-white font-mono mt-0.5">
                {formatCurrency(totalRecaudado)}
              </div>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/[0.06]">
            Moneda Oficial: Soles Peruanos (PEN - S/)
          </span>
        </div>

        {/* Desglose por Medio de Pago estilo iOS Control Center */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportData.map((d) => (
            <div
              key={d.medio}
              className="apple-glass-card p-4 rounded-2xl flex flex-col justify-between border border-white/[0.06] hover:border-white/[0.14] transition-all"
            >
              <div>
                <span className="text-xs font-medium text-slate-300 block mb-1">{d.medio}</span>
                <span className="text-xl font-bold text-sky-400 font-mono">{formatCurrency(d.total)}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-white/[0.06] block">
                {d.transacciones} operaciones verificadas
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bitácora de Auditoría estilo macOS Console */}
      <div className="apple-glass rounded-[26px] border border-white/[0.08] shadow-2xl overflow-hidden">
        {/* Titlebar Console macOS */}
        <div className="bg-slate-950/60 px-6 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="macos-dot macos-dot-red" />
            <span className="macos-dot macos-dot-yellow" />
            <span className="macos-dot macos-dot-green" />
            <span className="text-xs font-semibold text-slate-300 ml-2">macOS Console • Bitácora de Auditoría (Audit Logs)</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            Inmutable
          </span>
        </div>

        <div className="overflow-x-auto p-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400">
                <th className="p-3 font-semibold">Fecha y Hora</th>
                <th className="p-3 font-semibold">Trabajador (Email)</th>
                <th className="p-3 font-semibold">Acción Efectuada</th>
                <th className="p-3 font-semibold">Entidad / Registro</th>
                <th className="p-3 font-semibold">Dirección IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono text-[11px]">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="p-3 text-slate-400">{l.timestamp}</td>
                  <td className="p-3 font-semibold text-white">{l.staffEmail}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/25 text-[10px] font-bold">
                      {l.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 font-sans">{l.table}</td>
                  <td className="p-3 text-slate-500">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
