import { Inter } from "next/font/google";
import "./globals.css";
import ClientProviders from './components/ClientProviders';
import AuthNavWrapper from './components/AuthNavWrapper';

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});

export const metadata = {
  title: 'Practice ERP',
  description: 'Comprehensive exam preparation platform for Business Tech and ERP exams',
  other: {
    'cache-control': 'no-cache, no-store, must-revalidate',
    'pragma': 'no-cache',
    'expires': '0'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <ClientProviders>
          <AuthNavWrapper />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
