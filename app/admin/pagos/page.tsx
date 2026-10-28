'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils/currency';
import { createClient } from '@/lib/supabase/client';
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  ShieldCheck,
  Building2,
  AlertTriangle,
  X,
  RefreshCw,
  FileText,
  ExternalLink,
  DoorClosed,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { PaymentMethodType, PaymentTransactionStatus } from '@/types/hotel.types';

interface RealPayment {
  id: string;
  resId?: string;
  resCode: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  roomDetails?: string;
  method: PaymentMethodType;
  amount: number;
  operationNumber: string;
  voucherUrl: string;
  date: string;
  createdAt: string;
  status: PaymentTransactionStatus;
}

export default function AdminPagosPage() {
  const [payments, setPayments] = useState<RealPayment[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<RealPayment | null>(null);
  const [resolvedVoucherUrl, setResolvedVoucherUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'en_verificacion' | 'urgentes' | 'aprobado' | 'rechazado'
  >('all');

  const handleOpenVoucher = async (p: RealPayment) => {
    setSelectedVoucher(p);
    setResolvedVoucherUrl(null);
    if (!p.voucherUrl) return;

    if (p.voucherUrl.startsWith('http://') || p.voucherUrl.startsWith('https://')) {
      setResolvedVoucherUrl(p.voucherUrl);
      return;
    }

    try {
      const supabase = createClient();
      const { data } = await supabase.storage
        .from('payment-vouchers')
        .createSignedUrl(p.voucherUrl, 3600);

      if (data?.signedUrl) {
        setResolvedVoucherUrl(data.signedUrl);
      } else {
        const { data: pubData } = supabase.storage
          .from('payment-vouchers')
          .getPublicUrl(p.voucherUrl);
        setResolvedVoucherUrl(pubData.publicUrl);
      }
    } catch (e) {
      console.error('Error al resolver URL de comprobante:', e);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/payments');
      const json = await res.json();

      if (res.ok && json.payments) {
        const loaded: RealPayment[] = json.payments.map((p: any) => {
          const resObj = p.reservations;
          const g = resObj?.guests;
          const guestName = g ? `${g.first_name || ''} ${g.last_name || ''}`.trim() : 'Huésped';

          // Extraer información de habitaciones asignadas
          const roomsArr = resObj?.reservation_rooms || [];
          const roomDetails = roomsArr
            .map((rr: any) => {
              const typeName = rr.room_types?.name || 'Habitación';
              const roomNum = rr.rooms?.room_number ? ` (Hab. ${rr.rooms.room_number})` : '';
              return `${typeName}${roomNum}`;
            })
            .filter(Boolean)
            .join(', ') || 'Habitación Hotel Nova';

          return {
            id: p.id,
            resId: p.reservation_id,
            resCode: resObj?.reservation_code || 'S/C',
            guestName,
            guestPhone: g?.phone || undefined,
            guestEmail: g?.email || undefined,
            roomDetails,
            method: p.payment_method,
            amount: parseFloat(p.amount_pen) || 0,
            operationNumber: p.operation_number || 'S/N',
            voucherUrl: p.voucher_image_url || '',
            date: new Date(p.created_at).toLocaleString('es-PE'),
            createdAt: p.created_at,
            status: p.status,
          };
        });
        setPayments(loaded);
      }
    } catch (err) {
      console.error('Error al cargar pagos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: id, action: 'approve' }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        alert(errJson.error || 'Error al aprobar pago');
        return;
      }

      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'aprobado' as PaymentTransactionStatus } : p))
      );
      setSelectedVoucher(null);
      await fetchPayments();
    } catch (err) {
      console.error('Error al aprobar pago:', err);
      alert('Error de conexión al aprobar pago.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Ingrese el motivo de rechazo del pago (ej. Monto no figura en cuenta):');
    if (!reason) return;

    try {
      setProcessingId(id);
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: id, action: 'reject', rejectionReason: reason }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        alert(errJson.error || 'Error al rechazar pago');
        return;
      }

      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'rechazado' as PaymentTransactionStatus } : p))
      );
      setSelectedVoucher(null);
      await fetchPayments();
    } catch (err) {
      console.error('Error al rechazar pago:', err);
      alert('Error de conexión al rechazar pago.');
    } finally {
      setProcessingId(null);
    }
  };

  // Cálculo de SLA (Tiempo transcurrido para validación)
  const getElapsedInfo = (createdAt: string, status: PaymentTransactionStatus) => {
    if (status !== 'en_verificacion') return null;
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const elapsedMinutes = Math.max(0, Math.floor(diffMs / 60000));

    if (elapsedMinutes < 15) {
      return {
        isUrgent: false,
        text: `Hace ${elapsedMinutes}m`,
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        label: 'Reciente',
      };
    }

    if (elapsedMinutes < 60) {
      return {
        isUrgent: false,
        text: `Hace ${elapsedMinutes}m`,
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        label: 'En espera',
      };
    }

    const hours = Math.floor(elapsedMinutes / 60);
    const mins = elapsedMinutes % 60;
    return {
      isUrgent: true,
      text: `Hace ${hours}h ${mins}m`,
      badgeClass: 'bg-rose-500/25 text-rose-300 border-rose-500/50 animate-pulse font-bold',
      label: '⚠️ Urgente (> 1h)',
    };
  };

  // Conteo de métricas
  const enVerifCount = payments.filter((p) => p.status === 'en_verificacion').length;
  const urgentesCount = payments.filter((p) => {
    if (p.status !== 'en_verificacion') return false;
    const diffMs = Date.now() - new Date(p.createdAt).getTime();
    return Math.floor(diffMs / 60000) >= 60;
  }).length;
  const aprobadosCount = payments.filter((p) => p.status === 'aprobado').length;
  const rechazadosCount = payments.filter((p) => p.status === 'rechazado').length;

  // Filtrado de la lista
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (activeFilter === 'en_verificacion') {
        return p.status === 'en_verificacion';
      }
      if (activeFilter === 'urgentes') {
        if (p.status !== 'en_verificacion') return false;
        const diffMs = Date.now() - new Date(p.createdAt).getTime();
        return Math.floor(diffMs / 60000) >= 60;
      }
      if (activeFilter === 'aprobado') {
        return p.status === 'aprobado';
      }
      if (activeFilter === 'rechazado') {
        return p.status === 'rechazado';
      }
      return true;
    });
  }, [payments, activeFilter]);

  return (
    <div className="space-y-8">
      {/* Header estilo macOS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-sky-400" />
            <span className="text-[11px] font-semibold tracking-wider text-sky-400 uppercase">
              Tesorería & Validación de Pagos
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Validación de Pagos (Yape, Plin y Transferencias)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Revisa los comprobantes y números de operación subidos por los huéspedes. La habitación se mantiene bloqueada hasta tu confirmación.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPayments}
          disabled={loading}
          className="apple-pill-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-slate-300 hover:text-white font-medium text-xs active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Banner Informativo y Alerta de Urgencia SLA (> 1 hora) */}
      {urgentesCount > 0 ? (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3.5 text-xs text-rose-200 shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-white font-bold block text-sm">
              ¡Tienes {urgentesCount} pago(s) esperando validación por más de 1 hora!
            </strong>
            <p className="text-rose-300/90 leading-relaxed text-xs">
              Los clientes ya realizaron su abono y las habitaciones permanecen bloqueadas a su nombre para evitar sobreventas (overbooking). Por favor revisa las cuentas de Yape/banco y confirma o rechaza los comprobantes pendientes.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3 text-xs text-slate-300">
          <Lock className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            <strong>Protección Anti-Overbooking:</strong> Mientras una reserva esté en estado <em>pago_en_verificacion</em>, la habitación se mantiene reservada y bloqueada en el sistema para que ningún otro cliente pueda tomarla.
          </span>
        </div>
      )}

      {/* Filtros estilo Segmented Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.08]'
          }`}
        >
          Todos ({payments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('en_verificacion')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeFilter === 'en_verificacion'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.08]'
          }`}
        >
          Por Verificar ({enVerifCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('urgentes')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'urgentes'
              ? 'bg-rose-600 text-white shadow-md'
              : urgentesCount > 0
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.08]'
          }`}
        >
          <span>Urgentes &gt; 1 hora</span>
          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
            {urgentesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('aprobado')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeFilter === 'aprobado'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.08]'
          }`}
        >
          Aprobados ({aprobadosCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('rechazado')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeFilter === 'rechazado'
              ? 'bg-slate-700 text-white shadow-md'
              : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.08]'
          }`}
        >
          Rechazados ({rechazadosCount})
        </button>
      </div>

      {/* Tabla de Pagos estilo macOS Finder / Table */}
      <div className="apple-glass rounded-[26px] border border-white/[0.08] shadow-2xl overflow-hidden">
        {/* Titlebar macOS */}
        <div className="bg-slate-950/60 px-6 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="macos-dot macos-dot-red" />
            <span className="macos-dot macos-dot-yellow" />
            <span className="macos-dot macos-dot-green" />
            <span className="text-xs font-semibold text-slate-300 ml-2">Historial de Transacciones & SLAs</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {filteredPayments.length} transacciones listadas
          </span>
        </div>

        <div className="overflow-x-auto p-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400">
                <th className="p-3 font-semibold">Reserva</th>
                <th className="p-3 font-semibold">Huésped</th>
                <th className="p-3 font-semibold">Habitación</th>
                <th className="p-3 font-semibold">Medio</th>
                <th className="p-3 font-semibold">N.° Operación</th>
                <th className="p-3 font-semibold">Monto</th>
                <th className="p-3 font-semibold">Tiempo / SLA</th>
                <th className="p-3 font-semibold">Estado</th>
                <th className="p-3 text-right font-semibold">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No se encontraron transacciones en esta vista.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const sla = getElapsedInfo(p.createdAt, p.status);

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="p-3 font-mono font-bold text-sky-400">{p.resCode}</td>
                      <td className="p-3 font-medium text-white">
                        <span>{p.guestName}</span>
                        {p.guestPhone && (
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {p.guestPhone}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300 max-w-[160px] truncate" title={p.roomDetails}>
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <DoorClosed className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="truncate">{p.roomDetails}</span>
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="capitalize font-medium text-slate-300">
                          {p.method.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-medium text-white">{p.operationNumber}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">{formatCurrency(p.amount)}</td>
                      <td className="p-3">
                        {sla ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${sla.badgeClass}`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{sla.label} ({sla.text})</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">{p.date}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize ${
                            p.status === 'aprobado'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                              : p.status === 'en_verificacion'
                              ? 'bg-sky-500/15 text-sky-300 border border-sky-500/25'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                          }`}
                        >
                          {p.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenVoucher(p)}
                          className="apple-pill-btn px-3 py-1.5 rounded-xl text-slate-200 hover:text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-400" />
                          <span>{p.voucherUrl ? 'Ver Voucher' : 'Ver N.° Operación'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Visor de Voucher estilo macOS Quick Look */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="apple-glass border border-white/[0.12] rounded-[28px] max-w-lg w-full p-6 shadow-2xl space-y-5 text-white animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* macOS Quick Look Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 mr-1">
                  <span className="macos-dot macos-dot-red" />
                  <span className="macos-dot macos-dot-yellow" />
                  <span className="macos-dot macos-dot-green" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Quick Look • Comprobante {selectedVoucher.resCode}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Huésped: {selectedVoucher.guestName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedVoucher(null);
                  setResolvedVoucherUrl(null);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alerta si el pago lleva más de 1 hora esperando */}
            {(() => {
              const sla = getElapsedInfo(selectedVoucher.createdAt, selectedVoucher.status);
              if (sla?.isUrgent) {
                return (
                  <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>¡Atención! Este pago lleva más de 1 hora esperando revisión.</strong>
                      <p className="text-[11px] text-rose-300 mt-0.5">
                        El cuarto sigue bloqueado a su nombre. Por favor verifica de inmediato el dinero en tu cuenta bancaria y aprueba o rechaza la reserva.
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Datos de validación y Habitación estilo Apple Widget */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Monto Registrado:</span>
                  <span className="text-base font-bold text-sky-400 font-mono">
                    {formatCurrency(selectedVoucher.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">N.° de Operación:</span>
                  <span className="text-base font-mono font-bold text-white">
                    {selectedVoucher.operationNumber}
                  </span>
                </div>
              </div>

              {selectedVoucher.roomDetails && (
                <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2 text-slate-300">
                  <DoorClosed className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>
                    Habitación: <strong>{selectedVoucher.roomDetails}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Visor del Comprobante (Imagen o PDF) o Validación por Código */}
            <div className="relative min-h-60 max-h-80 w-full rounded-2xl overflow-hidden bg-black/40 border border-white/[0.08] flex items-center justify-center p-4">
              {!selectedVoucher.voucherUrl ? (
                <div className="text-center p-4 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Validación por Código de Operación</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    El huésped registró el pago con su N.° de Operación sin adjuntar archivo de captura.
                  </p>
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] inline-block font-mono text-base text-sky-400 font-bold">
                    N.° Op: {selectedVoucher.operationNumber}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Comprueba en tu app de {selectedVoucher.method.toUpperCase()} el ingreso de {formatCurrency(selectedVoucher.amount)} con este número de operación.
                  </p>
                </div>
              ) : !resolvedVoucherUrl ? (
                <div className="text-slate-400 text-xs flex items-center gap-2 py-10">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Cargando comprobante desde Supabase Storage...</span>
                </div>
              ) : resolvedVoucherUrl.toLowerCase().includes('.pdf') ? (
                <div className="text-center p-6 space-y-3">
                  <FileText className="w-12 h-12 text-sky-400 mx-auto" />
                  <p className="text-xs text-slate-300">El comprobante adjunto es un documento PDF</p>
                  <a
                    href={resolvedVoucherUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="apple-button-accent inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl shadow-md cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir comprobante PDF</span>
                  </a>
                </div>
              ) : (
                <img
                  src={resolvedVoucherUrl}
                  alt="Voucher de pago"
                  className="max-h-72 w-auto object-contain rounded-xl shadow-lg"
                />
              )}
            </div>

            {/* Acciones de Recepción */}
            {selectedVoucher.status === 'en_verificacion' ? (
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={processingId === selectedVoucher.id}
                  onClick={() => handleApprove(selectedVoucher.id)}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs uppercase tracking-wider text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aprobar Pago y Confirmar Cuarto</span>
                </button>
                <button
                  type="button"
                  disabled={processingId === selectedVoucher.id}
                  onClick={() => handleReject(selectedVoucher.id)}
                  className="px-4 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Rechazar</span>
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-white/[0.04] text-center text-xs text-slate-400">
                Este pago ya se encuentra en estado <strong>{selectedVoucher.status}</strong>.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
