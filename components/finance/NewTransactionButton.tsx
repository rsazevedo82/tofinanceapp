'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Modal } from '@/components/ui/Modal'

const TransactionForm = dynamic(
  () => import('@/components/finance/TransactionForm').then(m => m.TransactionForm),
  { ssr: false }
)

export function NewTransactionButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-primary text-xs">
        <span className="opacity-60">+</span>
        Nova transação
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nova transação">
        <TransactionForm onSuccess={() => setIsOpen(false)} />
      </Modal>
    </>
  )
}
