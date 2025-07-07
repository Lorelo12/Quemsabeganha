import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Orbitron, Barlow } from 'next/font/google'

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-orbitron',
});

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-barlow',
});

export const metadata: Metadata = {
  title: 'Quem Sabe, Ganha!',
  description: 'Um jogo de perguntas e respostas valendo um prêmio milionário!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${orbitron.variable} ${barlow.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <main className="flex-grow flex items-center justify-center w-full p-4">
          {children}
        </main>
        <footer className="text-center p-4 text-xs text-white/50">
          Este jogo é apenas para fins de entretenimento. Os valores são fictícios.
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
