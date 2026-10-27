import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const rawNext = searchParams.get('next') ?? '/mis-reservas';

  // Protección estricta contra Open Redirect: solo permitir rutas relativas seguras
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/mis-reservas';

  const supabase = await createServerSupabaseClient();

  // 1. Verificación por código PKCE (flujo por defecto de Supabase)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user?.email) {
      const userEmail = data.user.email;

      // Si intenta ingresar al panel de administración (/admin), verificar Whitelist
      if (next.startsWith('/admin')) {
        const { data: staff, error: staffError } = await supabase
          .from('staff_profiles')
          .select('role, is_active')
          .ilike('google_email', userEmail)
          .single();

        if (staffError || !staff || !staff.is_active) {
          return NextResponse.redirect(
            `${origin}/mis-reservas?alerta=acceso_restringido_personal`
          );
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 2. Verificación por token_hash (enlaces mágicos directos)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error && data.user?.email) {
      const userEmail = data.user.email;

      if (next.startsWith('/admin')) {
        const { data: staff, error: staffError } = await supabase
          .from('staff_profiles')
          .select('role, is_active')
          .ilike('google_email', userEmail)
          .single();

        if (staffError || !staff || !staff.is_active) {
          return NextResponse.redirect(
            `${origin}/mis-reservas?alerta=acceso_restringido_personal`
          );
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=enlace_invalido_o_expirado`);
}
