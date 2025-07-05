import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Quicksand } from 'next/font/google'

const quicksand = Quicksand({ subsets: ['latin'], weight: ['400', '500', '700'] })

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
      <body className={`${quicksand.className} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
