import './globals.css';
import Script from 'next/script';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/Navbar/Navbar';
import MobileNav from '@/components/MobileNav/MobileNav';
import CustomCursor from '@/components/CustomCursor';
import CookieConsent from '@/components/CookieConsent';

export const metadata = {
  title: 'Sutras — The Student OS',
  description: 'Find notes, PYQs, assignments, and ace your exams with a sleek platform built for modern students.',
  keywords: 'notes, pyqs, assignments, college, exam prep, study material, sutras, futuristic',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense — Replace ca-pub-XXXXXXXXXXXXXXXX with your real publisher ID */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <CustomCursor />
            <Navbar />
            <main>{children}</main>
            <MobileNav />
            <CookieConsent />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

