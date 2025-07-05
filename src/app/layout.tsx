import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Poppins } from 'next/font/google'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '700', '900'] })

export const metadata: Metadata = {
  title: 'Quiz Milionário',
  description: 'Um jogo de perguntas e respostas inspirado no Show do Milhão.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.className} antialiased`}>
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow flex items-center justify-center w-full p-4">
            {children}
          </main>
          <footer className="text-center p-4 text-xs text-white/50">
            Este jogo é apenas para fins de entretenimento. Os valores são fictícios.
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
