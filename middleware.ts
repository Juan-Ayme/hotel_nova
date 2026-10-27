import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    // Si aún no se configuran las claves de Supabase, permitir la navegación para desarrollo local
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Proteger todo el Panel de Administración (/admin)
  if (pathname.startsWith('/admin')) {
    if (!user || !user.email) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { data: staffProfile } = await supabase
      .from('staff_profiles')
      .select('role, is_active')
      .ilike('google_email', user.email)
      .single();

    if (!staffProfile || !staffProfile.is_active) {
      return NextResponse.redirect(new URL('/mis-reservas?alerta=acceso_restringido_personal', request.url));
    }

    // Rutas exclusivas para el Rol Administrador / Gerencia
    const adminOnlyPaths = ['/admin/habitaciones', '/admin/reportes', '/admin/configuracion'];
    const isTryingAdminOnly = adminOnlyPaths.some((p) => pathname.startsWith(p));

    if (isTryingAdminOnly && staffProfile.role !== 'administrador') {
      return NextResponse.redirect(new URL('/admin?error=permiso_exclusivo_gerencia', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*'],
};
