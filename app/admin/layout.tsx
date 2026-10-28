import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ReceptionRealtimeListener from '@/components/admin/ReceptionRealtimeListener';
import { UserRole } from '@/types/hotel.types';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect('/login?next=/admin');
  }

  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('role, is_active, full_name, avatar_url')
    .or(`google_email.ilike.${user.email},auth_user_id.eq.${user.id}`)
    .maybeSingle();

  if (!staff || !staff.is_active) {
    redirect('/mis-reservas?alerta=acceso_restringido_personal');
  }

  const userEmail = user.email;
  const fullName = staff.full_name || user.user_metadata?.full_name || userEmail.split('@')[0];
  const avatarUrl = staff.avatar_url || user.user_metadata?.avatar_url || null;
  const role = staff.role as UserRole;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#070b12] via-[#0d131f] to-[#0a0e17] text-slate-100">
      <AdminSidebar
        userEmail={userEmail}
        fullName={fullName}
        avatarUrl={avatarUrl}
        role={role}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto">{children}</main>
      </div>
      <ReceptionRealtimeListener />
    </div>
  );
}
