import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'TomaAgora - Gerenciador de Medicamentos',
    description: 'Sistema de lembretes e controle de estoque de medicamentos',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR">
            <body>{children}</body>
        </html>
    )
}
