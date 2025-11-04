import { requireAuth } from '@/lib/auth'
import { SidebarNav } from '@/components/sidebar-nav'
import { Header } from '@/components/header'
import { UnitsProvider } from '@/contexts/units-context'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <UnitsProvider>
      <div className="min-h-screen bg-slate-50">
        <Header user={user} />
        <div className="flex">
          <SidebarNav />
          <main className="flex-1 lg:ml-64">
            <div className="p-4 lg:p-8 mt-16 lg:mt-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </UnitsProvider>
  )
}
