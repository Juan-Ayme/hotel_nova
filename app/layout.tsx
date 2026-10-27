import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hotel Nova Inn — Hospedaje Cómodo y Moderno en Perú',
  description:
    'Bienvenido al Hotel Nova Inn. Disfruta de habitaciones confortables, atención 24 horas, reservas en línea y pagos seguros con Yape, Plin y transferencias.',
  keywords: [
    'Hotel Nova Inn',
    'hotel en Perú',
    'reservar habitaciones',
    'hospedaje cómodo',
    'hotel con cochera',
    'pagar con Yape hotel',
  ],
  authors: [{ name: 'Hotel Nova Inn' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Hotel Nova Inn — Plataforma Oficial de Reservas',
    description: 'Reserva tu habitación al instante con confirmación garantizada y atención personalizada.',
    type: 'website',
    locale: 'es_PE',
    siteName: 'Hotel Nova Inn',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className="h-full antialiased dark"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('nova_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'light' || (!saved && !prefersDark)) {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col text-stone-900 dark:text-stone-100 selection:bg-orange-500 selection:text-white transition-colors duration-300"
      >
        {children}
      </body>
    </html>
  );
}
