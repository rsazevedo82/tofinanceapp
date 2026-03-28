'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const touchStartY = useRef<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const id = window.requestAnimationFrame(() => {
      const root = contentRef.current
      if (!root) return

      const firstFocusable = root.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    })

    return () => window.cancelAnimationFrame(id)
  }, [isOpen])

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartY.current = event.touches[0]?.clientY ?? null
    setIsDragging(true)
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartY.current === null) return
    const currentY = event.touches[0]?.clientY ?? touchStartY.current
    const delta = Math.max(0, currentY - touchStartY.current)
    setDragOffset(delta)
  }

  function handleTouchEnd() {
    if (dragOffset > 88) {
      onClose()
    }
    touchStartY.current = null
    setDragOffset(0)
    setIsDragging(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="motion-sheet top-auto left-0 bottom-0 w-full max-w-none translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none p-0 sm:top-1/2 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:rounded-b-xl"
        style={{ background: '#ffffff', border: '1px solid #D1D5DB', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div
          className="sm:hidden flex justify-center pt-2 pb-1"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="h-1 w-10 rounded-full bg-[#CBD5E1]" />
        </div>
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{ background: '#ffffff', borderBottom: '1px solid #D1D5DB' }}
        >
          <DialogTitle className="text-sm font-semibold text-[#0F172A] tracking-tight">
            {title}
          </DialogTitle>
          <button onClick={onClose} className="btn-ghost p-1.5 text-xs rounded-md" aria-label="Fechar modal">✕</button>
        </div>
        <div
          ref={contentRef}
          className="px-5 py-5 max-h-[min(72vh,calc(100dvh-11rem))] sm:max-h-[70vh] overflow-y-auto"
          style={{
            paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
            transform: `translateY(${dragOffset}px)`,
            transition: isDragging ? 'none' : 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
