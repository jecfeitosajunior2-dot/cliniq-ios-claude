import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClinIQ - O Shazam da Consulta Médica",
  description: "Toque. Consulte. Receba o caso reconstruído.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
