'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { PaymentMethodType, PaymentTransactionStatus } from '@/types/hotel.types';

interface RealPayment {
  id: string;
  resId?: string;
  resCode: string;
  guestName: string;
  method: PaymentMethodType;
  amount: number;
  operationNumber: string;
  voucherUrl: string;
  date: string;
  status: PaymentTransactionStatus;
}

export default function AdminPagosPage() {
  const [payments, setPayments] = useState<RealPayment[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<RealPayment | null>(null);
  const [resolvedVoucherUrl, setResolvedVoucherUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
          const res = p.reservations;
          const g = res?.guests;
          const guestName = g ? `${g.first_name || ''} ${g.last_name || ''}`.trim() : 'Huésped';
          return {
            id: p.id,
            resId: p.reservation_id,
            resCode: res?.reservation_code || 'S/C',
            guestName,
            method: p.payment_method,
            amount: parseFloat(p.amount_pen) || 0,
            operationNumber: p.operation_number || 'S/N',
            voucherUrl: p.voucher_image_url || '',
            date: new Date(p.created_at).toLocaleString('es-PE'),
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
            Revisa las capturas de pantalla y números de operación subidos por los huéspedes para confirmar sus reservas.
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

      {/* Tabla de Pagos estilo macOS Finder / Table */}
      <div className="apple-glass rounded-[26px] border border-white/[0.08] shadow-2xl overflow-hidden">
        {/* Titlebar macOS */}
        <div className="bg-slate-950/60 px-6 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="macos-dot macos-dot-red" />
            <span className="macos-dot macos-dot-yellow" />
            <span className="macos-dot macos-dot-green" />
            <span className="text-xs font-semibold text-slate-300 ml-2">Historial de Transacciones</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {payments.length} transacciones registradas
          </span>
        </div>

        <div className="overflow-x-auto p-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400">
                <th className="p-3 font-semibold">Reserva</th>
                <th className="p-3 font-semibold">Huésped</th>
                <th className="p-3 font-semibold">Medio de Pago</th>
                <th className="p-3 font-semibold">N.° Operación</th>
                <th className="p-3 font-semibold">Monto Abonado</th>
                <th className="p-3 font-semibold">Hora de Envío</th>
                <th className="p-3 font-semibold">Estado</th>
                <th className="p-3 text-right font-semibold">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="p-3 font-mono font-bold text-sky-400">{p.resCode}</td>
                  <td className="p-3 font-medium text-white">{p.guestName}</td>
                  <td className="p-3">
                    <span className="capitalize font-medium text-slate-300">
                      {p.method.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-medium text-white">{p.operationNumber}</td>
                  <td className="p-3 font-mono font-bold text-emerald-400">{formatCurrency(p.amount)}</td>
                  <td className="p-3 text-slate-400 font-mono text-[11px]">{p.date}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Visor de Voucher estilo macOS Quick Look */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="apple-glass border border-white/[0.12] rounded-[28px] max-w-lg w-full p-6 shadow-2xl space-y-5 text-white animate-in fade-in zoom-in-95 duration-150">
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

            {/* Datos de validación estilo Apple Widget */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] grid grid-cols-2 gap-3 text-xs">
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
                  disabled={!!processingId}
                  onClick={() => handleReject(selectedVoucher.id)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {processingId === selectedVoucher.id ? 'Procesando...' : 'Rechazar Pago'}
                </button>
                <button
                  type="button"
                  disabled={!!processingId}
                  onClick={() => handleApprove(selectedVoucher.id)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {processingId === selectedVoucher.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirmando en BD...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aprobar y Confirmar Reserva</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pago {selectedVoucher.status === 'aprobado' ? 'Aprobado y Confirmado' : 'Rechazado'}</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  {selectedVoucher.status === 'aprobado'
                    ? 'La reserva ya fue confirmada en el sistema. Este pago está al día y registrado.'
                    : 'Este comprobante fue rechazado.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
