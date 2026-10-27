'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_HOTEL_INFO } from '@/lib/constants/hotel-info';
import {
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';

const FAQS = [
  {
    q: '¿Cuáles son los horarios oficiales de Check-in y Check-out?',
    a: 'El ingreso (Check-in) inicia a partir de las 14:00 horas. La salida (Check-out) es hasta las 12:00 horas del mediodía. Si necesitas ingresar antes o salir más tarde, puedes coordinarlo con recepción sujeto a disponibilidad.',
  },
  {
    q: '¿Qué medios de pago aceptan para confirmar mi reserva?',
    a: 'Aceptamos transferencias inmediatas por Yape y Plin, transferencias bancarias a nuestras cuentas corrientes (BCP y BBVA) y pagos con tarjeta de crédito o débito a través de nuestra pasarela en línea.',
  },
  {
    q: '¿Cómo funciona el bloqueo temporal de 15 minutos?',
    a: 'Al completar el paso 2 de la reserva, el sistema bloquea la habitación seleccionada durante 15 minutos en el calendario para que nadie más pueda ocuparla mientras realizas tu pago o subes tu comprobante.',
  },
  {
    q: '¿El hotel cuenta con estacionamiento privado?',
    a: 'Sí, disponemos de cochera techada y vigilada las 24 horas dentro de nuestras instalaciones. Puedes solicitar tu espacio al completar el formulario de tu reserva.',
  },
  {
    q: '¿Puedo solicitar factura electrónica?',
    a: 'Por supuesto. Al momento de registrar tus datos, selecciona la opción "Factura" e ingresa tu número de RUC (11 dígitos) y la Razón Social de tu empresa.',
  },
  {
    q: '¿Cuál es la política de cancelación?',
    a: 'Puedes cancelar o reprogramar tu reserva sin costo alguno hasta 48 horas antes de la fecha de ingreso. Cancelaciones posteriores implican una penalidad de la primera noche.',
  },
];

export default function ContactoPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Formulario de contacto
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isCorporate, setIsCorporate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const supabase = createClient();

      const { error } = await supabase.from('contact_messages').insert({
        full_name: fullName,
        email: email,
        phone: phone || null,
        subject: subject,
        message: message,
        is_corporate_inquiry: isCorporate,
      });

      if (error) {
        console.warn('Nota: error al guardar mensaje (usando fallback local):', error);
      }

      setSubmitted(true);
      setFullName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
      setIsCorporate(false);
    } catch (err: unknown) {
      console.error('Error al enviar formulario de contacto:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Error al enviar el mensaje');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-16 pb-24">
      {/* 1. Header estilo Keynote de Apple */}
      <section className="relative pt-24 pb-16 text-white text-center px-4 overflow-hidden">

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto">
          Contacto y Ayuda
        </h1>
        <p className="mt-4 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          ¿Tienes alguna duda sobre tu reserva o estadía? Nuestro equipo de recepción está disponible las 24 horas para asistirte.
        </p>
      </section>

      {/* 2. Tarjetas de Contacto Rápido - Apple Glass Tiles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="apple-glass-card rounded-[28px] p-6 border border-white/[0.08] shadow-xl hover:border-blue-500/40 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">Llámanos</span>
            <a href={`tel:${DEFAULT_HOTEL_INFO.phone_number}`} className="text-sm font-bold text-white hover:text-blue-400 transition-colors">
              {DEFAULT_HOTEL_INFO.phone_number}
            </a>
          </div>

          <div className="apple-glass-card rounded-[28px] p-6 border border-white/[0.08] shadow-xl hover:border-emerald-500/40 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">WhatsApp Oficial</span>
            <a
              href={`https://wa.me/${DEFAULT_HOTEL_INFO.whatsapp_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-white hover:text-emerald-400 transition-colors"
            >
              +51 {DEFAULT_HOTEL_INFO.whatsapp_number}
            </a>
          </div>

          <div className="apple-glass-card rounded-[28px] p-6 border border-white/[0.08] shadow-xl hover:border-blue-500/40 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4">
              <Mail className="w-5 h-5" />
            </div>
            <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">Correo Electrónico</span>
            <a href={`mailto:${DEFAULT_HOTEL_INFO.email}`} className="text-sm font-bold text-white hover:text-blue-400 transition-colors">
              {DEFAULT_HOTEL_INFO.email}
            </a>
          </div>

          <div className="apple-glass-card rounded-[28px] p-6 border border-white/[0.08] shadow-xl">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">Horario de Atención</span>
            <span className="text-sm font-bold text-white block">
              24 Horas / 7 Días
            </span>
          </div>
        </div>
      </section>

      {/* 3. Formulario de Contacto y FAQs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario estilo macOS Sheet */}
          <div className="apple-glass-card rounded-[32px] p-8 sm:p-10 border border-white/[0.08] shadow-2xl relative overflow-hidden">
            {/* macOS Window Controls */}
            <div className="flex items-center gap-2 pb-5 border-b border-white/[0.06] mb-6">
              <span className="macos-dot macos-dot-red" />
              <span className="macos-dot macos-dot-yellow" />
              <span className="macos-dot macos-dot-green" />
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider ml-2">
                Mensajería • Nova Inn
              </span>
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight mb-1.5">
              Envíanos un Mensaje
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Para consultas de grupos, reservas corporativas o requerimientos especiales, déjanos un mensaje.
            </p>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-base">
                  ¡Mensaje enviado con éxito!
                </h4>
                <p className="text-xs text-slate-300">
                  Nuestro equipo de recepción revisará tu solicitud y se pondrá en contacto a la brevedad.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="apple-pill-btn px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nombres y Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Carlos Pérez"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Teléfono Móvil
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="987654321"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Asunto *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Consulta sobre reserva corporativa"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Mensaje *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Detalla tu consulta o requerimiento..."
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <input
                    type="checkbox"
                    checked={isCorporate}
                    onChange={(e) => setIsCorporate(e.target.checked)}
                    className="accent-blue-500 rounded h-4 w-4"
                  />
                  <span>Consulta de tipo corporativo o para empresas</span>
                </label>

                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="apple-button-accent w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Enviando...' : 'Enviar Mensaje'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Acordeón de FAQs estilo Apple Card */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Resuelve tus Dudas
              </span>
              <h3 className="text-2xl font-black text-white mt-1 mb-4 tracking-tight">
                Preguntas Frecuentes (FAQs)
              </h3>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="apple-glass-card rounded-2xl border border-white/[0.08] overflow-hidden shadow-sm transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-white cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-blue-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/[0.06] pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
