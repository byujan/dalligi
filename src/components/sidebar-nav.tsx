'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Brain,
  TrendingUp,
  Settings,
  Activity,
  Menu,
  X,
  ClipboardList,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview',
  },
  {
    name: 'Training Calendar',
    href: '/dashboard/calendar',
    icon: Calendar,
    description: 'Schedule and track workouts',
  },
  {
    name: 'Training Plan',
    href: '/dashboard/training-plan',
    icon: ClipboardList,
    description: 'Build your training program',
  },
  {
    name: 'Performance Analytics',
    href: '/dashboard/analytics',
    icon: TrendingUp,
    description: 'Detailed metrics and trends',
  },
  {
    name: 'AI Coaching',
    href: '/dashboard/coaching',
    icon: Brain,
    description: 'Personalized insights',
  },
]

export function SidebarNav() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:w-64',
          isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-slate-200">
            <Link
              href="/dashboard"
              className="flex items-center gap-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">Dalligi</h2>
                <p className="text-xs text-slate-500">Training Hub</p>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href))
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg transition-all',
                    'hover:bg-slate-100',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-slate-700'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0',
                      isActive ? 'text-primary' : 'text-slate-400'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {item.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Settings Footer */}
          <div className="p-4 border-t border-slate-200">
            <Link
              href="/dashboard/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg transition-all',
                'hover:bg-slate-100',
                pathname === '/dashboard/settings'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-700'
              )}
            >
              <Settings
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  pathname === '/dashboard/settings' ? 'text-primary' : 'text-slate-400'
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Settings</p>
                <p className="text-xs text-slate-500 truncate">
                  Account and preferences
                </p>
              </div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
