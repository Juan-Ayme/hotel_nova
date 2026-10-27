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
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(`${origin}/login?alerta=sesion_cerrada`);
}
