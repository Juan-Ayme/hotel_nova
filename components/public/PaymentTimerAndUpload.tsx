'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';
import {
  Clock,
  QrCode,
  Copy,
  Check,
  Upload,
  AlertTriangle,
  Building2,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { DEFAULT_HOTEL_INFO } from '@/lib/constants/hotel-info';

interface PaymentTimerAndUploadProps {
  reservationId: string;
  reservationCode: string;
  totalAmount: number;
  expiresAt: string;
  onPaymentSubmitted: (data: { method: string; operationNumber: string }) => void;
}

export default function PaymentTimerAndUpload({
  reservationId,
  reservationCode,
  totalAmount,
  expiresAt,
  onPaymentSubmitted,
}: PaymentTimerAndUploadProps) {
  const [activeTab, setActiveTab] = useState<'yape' | 'plin' | 'transferencia' | 'tarjeta'>('yape');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [operationNumber, setOperationNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Cronómetro de 15 minutos
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number; isExpired: boolean }>({
    minutes: 15,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const expiry = new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ minutes, seconds, isExpired: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleVoucherUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operationNumber.trim()) {
      setUploadError('Por favor ingresa el número de operación del pago.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('reservationId', reservationId);
      formData.append('reservationCode', reservationCode);
      formData.append(
        'paymentMethod',
        activeTab === 'yape'
          ? 'yape'
          : activeTab === 'plin'
          ? 'plin'
          : activeTab === 'transferencia'
          ? 'transferencia_bancaria'
          : 'tarjeta_credito_debito'
      );
      formData.append('operationNumber', operationNumber.trim());
      formData.append('amount', totalAmount.toString());

      // La imagen de comprobante es 100% opcional
      if (selectedFile) {
        formData.append('voucherFile', selectedFile);
      }

      const res = await fetch('/api/guest/payments', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Error al procesar el pago');
      }

      onPaymentSubmitted({
        method: activeTab,
        operationNumber: operationNumber.trim(),
      });
    } catch (err: unknown) {
      console.error('Error al procesar comprobante:', err);
      setUploadError(err instanceof Error ? err.message : 'Error al procesar el pago');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Cronómetro Regresivo - Estilo iOS Dynamic Island / Apple Timer */}
      <div
        className={`apple-glass-card rounded-[28px] p-4 sm:p-5 flex items-center justify-between shadow-2xl relative overflow-hidden transition-all ${
          timeLeft.isExpired
            ? 'border-rose-500/40 bg-rose-500/10'
            : 'border-blue-500/30'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              timeLeft.isExpired
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-blue-500/15 border-blue-500/30 text-blue-400 shadow-[0_0_20px_rgba(10,132,255,0.25)]'
            }`}
          >
            {timeLeft.isExpired ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Clock className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  timeLeft.isExpired ? 'text-rose-400' : 'text-blue-400'
                }`}
              >
                {timeLeft.isExpired ? 'Bloqueo Expirado' : 'Habitación Bloqueada'}
              </span>
              {!timeLeft.isExpired && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-slate-300 font-medium">
                  15 min hold
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {timeLeft.isExpired
                ? 'El tiempo para completar el pago ha concluido. La habitación puede haberse liberado.'
                : 'Completa tu pago y adjunta tu constancia antes de que el contador llegue a cero.'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 pl-3">
          <span
            className={`font-mono text-2xl sm:text-3xl font-black tracking-tight ${
              timeLeft.isExpired
                ? 'text-rose-400'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-300'
            }`}
          >
            {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Tiempo Restante</p>
        </div>
      </div>

      {/* Selector de Medios de Pago - iOS Segmented Control */}
      <div className="p-1.5 rounded-2xl bg-black/40 border border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-1.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('yape')}
          className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'yape'
              ? 'bg-[#730D88] text-white shadow-lg shadow-[#730D88]/30 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Yape</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plin')}
          className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'plin'
              ? 'bg-[#00D4B2] text-slate-950 shadow-lg shadow-[#00D4B2]/30 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Plin</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transferencia')}
          className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'transferencia'
              ? 'apple-button-gold text-slate-950 shadow-lg scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Transferencia</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tarjeta')}
          className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'tarjeta'
              ? 'apple-button-accent text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Tarjeta</span>
        </button>
      </div>

      {/* Contenido del Medio de Pago */}
      <div className="apple-glass-card rounded-[32px] p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* macOS Window Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="macos-dot macos-dot-red" />
            <span className="macos-dot macos-dot-yellow" />
            <span className="macos-dot macos-dot-green" />
          </div>
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
            Pasarela de Pago Segura • Nova Inn
          </span>
          <div className="w-12" />
        </div>

        {/* PAGO CON YAPE O PLIN */}
        {(activeTab === 'yape' || activeTab === 'plin') && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
              <div className="text-center sm:text-left space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  {activeTab === 'yape' ? 'Billetera Digital Yape' : 'Billetera Digital Plin'}
                </span>
                <h4 className="text-2xl font-black text-white tracking-tight">
                  Transfiere <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-300">{formatCurrency(totalAmount)}</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Titular autorizado: <strong className="text-slate-200">{activeTab === 'yape' ? DEFAULT_HOTEL_INFO.yape_holder_name : DEFAULT_HOTEL_INFO.plin_holder_name}</strong>
                </p>

                {/* Número con botón Copiar al toque */}
                <div className="pt-2 flex items-center gap-2 justify-center sm:justify-start">
                  <div className="px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-sm font-mono font-bold text-white shadow-inner">
                    {activeTab === 'yape' ? DEFAULT_HOTEL_INFO.yape_phone_number : DEFAULT_HOTEL_INFO.plin_phone_number}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        activeTab === 'yape' ? DEFAULT_HOTEL_INFO.yape_phone_number || '' : DEFAULT_HOTEL_INFO.plin_phone_number || '',
                        'wallet-phone'
                      )
                    }
                    className="apple-pill-btn flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer active:scale-95 transition-all"
                  >
                    {copiedField === 'wallet-phone' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-slate-200">Copiar Número</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Código QR Ilustrativo estilo Apple Card */}
              <div className="flex flex-col items-center p-4 rounded-3xl bg-white text-slate-950 shadow-2xl shrink-0 border border-white/20">
                <QrCode className="w-32 h-32 text-slate-900" />
                <span className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-wider">
                  Escanea con {activeTab === 'yape' ? 'Yape' : 'Plin'}
                </span>
              </div>
            </div>

            {/* Formulario de Carga de Comprobante */}
            <form onSubmit={handleVoucherUpload} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Número de Operación de {activeTab === 'yape' ? 'Yape' : 'Plin'} *
                </label>
                <input
                  type="text"
                  placeholder="Ej. 849201"
                  value={operationNumber}
                  onChange={(e) => setOperationNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono placeholder:text-slate-600 transition-all"
                  required
                />
              </div>

              {/* AirDrop style file dropzone */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Subir Captura de Pantalla / Comprobante
                  </label>
                  <span className="text-[10px] text-sky-400 font-semibold bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                    Opcional
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Si no tienes la imagen a la mano, con solo ingresar el número de operación arriba tu pago será verificado.
                </p>
                <div className="p-4 rounded-2xl border-2 border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-xs text-emerald-400 flex items-center justify-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Archivo seleccionado: {selectedFile.name}</span>
                    </p>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  {uploadError}
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="apple-button-accent w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {uploading ? (
                  <span>Verificando y enviando comprobante...</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Confirmar y Enviar Comprobante</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* PAGO CON TRANSFERENCIA BANCARIA */}
        {activeTab === 'transferencia' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                Cuentas Bancarias Oficiales en Soles (S/)
              </span>
              <p className="text-xs text-slate-400">
                Realiza la transferencia desde la app de tu banco o ventanilla y adjunta tu constancia.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {DEFAULT_HOTEL_INFO.bank_accounts.map((acc) => (
                <div
                  key={acc.account_number}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2 hover:border-white/[0.15] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{acc.bank}</span>
                    <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                      Soles (PEN)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">N.° de Cuenta:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white font-semibold">{acc.account_number}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(acc.account_number, `acc-${acc.account_number}`)}
                        className="apple-pill-btn p-1.5 rounded-lg text-slate-300 hover:text-white"
                        title="Copiar número de cuenta"
                      >
                        {copiedField === `acc-${acc.account_number}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Código CCI:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white font-semibold">{acc.cci}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(acc.cci, `cci-${acc.cci}`)}
                        className="apple-pill-btn p-1.5 rounded-lg text-slate-300 hover:text-white"
                        title="Copiar CCI"
                      >
                        {copiedField === `cci-${acc.cci}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-white/[0.06]">
                    Titular: <strong className="text-slate-200">{acc.holder}</strong>
                  </p>
                </div>
              ))}
            </div>

            {/* Formulario de comprobante bancario */}
            <form onSubmit={handleVoucherUpload} className="space-y-4 pt-4 border-t border-white/[0.08]">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Número de Operación Bancaria *
                </label>
                <input
                  type="text"
                  placeholder="Ej. 104928"
                  value={operationNumber}
                  onChange={(e) => setOperationNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono placeholder:text-slate-600 transition-all"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Subir Voucher o Constancia en PDF/Imagen
                  </label>
                  <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Opcional
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Si no tienes la imagen a la mano, con solo ingresar el número de operación arriba tu pago será verificado.
                </p>
                <div className="p-4 rounded-2xl border-2 border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-xs text-emerald-400 flex items-center justify-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Archivo: {selectedFile.name}</span>
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="apple-button-gold w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {uploading ? 'Enviando comprobante...' : 'Confirmar Transferencia'}
              </button>
            </form>
          </div>
        )}

        {/* PAGO CON TARJETA DE CRÉDITO/DÉBITO */}
        {activeTab === 'tarjeta' && (
          <div className="space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                Tarjeta de Crédito o Débito
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Aceptamos Visa, Mastercard, American Express y Diners Club. Confirmación automática inmediata.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Número de Tarjeta
                </label>
                <input
                  type="text"
                  placeholder="4557 •••• •••• ••••"
                  maxLength={19}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Vencimiento (MM/AA)
                  </label>
                  <input
                    type="text"
                    placeholder="12/28"
                    maxLength={5}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    placeholder="•••"
                    maxLength={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-300 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cifrado SSL conforme a PCI-DSS nivel bancario. Jamás almacenamos datos de tu tarjeta.</span>
            </div>

            <button
              type="button"
              onClick={() =>
                onPaymentSubmitted({
                  method: 'tarjeta_credito_debito',
                  operationNumber: `AUTH-${Date.now().toString().slice(-6)}`,
                })
              }
              className="apple-button-accent w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pagar {formatCurrency(totalAmount)}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
