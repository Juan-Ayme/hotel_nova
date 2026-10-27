import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import WhatsAppFloatingBtn from '@/components/public/WhatsAppFloatingBtn';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen text-stone-900 dark:text-stone-100 transition-colors duration-300">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloatingBtn />
    </div>
  );
}
