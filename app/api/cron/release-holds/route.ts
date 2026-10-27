import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Cron Job / Webhook para liberar automáticamente reservas con bloqueo de 15 minutos vencido
 * Puede ejecutarse periódicamente mediante pg_cron, Vercel Cron o un webhook programado.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Validación opcional de seguridad si se configuró un CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'No autorizado. Token de cron inválido.' },
        { status: 401 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const nowIso = new Date().toISOString();

    // Actualizar a 'cancelada' todas las reservas pendientes cuyo expires_at haya vencido
    const { data: cancelled, error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelada',
        cancellation_reason: 'Bloqueo temporal de 15 minutos expiró sin registro de pago.',
        cancelled_at: nowIso,
        updated_at: nowIso,
      })
      .eq('status', 'pendiente_pago')
      .lt('expires_at', nowIso)
      .select('id, reservation_code, expires_at');

    if (error) {
      console.error('Error al liberar bloqueos de 15 min:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Registrar en auditoría si se liberaron reservas
    if (cancelled && cancelled.length > 0) {
      for (const res of cancelled) {
        await supabase.from('audit_logs').insert({
          action_type: 'CANCEL_EXPIRED_HOLD',
          entity_table: 'reservations',
          entity_id: res.id,
          staff_google_email: 'sistema.cron@hotelnovainn.com',
          new_data: {
            reason: 'Bloqueo preventivo de 15 minutos expiró sin registro de pago.',
            reservation_code: res.reservation_code,
            expired_at: res.expires_at,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Se liberaron ${cancelled?.length || 0} reserva(s) expirada(s).`,
      count: cancelled?.length || 0,
      released: cancelled?.map((c) => c.reservation_code) || [],
      timestamp: nowIso,
    });
  } catch (err: unknown) {
    console.error('Fallo inesperado en release-holds cron:', err);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
