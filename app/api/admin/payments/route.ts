import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// 1. LISTAR TODOS LOS PAGOS (Solo para personal del hotel)
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Validar si el usuario está en staff_profiles
    const { data: staff } = await admin
      .from('staff_profiles')
      .select('id, role, is_active')
      .or(`google_email.ilike.${user.email},auth_user_id.eq.${user.id}`)
      .maybeSingle();

    if (!staff || !staff.is_active) {
      return NextResponse.json({ error: 'Acceso restringido a personal autorizado' }, { status: 403 });
    }

    // Consultar todos los pagos con sus reservas y huéspedes
    const { data: payments, error } = await admin
      .from('payments')
      .select(`
        id,
        reservation_id,
        payment_method,
        amount_pen,
        operation_number,
        voucher_image_url,
        status,
        rejection_reason,
        verified_at,
        created_at,
        reservations (
          id,
          reservation_code,
          status,
          guests (
            first_name,
            last_name,
            doc_number,
            email,
            phone
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al consultar pagos admin:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ payments: payments || [] });
  } catch (err: unknown) {
    console.error('Error en GET /api/admin/payments:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno al cargar pagos' },
      { status: 500 }
    );
  }
}

// 2. APROBAR O RECHAZAR PAGO
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: staff } = await admin
      .from('staff_profiles')
      .select('id, role, is_active')
      .or(`google_email.ilike.${user.email},auth_user_id.eq.${user.id}`)
      .maybeSingle();

    if (!staff || !staff.is_active) {
      return NextResponse.json({ error: 'Acceso restringido a personal autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { paymentId, action, rejectionReason } = body;

    if (!paymentId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    // Obtener datos del pago
    const { data: payment, error: pError } = await admin
      .from('payments')
      .select('id, reservation_id, status')
      .eq('id', paymentId)
      .single();

    if (pError || !payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    if (action === 'approve') {
      // 1. Marcar pago como aprobado
      const { error: payErr } = await admin
        .from('payments')
        .update({
          status: 'aprobado',
          verified_at: new Date().toISOString(),
          verified_by_staff: staff.id,
        })
        .eq('id', paymentId);

      if (payErr) {
        console.error('Error al actualizar pago:', payErr);
        return NextResponse.json({ error: 'Error al actualizar pago: ' + payErr.message }, { status: 500 });
      }

      // 2. Confirmar reserva
      if (payment.reservation_id) {
        const { error: resErr } = await admin
          .from('reservations')
          .update({
            status: 'confirmada',
            confirmed_at: new Date().toISOString(),
          })
          .eq('id', payment.reservation_id);

        if (resErr) {
          console.error('Error al confirmar reserva:', resErr);
          return NextResponse.json({ error: 'Error al confirmar reserva: ' + resErr.message }, { status: 500 });
        }
      }

      return NextResponse.json({ success: true, message: 'Pago aprobado y reserva confirmada exitosamente.' });
    } else {
      // Rechazar pago
      const { error: rejErr } = await admin
        .from('payments')
        .update({
          status: 'rechazado',
          verified_at: new Date().toISOString(),
          verified_by_staff: staff.id,
          rejection_reason: rejectionReason || 'Comprobante no válido o pago no verificado en cuenta',
        })
        .eq('id', paymentId);

      if (rejErr) {
        console.error('Error al rechazar pago:', rejErr);
        return NextResponse.json({ error: 'Error al rechazar pago: ' + rejErr.message }, { status: 500 });
      }

      // Revertir reserva a pendiente_pago para permitir nuevo intento
      if (payment.reservation_id) {
        await admin
          .from('reservations')
          .update({
            status: 'pendiente_pago',
          })
          .eq('id', payment.reservation_id);
      }

      return NextResponse.json({ success: true, message: 'Pago marcado como rechazado.' });
    }
  } catch (err: unknown) {
    console.error('Error en POST /api/admin/payments:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno al procesar el pago' },
      { status: 500 }
    );
  }
}
