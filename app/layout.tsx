import { Inter } from "next/font/google";
import "./globals.css";
import ClientProviders from './components/ClientProviders';
import AuthNav from './components/AuthNav';

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});

export const metadata = {
  title: 'Practice SAP',
  description: 'Comprehensive exam preparation platform for Business Tech and SAP exams',
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
          <AuthNav />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
