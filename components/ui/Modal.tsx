'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-auto left-0 bottom-0 w-full max-w-none translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none p-0 sm:top-1/2 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:rounded-b-xl"
        style={{ background: '#ffffff', border: '1px solid #D1D5DB' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{ background: '#ffffff', borderBottom: '1px solid #D1D5DB' }}
        >
          <DialogTitle className="text-sm font-semibold text-[#0F172A] tracking-tight">
            {title}
          </DialogTitle>
          <button onClick={onClose} className="btn-ghost p-1.5 text-xs rounded-md" aria-label="Fechar modal">✕</button>
        </div>
        <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
