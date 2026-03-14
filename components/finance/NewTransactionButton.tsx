'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { TransactionForm } from '@/components/finance/TransactionForm'

export function NewTransactionButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto"
      >
        <span className="text-lg leading-none">+</span>
        Nova transação
      </button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Nova transação"
      >
        <TransactionForm onSuccess={() => setIsOpen(false)} />
      </Modal>
    </>
  )
}