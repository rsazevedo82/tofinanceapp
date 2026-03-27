// app/offline/page.tsx
// Exibida pelo service worker quando não há conexão
'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#FDFCF0] flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <p className="text-4xl mb-4">📡</p>
        <h1 className="text-lg font-semibold text-[#0F172A] mb-2">
          Você está offline
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Verifique sua conexão e tente novamente.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary text-sm px-6 py-2.5"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
