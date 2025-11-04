import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { LogOut, Activity } from 'lucide-react'
import Link from 'next/link'

interface HeaderProps {
  user: User | null
}

async function LogoutButton() {
  async function handleLogout() {
    'use server'
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    await supabase.auth.signOut()
  }

  return (
    <form action={handleLogout}>
      <Button variant="outline" size="sm" type="submit">
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </form>
  )
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Dalligi</h1>
          </Link>

          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">
                  {user.fullName || user.firstname ? (
                    user.fullName || `${user.firstname} ${user.lastname}`
                  ) : (
                    user.email
                  )}
                </p>
                {user.city && user.country && (
                  <p className="text-xs text-muted-foreground">
                    {user.city}, {user.country}
                  </p>
                )}
              </div>
              {user.profilePhoto && (
                <img
                  src={user.profilePhoto}
                  alt={user.fullName || 'User'}
                  className="w-10 h-10 rounded-full border-2 border-primary"
                />
              )}
              <LogoutButton />
            </div>
          )}

          {!user && (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
