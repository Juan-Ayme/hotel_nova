'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDateOnly } from '@/lib/utils/dates';
import { addDays } from 'date-fns';
import { X, UserPlus, Check, AlertCircle } from 'lucide-react';
import { IdentityDocType, PaymentMethodType } from '@/types/hotel.types';

interface WalkInBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WalkInBookingModal({
  isOpen,
  onClose,
  onSuccess,
}: WalkInBookingModalProps) {
  const [checkIn, setCheckIn] = useState('2026-11-10');
  const [checkOut, setCheckOut] = useState('2026-11-11');

  useEffect(() => {
    if (isOpen) {
      const t = formatDateOnly(new Date());
      setCheckIn(t);
      setCheckOut(formatDateOnly(addDays(new Date(), 1)));
    }
  }, [isOpen]);

  const [channel, setChannel] = useState<'presencial' | 'telefonica'>('presencial');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [docType, setDocType] = useState<IdentityDocType>('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [roomNumber, setRoomNumber] = useState('101');
  const [totalAmount, setTotalAmount] = useState('120');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('efectivo_recepcion');
  const [isPaid, setIsPaid] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const supabase = createClient();

      const resCode = `NOVA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Obtener datos de la habitación física
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('id, room_type_id')
        .eq('room_number', roomNumber)
        .single();

      if (roomError || !roomData) {
        throw new Error(`No se encontró la habitación ${roomNumber} en el sistema.`);
      }

      // 2. Registrar o actualizar huésped
      const { data: guestData, error: guestError } = await supabase
        .from('guests')
        .upsert(
          {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            doc_type: docType,
            doc_number: docNumber.trim(),
            email: email.trim() || `${docNumber.trim()}@hotelnovainn.com`,
            phone: phone.trim() || '999999999',
          },
          { onConflict: 'doc_type, doc_number' }
        )
        .select('id')
        .single();

      if (guestError || !guestData) {
        throw new Error(guestError ? guestError.message : 'Error al registrar los datos del huésped.');
      }

      // 3. Crear la Reserva
      const amount = parseFloat(totalAmount) || 120;
      const subtotal = Math.round((amount / 1.18) * 100) / 100;
      const igv = Math.round((amount - subtotal) * 100) / 100;

      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .insert({
          reservation_code: resCode,
          guest_id: guestData.id,
          channel: channel,
          check_in_date: checkIn,
          check_out_date: checkOut,
          guests_count: 2,
          rooms_requested_count: 1,
          subtotal_pen: subtotal,
          taxes_igv_pen: igv,
          total_amount_pen: amount,
          required_advance_pen: amount,
          status: isPaid ? 'confirmada' : 'pendiente_pago',
          confirmed_at: isPaid ? new Date().toISOString() : null,
        })
        .select('id')
        .single();

      if (resError || !resData) {
        throw new Error(resError ? resError.message : 'Error al guardar la reserva.');
      }

      // 4. Asignar Habitación Física en reservation_rooms
      const { error: resRoomError } = await supabase
        .from('reservation_rooms')
        .insert({
          reservation_id: resData.id,
          room_id: roomData.id,
          room_type_id: roomData.room_type_id,
          applied_price_per_night_pen: amount,
          nights_count: 1,
          line_total_pen: amount,
        });

      if (resRoomError) {
        console.error('Error al vincular habitación física:', resRoomError);
      }

      // 5. Registrar el pago si fue pagado inmediatamente
      if (isPaid) {
        await supabase.from('payments').insert({
          reservation_id: resData.id,
          payment_method: paymentMethod,
          amount_pen: amount,
          operation_number: `WALK-${Date.now().toString().slice(-6)}`,
          status: 'aprobado',
          verified_at: new Date().toISOString(),
        });

        // Actualizar estado de la habitación a ocupada
        await supabase
          .from('rooms')
          .update({ housekeeping_status: 'ocupada' })
          .eq('id', roomData.id);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Error al registrar reserva presencial:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Error al registrar reserva en la base de datos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="apple-glass rounded-[28px] max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 text-white max-h-[92vh] overflow-y-auto border border-white/[0.12] animate-in fade-in zoom-in-95 duration-200">
        {/* macOS Sheet Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="macos-dot macos-dot-red" />
              <span className="macos-dot macos-dot-yellow" />
              <span className="macos-dot macos-dot-green" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-400" />
                <span>Nueva Reserva (Walk-in / Teléfono)</span>
              </h3>
              <p className="text-[11px] text-slate-400">Ingreso directo a recepción con asignación física</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Segmented Control iOS para canal */}
          <div className="p-1 rounded-xl bg-black/40 border border-white/[0.08] grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setChannel('presencial')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                channel === 'presencial'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Counter / Presencial
            </button>
            <button
              type="button"
              onClick={() => setChannel('telefonica')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                channel === 'telefonica'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vía Telefónica
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Nombres *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Nombre del huésped"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Apellidos *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Apellidos"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Tipo de Documento *</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as IdentityDocType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
              >
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">N.° Documento *</label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Número"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="987654321"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Habitación N.°</label>
              <select
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
              >
                <option value="101">101 - Individual</option>
                <option value="102">102 - Individual</option>
                <option value="201">201 - Matrimonial</option>
                <option value="202">202 - Matrimonial</option>
                <option value="301">301 - Doble Twin</option>
                <option value="302">302 - Doble Twin</option>
                <option value="401">401 - Familiar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Check-in</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Check-out</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Total a Cobrar (S/)</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-sky-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Método de Pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
              >
                <option value="efectivo_recepcion">Efectivo en Recepción</option>
                <option value="yape">Yape</option>
                <option value="plin">Plin</option>
                <option value="tarjeta_credito_debito">Tarjeta (POS)</option>
              </select>
            </div>
          </div>

          {/* Toggle estilo iOS */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-slate-300 cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input
              type="checkbox"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="accent-blue-500 rounded h-4 w-4 cursor-pointer"
            />
            <span>Marcar como pago recibido y confirmar reserva de inmediato</span>
          </label>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="apple-pill-btn px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="apple-button-accent px-5 py-2 rounded-xl font-semibold text-xs tracking-wide flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Guardando...' : 'Crear Reserva'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
