import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// 1. OBTENER RESERVAS DEL USUARIO AUTENTICADO O POR CÓDIGO
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryCode = searchParams.get('codigo') || searchParams.get('code');
    const queryEmail = searchParams.get('email');

    const admin = createAdminClient();

    // Si viene un código de reserva directo
    if (queryCode && queryCode.trim().length > 0) {
      const { data: resByCode, error: codeError } = await admin
        .from('reservations')
        .select(`
          *,
          guests (*),
          reservation_rooms (
            *,
            room_types (*)
          ),
          payments (*)
        `)
        .eq('reservation_code', queryCode.trim().toUpperCase())
        .order('created_at', { ascending: false });

      if (!codeError && resByCode && resByCode.length > 0) {
        return NextResponse.json({ reservations: resByCode });
      }
    }

    const supabaseUser = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    const effectiveEmail = user?.email || (queryEmail ? queryEmail.trim().toLowerCase() : null);

    if (!effectiveEmail) {
      // Si no hay email ni código, devolver lista vacía en lugar de 401 para permitir renderizado limpio
      return NextResponse.json({ reservations: [] });
    }

    // 1. Buscar los guest_id asociados al correo o auth_user_id
    const { data: guests, error: guestError } = await admin
      .from('guests')
      .select('id')
      .or(`email.ilike.${effectiveEmail}${user?.id ? `,auth_user_id.eq.${user.id}` : ''}`);

    if (guestError) {
      console.error('Error buscando huésped en API:', guestError);
      return NextResponse.json({ error: guestError.message }, { status: 500 });
    }

    if (!guests || guests.length === 0) {
      return NextResponse.json({ reservations: [] });
    }

    const guestIds = guests.map((g) => g.id);

    // 2. Buscar todas las reservas de esos guest_ids
    const { data: reservations, error: resError } = await admin
      .from('reservations')
      .select(`
        *,
        guests (*),
        reservation_rooms (
          *,
          room_types (*)
        ),
        payments (*)
      `)
      .in('guest_id', guestIds)
      .order('created_at', { ascending: false });

    if (resError) {
      console.error('Error buscando reservas en API:', resError);
      return NextResponse.json({ error: resError.message }, { status: 500 });
    }

    return NextResponse.json({ reservations: reservations || [] });
  } catch (err: unknown) {
    console.error('Error en GET /api/guest/reservations:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// 2. CONSULTAR RESERVA POR CÓDIGO + DNI / CORREO (DOBLE FACTOR)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reservationCode, docOrEmail } = body;

    if (!reservationCode || !docOrEmail) {
      return NextResponse.json(
        { error: 'Debes proporcionar el código de reserva y tu documento o correo.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: reservations, error } = await admin
      .from('reservations')
      .select(`
        *,
        guests (*),
        reservation_rooms (
          *,
          room_types (*)
        ),
        payments (*)
      `)
      .eq('reservation_code', reservationCode.trim().toUpperCase())
      .order('created_at', { ascending: false });

    if (error || !reservations || reservations.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró ninguna reserva con el código ingresado.' },
        { status: 404 }
      );
    }

    const input = docOrEmail.trim().toLowerCase();

    // Validar coincidencia estricta con el documento o correo del titular
    const matches = reservations.filter((r) => {
      const gDoc = r.guests?.doc_number?.toLowerCase() || '';
      const gEmail = r.guests?.email?.toLowerCase() || '';
      return gDoc === input || gEmail === input;
    });

    if (matches.length === 0) {
      return NextResponse.json(
        { error: 'El código existe pero el documento o correo no coincide con el registro del huésped.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ reservations: matches });
  } catch (err: unknown) {
    console.error('Error en POST /api/guest/reservations:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
