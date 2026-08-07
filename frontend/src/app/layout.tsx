import type { Metadata } from 'next';
import { Poppins, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EcoMetric — EPD Generator for Industrial Chillers',
  description:
    'Generate Environmental Product Declarations for industrial chillers. Built for Indian OEMs exporting to the EU under the 2027 CPR mandate.',
  keywords: [
    'EPD',
    'Environmental Product Declaration',
    'industrial chiller',
    'lifecycle assessment',
    'EU CPR',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${jetBrainsMono.variable}`}
    >
      <body
        className="min-h-screen bg-[#0D0D0C] text-[#F2EFE9] antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
