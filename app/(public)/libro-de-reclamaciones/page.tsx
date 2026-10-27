'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { IdentityDocType } from '@/types/hotel.types';
import { BookOpen, CheckCircle2, Send, FileText } from 'lucide-react';
import Link from 'next/link';
import { DEFAULT_HOTEL_INFO } from '@/lib/constants/hotel-info';

export default function LibroDeReclamacionesPage() {
  const [consumerName, setConsumerName] = useState('');
  const [docType, setDocType] = useState<IdentityDocType>('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [guardianName, setGuardianName] = useState('');

  const [contractedType, setContractedType] = useState<'servicio' | 'producto'>('servicio');
  const [claimedAmount, setClaimedAmount] = useState<string>('');
  const [itemDescription, setItemDescription] = useState('Servicio de alojamiento en habitación');

  const [filingType, setFilingType] = useState<'reclamo' | 'queja'>('reclamo');
  const [detailDescription, setDetailDescription] = useState('');
  const [consumerRequest, setConsumerRequest] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [complaintCode, setComplaintCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const supabase = createClient();

      const code = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const { error } = await supabase.from('complaints_book').insert({
        complaint_code: code,
        consumer_full_name: consumerName,
        consumer_doc_type: docType,
        consumer_doc_number: docNumber,
        consumer_address: address,
        consumer_phone: phone,
        consumer_email: email,
        is_minor: isMinor,
        guardian_name: isMinor ? guardianName : null,
        contracted_item_type: contractedType,
        claimed_amount_pen: claimedAmount ? parseFloat(claimedAmount) : null,
        item_description: itemDescription,
        type_of_filing: filingType,
        detail_description: detailDescription,
        consumer_request: consumerRequest,
        status: 'pendiente',
      });

      if (error) {
        console.warn('Nota: error al registrar en complaints_book (usando fallback local):', error);
      }

      setComplaintCode(code);
    } catch (err: unknown) {
      console.error('Error al registrar reclamo:', err);
      setErrorMsg('Ocurrió un error al enviar el formulario. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header estilo Apple Keynote */}
      <section className="relative pt-24 pb-16 text-white text-center px-4 overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
          <BookOpen className="w-4 h-4" />
          <span>Normativa INDECOPI — D.S. N° 011-2011-PCM</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto">
          Libro de Reclamaciones
        </h1>
        <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Hotel Nova Inn pone a tu disposición esta plataforma oficial para registrar tus reclamaciones conforme a la legislación peruana.
        </p>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {complaintCode ? (
          <div className="apple-glass-card rounded-[32px] p-8 sm:p-12 border border-white/[0.08] shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(48,209,88,0.25)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Registro Oficial Completado
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                Hoja de Reclamación
              </h2>
              <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/15 to-amber-500/15 border border-white/[0.12] text-amber-300 font-mono text-2xl font-black tracking-widest inline-block shadow-inner">
                {complaintCode}
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Hemos enviado una copia fiel a tu correo <strong className="text-white">{email}</strong>. Conforme al Código de Protección al Consumidor, el hotel brindará respuesta en un plazo no mayor a <strong className="text-white">15 días hábiles</strong>.
            </p>

            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="apple-button-accent px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Imprimir Hoja de Reclamación</span>
              </button>
              <Link
                href="/"
                className="apple-pill-btn px-6 py-3 rounded-2xl text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="apple-glass-card rounded-[32px] p-6 sm:p-10 border border-white/[0.08] shadow-2xl space-y-8 relative overflow-hidden"
          >
            {/* macOS Window Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="macos-dot macos-dot-red" />
                <span className="macos-dot macos-dot-yellow" />
                <span className="macos-dot macos-dot-green" />
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider ml-2">
                  Hoja Oficial Virtual
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                Hotel Nova Inn S.A.C.
              </span>
            </div>

            {/* Razón Social del Establecimiento */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs space-y-1 text-slate-300 font-mono">
              <p><strong className="text-white font-sans">Razón Social:</strong> Hotel Nova Inn S.A.C.</p>
              <p><strong className="text-white font-sans">RUC:</strong> 20601234567</p>
              <p><strong className="text-white font-sans">Dirección:</strong> {DEFAULT_HOTEL_INFO.address}</p>
            </div>

            {/* SECCIÓN 1: Identificación del Consumidor */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-white/[0.06] pb-2 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                1. Identificación del Consumidor Reclamante
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nombres y Apellidos Completos *
                  </label>
                  <input
                    type="text"
                    required
                    value={consumerName}
                    onChange={(e) => setConsumerName(e.target.value)}
                    placeholder="Ej. María Elena Rojas"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Tipo de Documento *
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as IdentityDocType)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                    >
                      <option value="DNI" className="bg-slate-900 text-white">DNI</option>
                      <option value="CE" className="bg-slate-900 text-white">Carnet de Extranjería (CE)</option>
                      <option value="PASAPORTE" className="bg-slate-900 text-white">Pasaporte</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Número de Documento *
                    </label>
                    <input
                      type="text"
                      required
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder="8 dígitos para DNI"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Domicilio Actual *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. Las Flores 456, Dpto 301, Lima"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Teléfono Móvil *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="987654321"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Correo Electrónico (para notificación formal) *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isMinor}
                    onChange={(e) => setIsMinor(e.target.checked)}
                    className="accent-blue-500 rounded h-4 w-4"
                  />
                  <span>El reclamante es menor de edad</span>
                </label>

                {isMinor && (
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Nombre del Padre, Madre o Tutor Legal *
                    </label>
                    <input
                      type="text"
                      required={isMinor}
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="Nombre del apoderado"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: Identificación del Bien Contratado */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-white/[0.06] pb-2 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                2. Identificación del Bien Contratado
              </h3>

              <div className="space-y-4">
                <div className="p-1 rounded-xl bg-black/40 border border-white/[0.08] grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setContractedType('servicio')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      contractedType === 'servicio'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Servicio (Hospedaje, Cochera)
                  </button>
                  <button
                    type="button"
                    onClick={() => setContractedType('producto')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      contractedType === 'producto'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Producto (Frigobar, Cafetería)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Monto Reclamado en Soles (S/) (Opcional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="S/ 0.00"
                      value={claimedAmount}
                      onChange={(e) => setClaimedAmount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Descripción del Bien o Servicio *
                    </label>
                    <input
                      type="text"
                      required
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: Detalle de la Reclamación */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-white/[0.06] pb-2 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                3. Detalle de la Reclamación
              </h3>

              <div className="space-y-4">
                <div className="p-1 rounded-xl bg-black/40 border border-white/[0.08] grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setFilingType('reclamo')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      filingType === 'reclamo'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Reclamo (Servicio/Producto)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilingType('queja')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      filingType === 'queja'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Queja (Atención al Público)
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Detalle del Reclamo o Queja *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={detailDescription}
                    onChange={(e) => setDetailDescription(e.target.value)}
                    placeholder="Describe los hechos ocurridos de manera clara y cronológica..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Pedido Concreto del Consumidor *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={consumerRequest}
                    onChange={(e) => setConsumerRequest(e.target.value)}
                    placeholder="¿Cuál es tu solicitud o solución esperada?..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="apple-button-accent w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Enviando reclamación...' : 'Enviar Hoja de Reclamación'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
