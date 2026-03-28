import type { Metadata } from 'next'
import { buildSocialMetadata } from '@/lib/socialMeta'

export const metadata: Metadata = {
  title: 'Divisão de Despesas | Nós 2 Reais',
  description: 'Registre, acompanhe e quite pendências de despesas em casal com clareza.',
  ...buildSocialMetadata({
    title: 'Divisão de Despesas | Nós 2 Reais',
    description: 'Registre, acompanhe e quite pendências de despesas em casal com clareza.',
    imagePath: '/social/og-divisao.svg',
    imageAlt: 'Divisão de despesas no Nós 2 Reais',
  }),
}

export default function DivisaoLayout({ children }: { children: React.ReactNode }) {
  return children
}

