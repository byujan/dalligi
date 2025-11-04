import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Activity, BarChart3, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'

export default async function HomePage() {
  // Check if user is already authenticated
  const user = await getCurrentUser()
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header user={null} />

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Dalligi
          </h1>
          <p className="text-xl text-slate-600 mb-4">
            Elevate your training with beautiful insights
          </p>
          <p className="text-lg text-slate-500 mb-8">
            Track and analyze your Strava activities with comprehensive metrics and elegant visualizations
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>

          <p className="text-sm text-slate-500 mt-4">
            Free to use • Secure authentication • Your data stays private
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Activity Insights</CardTitle>
              <CardDescription>
                View detailed metrics for all your activities including distance, time, elevation, and heart rate
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Performance Tracking</CardTitle>
              <CardDescription>
                Track your progress over time with comprehensive summaries and trend analysis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Real-time Sync</CardTitle>
              <CardDescription>
                Automatic syncing with Strava keeps your data always up-to-date via webhooks
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How it Works */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            How It Works
          </h2>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Create Your Account
                </h3>
                <p className="text-slate-600">
                  Sign up with email and password in seconds. Your data is encrypted and secure.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Connect to Strava
                </h3>
                <p className="text-slate-600">
                  Link your Strava account to sync your activities. We only read data - never post or modify anything.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Analyze Your Performance
                </h3>
                <p className="text-slate-600">
                  View beautiful insights, track your progress, and discover patterns in your training.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-2xl mx-auto mt-20 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Join today and start tracking your athletic journey
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8 py-6">
              <Activity className="mr-2 h-5 w-5" />
              Create Free Account
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="max-w-4xl mx-auto mt-20 pt-8 border-t border-slate-200 text-center">
          <p className="text-slate-500 text-sm">
            Built with Next.js 14, Supabase, and Strava API
          </p>
        </div>
      </div>
    </div>
  )
}
