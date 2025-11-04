import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { SignupForm } from '@/components/signup-form'

export default async function SignupPage() {
  const user = await getCurrentUser()

  // If already authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <SignupForm />
    </div>
  )
}
