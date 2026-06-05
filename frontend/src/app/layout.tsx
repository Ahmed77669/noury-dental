import './globals.css';
import { Outfit, Cairo } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata = {
  title: 'Noury Dental Opportunities Search Engine',
  description: 'Find dental jobs, internships, courses and residencies in Egypt by Noury.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${cairo.variable}`}>
      <body className="bg-[#0b0f19] text-[#f1f5f9] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
