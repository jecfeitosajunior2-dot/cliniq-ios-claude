import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ClinIQ v9 - Clinical Detective',
  description: 'ClinIQ — o Shazam da consulta médica com Clinical Detective e dossiê premium.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: '#0f172a' }}>{children}</body>
    </html>
  )
}
