interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
        <span className="text-2xl">💳</span>
      </div>
      <h3 className="text-[#0F172A] font-medium mb-1">{title}</h3>
      <p className="text-[#6B7280] text-sm mb-4 max-w-xs">{description}</p>
      {action}
    </div>
  )
}