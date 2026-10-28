import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const reservationId = formData.get('reservationId') as string | null;
    const reservationCode = formData.get('reservationCode') as string | null;
    const paymentMethod = (formData.get('paymentMethod') as string) || 'yape';
    const operationNumber = (formData.get('operationNumber') as string) || '';
    const amountStr = formData.get('amount') as string | null;
    const file = formData.get('voucherFile') as File | null;

    if (!operationNumber.trim()) {
      return NextResponse.json(
        { error: 'El número de operación es obligatorio para validar el pago.' },
        { status: 400 }
      );
    }

    if (!reservationId && !reservationCode) {
      return NextResponse.json(
        { error: 'Se requiere el ID o código de la reserva.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Obtener la reserva para validar ID y Monto
    let query = admin.from('reservations').select('id, reservation_code, total_amount_pen, status, guest_id');
    if (reservationId && reservationId.length === 36) {
      query = query.eq('id', reservationId);
    } else if (reservationCode) {
      query = query.eq('reservation_code', reservationCode.trim().toUpperCase());
    }

    const { data: resData, error: resError } = await query.single();

    if (resError || !resData) {
      return NextResponse.json(
        { error: 'No se encontró la reserva en el sistema.' },
        { status: 404 }
      );
    }

    const targetResId = resData.id;
    const targetCode = resData.reservation_code;
    const amount = amountStr ? parseFloat(amountStr) : resData.total_amount_pen;

    // 2. Subir imagen a Storage SI EL USUARIO LA ADJUNTÓ (Opcional)
    let voucherUrl: string | null = null;
    if (file && file.size > 0 && typeof file.name === 'string') {
      try {
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `voucher-${targetCode}-${Date.now()}.${fileExt}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: storageError } = await admin.storage
          .from('payment-vouchers')
          .upload(fileName, buffer, {
            contentType: file.type || 'image/png',
            upsert: true,
          });

        if (!storageError) {
          voucherUrl = fileName;
        } else {
          console.warn('Advertencia al guardar voucher en storage:', storageError);
        }
      } catch (storageErr) {
        console.warn('Error al procesar archivo de voucher:', storageErr);
      }
    }

    // 3. Insertar registro en la tabla `payments`
    const { data: newPayment, error: payError } = await admin
      .from('payments')
      .insert({
        reservation_id: targetResId,
        payment_method: paymentMethod,
        amount_pen: amount,
        operation_number: operationNumber.trim(),
        voucher_image_url: voucherUrl,
        status: 'en_verificacion',
      })
      .select()
      .single();

    if (payError) {
      console.error('Error insertando pago:', payError);
      return NextResponse.json(
        { error: 'No se pudo registrar el pago en la base de datos: ' + payError.message },
        { status: 500 }
      );
    }

    // 4. Actualizar estado de la reserva a 'pago_en_verificacion'
    const { error: updateResError } = await admin
      .from('reservations')
      .update({ status: 'pago_en_verificacion' })
      .eq('id', targetResId);

    if (updateResError) {
      console.error('Error actualizando reserva:', updateResError);
    }

    // 5. Vincular cuenta de usuario al registro del huésped para que quede guardada en su perfil
    try {
      const supabaseUser = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabaseUser.auth.getUser();

      if (user?.id && resData.guest_id) {
        await admin
          .from('guests')
          .update({ auth_user_id: user.id })
          .eq('id', resData.guest_id);
      }
    } catch (authLinkErr) {
      console.warn('Nota al vincular auth_user_id en pago:', authLinkErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Comprobante y número de operación registrados para verificación.',
      payment: newPayment,
      reservationCode: targetCode,
    });
  } catch (err: unknown) {
    console.error('Error en POST /api/guest/payments:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno al procesar el pago' },
      { status: 500 }
    );
  }
}
