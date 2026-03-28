'use client'

export function ReportTabLoading() {
  return (
    <div className="card">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-40 rounded bg-[#E5E7EB]" />
        <div className="h-3 w-56 rounded bg-[#E5E7EB]" />
        <div className="h-56 rounded bg-[#F3F4F6]" />
      </div>
    </div>
  )
}
