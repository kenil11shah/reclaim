import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter/wght.css';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://reclaim.vercel.app'),
  title: { default: 'Reclaim: help after image abuse', template: '%s · Reclaim' },
  description:
    'Free, private help for people in India whose intimate, morphed or AI-made images were shared without consent. Know what to do, where to report, and which platforms are failing you.',
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
  referrer: 'no-referrer',
  openGraph: { title: 'Reclaim', description: 'Know what to do, where to report, and which platforms are failing you.', type: 'website' },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf8f4' },
    { media: '(prefers-color-scheme: dark)', color: '#16141f' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-bg font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
