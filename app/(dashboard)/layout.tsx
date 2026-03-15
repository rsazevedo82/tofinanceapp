import { Sidebar } from '@/components/ui/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#111110]">
      <Sidebar />
      <main className="flex-1 md:ml-56 min-h-screen">
        {children}
      </main>
    </div>
  )
}