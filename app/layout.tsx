import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Multilingual events',
  description: 'Live events every listener hears in their own language.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer>
          Live translation by{' '}
          <a href="https://mediasfu.com/?utm_source=tpl-event&utm_medium=template&utm_campaign=growth-2026q4">
            MediaSFU
          </a>
        </footer>
      </body>
    </html>
  );
}
