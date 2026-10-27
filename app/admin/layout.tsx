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

  let userEmail = user?.email || 'admin.novainn@gmail.com';
  let fullName = user?.user_metadata?.full_name || 'Personal Hotel Nova Inn';
  let avatarUrl = user?.user_metadata?.avatar_url || null;
  let role: UserRole = 'administrador';

  if (user?.email) {
    const { data: staff } = await supabase
      .from('staff_profiles')
      .select('role, is_active, full_name, avatar_url')
      .ilike('google_email', user.email)
      .single();

    if (staff && staff.is_active) {
      role = staff.role;
      fullName = staff.full_name || fullName;
      avatarUrl = staff.avatar_url || avatarUrl;
    }
  }

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
