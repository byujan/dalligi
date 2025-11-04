import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function OnboardingPage() {
  const user = await requireAuth()

  // If already connected to Strava, redirect to dashboard
  if (user.stravaConnected) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Activity className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Welcome, {user.fullName || 'there'}!
            </h1>
            <p className="text-lg text-slate-600">
              Let&apos;s connect your Strava account to get started
            </p>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Connect to Strava</CardTitle>
              <CardDescription>
                Link your Strava account to sync your activities and view your training insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Automatic Activity Sync</p>
                    <p className="text-sm text-muted-foreground">
                      Your activities are automatically synced when you upload to Strava
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Comprehensive Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      View detailed metrics including distance, time, elevation, and heart rate
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Privacy Focused</p>
                    <p className="text-sm text-muted-foreground">
                      We only read your activities - we never post or modify anything
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Link href="/api/auth/strava?onboarding=true" className="block">
                  <Button variant="strava" size="lg" className="w-full">
                    <Activity className="mr-2 h-5 w-5" />
                    Connect with Strava
                  </Button>
                </Link>

                <Link href="/dashboard" className="block">
                  <Button variant="outline" size="lg" className="w-full">
                    Skip for now
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                By connecting, you agree to share your activity data with this app
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
