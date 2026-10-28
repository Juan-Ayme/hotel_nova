import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(`${origin}/login?alerta=sesion_cerrada`, {
    status: 303,
  });
}

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  // IMPORTANTE: Nunca cerrar sesión en una petición GET para evitar que
  // navegadores o Next.js prefetching cierren la sesión automáticamente en segundo plano.
  return NextResponse.redirect(`${origin}/`);
}
