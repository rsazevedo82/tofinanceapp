'use client'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-md rounded-t-2xl md:rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: '#161614', border: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{ background: '#161614', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-[#e8e6e1] tracking-tight">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 text-xs rounded-md">✕</button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}