import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MataData — मतदाता | Election Information Assistant for India',
  description:
    'MataData helps Indian voters understand the election process, find polling booths, check voter registration, and get unbiased election news. Supports Hindi and English.',
  keywords: [
    'India elections',
    'voter registration',
    'polling booth',
    'election commission',
    'मतदाता',
    'चुनाव',
    'voter ID',
    'ECI',
    'NVSP',
  ],
  authors: [{ name: 'MataData Team' }],
  openGraph: {
    title: 'MataData — Election Information Assistant',
    description: 'Your AI-powered guide to Indian elections. Neutral, factual, bilingual.',
    type: 'website',
    locale: 'en_IN',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans bg-gray-950 text-gray-100 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
