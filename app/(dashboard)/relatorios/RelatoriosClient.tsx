'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { ReportTabLoading } from '@/components/reports/ReportTabLoading'
import { ErrorStatePanel, LoadingStatePanel } from '@/components/ui/StatePanel'
import { useReports } from '@/hooks/useReports'
import { useCouple } from '@/hooks/useCouple'
import { c } from '@/lib/utils/copy'
import type { ReportsPayload } from '@/types'

function MonthSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const now = new Date()
  const options = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return { value: v, label: `${months[d.getMonth()]} ${d.getFullYear()}` }
  })

  return (
    <select className="input text-sm py-2 px-3 min-h-[44px]" value={value} onChange={e => onChange(e.target.value)} style={{ width: 'auto' }}>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

type ReportsTabKey = 'categories' | 'monthly' | 'flow' | 'compare' | 'cards' | 'projection'
type ReportsTabProps = { data: ReportsPayload; isCouple: boolean }

const TABS: { key: ReportsTabKey; label: string }[] = [
  { key: 'categories', label: 'Categorias' },
  { key: 'monthly', label: 'Evolução' },
  { key: 'flow', label: 'Fluxo diário' },
  { key: 'compare', label: 'Comparativo' },
  { key: 'cards', label: 'Cartões' },
  { key: 'projection', label: 'Projeção' },
]

const tabComponents: Record<ReportsTabKey, React.ComponentType<ReportsTabProps>> = {
  categories: dynamic(() => import('@/components/reports/tabs/CategoriesTab'), { loading: () => <ReportTabLoading />, ssr: false }),
  monthly: dynamic(() => import('@/components/reports/tabs/MonthlyTab'), { loading: () => <ReportTabLoading />, ssr: false }),
  flow: dynamic(() => import('@/components/reports/tabs/FlowTab'), { loading: () => <ReportTabLoading />, ssr: false }),
  compare: dynamic(() => import('@/components/reports/tabs/CompareTab'), { loading: () => <ReportTabLoading />, ssr: false }),
  cards: dynamic(() => import('@/components/reports/tabs/CardsTab'), { loading: () => <ReportTabLoading />, ssr: false }),
  projection: dynamic(() => import('@/components/reports/tabs/ProjectionTab'), { loading: () => <ReportTabLoading />, ssr: false }),
}

export default function RelatoriosPage() {
  const now = new Date()
  const def = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [month, setMonth] = useState(def)
  const [activeTab, setActiveTab] = useState<ReportsTabKey>('categories')

  const { data: couple } = useCouple()
  const isCouple = !!couple
  const { data, isLoading, error } = useReports(month)

  const ActiveTab = tabComponents[activeTab]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="flex flex-col gap-4 mb-7 md:mb-8">
        <div>
          <h1 className="page-title">
            {c(isCouple, 'Seus relatórios', 'Relatórios de vocês')}
          </h1>
          <p className="page-subtitle mt-1">
            {c(isCouple, 'Entenda melhor seu dinheiro', 'Entendam como vocês estão usando o dinheiro')}
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <MonthSelector value={month} onChange={setMonth} />
        </div>
      </div>

      <div className="flex gap-1 mb-5 md:mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            data-active={activeTab === tab.key}
            className="motion-tab px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: activeTab === tab.key ? 'rgba(255,127,80,0.1)' : 'transparent',
              color: activeTab === tab.key ? '#FF7F50' : '#334155',
              border: activeTab === tab.key ? '1px solid rgba(255,127,80,0.25)' : '1px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingStatePanel rows={4} />
      ) : null}

      {error ? (
        <ErrorStatePanel
          description={`Erro ao carregar relatórios: ${(error as Error).message}`}
          onRetry={() => window.location.reload()}
        />
      ) : null}

      {data && !isLoading ? (
        <div className="space-y-4">
          <ActiveTab data={data} isCouple={isCouple} />
        </div>
      ) : null}
    </div>
  )
}

