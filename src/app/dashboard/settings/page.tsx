'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, User, Activity, Shield, Bell, CheckCircle2, XCircle, Loader2, Ruler } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUnits, type Units } from '@/contexts/units-context'

interface ProfileData {
  id: string
  email: string
  full_name: string | null
  strava_athlete_id: string | null
  strava_connected: boolean
  units_preference: Units
}

export default function SettingsPage() {
  const { units, setUnits } = useUnits()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [fullName, setFullName] = useState('')
  const [selectedUnits, setSelectedUnits] = useState<Units>('metric')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setFullName(data.full_name || '')
      setSelectedUnits(data.units_preference || 'metric')
    } catch (error) {
      console.error('Error loading profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile() {
    if (!profile) return

    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profile.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully' })
      setProfile({ ...profile, full_name: fullName })
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  async function handleUnitsChange(newUnits: Units) {
    if (!profile) return

    setSaving(true)
    setMessage(null)

    try {
      await setUnits(newUnits)
      setSelectedUnits(newUnits)
      setProfile({ ...profile, units_preference: newUnits })
      setMessage({ type: 'success', text: `Units changed to ${newUnits}` })
    } catch (error) {
      console.error('Error changing units:', error)
      setMessage({ type: 'error', text: 'Failed to update units preference' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnectStrava() {
    if (!profile) return

    if (!confirm('Are you sure you want to disconnect your Strava account? Your activities will remain, but you won\'t be able to sync new ones until you reconnect.')) {
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()

      // Delete Strava tokens
      await supabase
        .from('strava_tokens')
        .delete()
        .eq('user_id', profile.id)

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          strava_athlete_id: null,
          strava_connected: false,
        })
        .eq('id', profile.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Strava disconnected successfully' })
      setProfile({
        ...profile,
        strava_athlete_id: null,
        strava_connected: false,
      })
    } catch (error) {
      console.error('Error disconnecting Strava:', error)
      setMessage({ type: 'error', text: 'Failed to disconnect Strava' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Failed to load profile. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        </div>
        <p className="text-slate-600">Manage your account and preferences</p>
      </div>

      {/* Message */}
      {message && (
        <Card className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <p className={message.type === 'success' ? 'text-green-900' : 'text-red-900'}>
                {message.text}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500">
              Email cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Units Preference */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            <CardTitle>Units Preference</CardTitle>
          </div>
          <CardDescription>Choose your preferred measurement system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleUnitsChange('metric')}
              disabled={saving}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${selectedUnits === 'metric'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
                }
                ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="text-center">
                <p className="font-semibold text-slate-900 mb-2">Metric</p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>Kilometers (km)</p>
                  <p>Meters (m)</p>
                  <p>Kilograms (kg)</p>
                </div>
                {selectedUnits === 'metric' && (
                  <CheckCircle2 className="h-5 w-5 text-primary mx-auto mt-3" />
                )}
              </div>
            </button>

            <button
              onClick={() => handleUnitsChange('imperial')}
              disabled={saving}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${selectedUnits === 'imperial'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
                }
                ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="text-center">
                <p className="font-semibold text-slate-900 mb-2">Imperial</p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>Miles (mi)</p>
                  <p>Feet (ft)</p>
                  <p>Pounds (lb)</p>
                </div>
                {selectedUnits === 'imperial' && (
                  <CheckCircle2 className="h-5 w-5 text-primary mx-auto mt-3" />
                )}
              </div>
            </button>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> This preference will be applied across all pages in the dashboard, including distance, elevation, and other measurements.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Strava Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Strava Connection</CardTitle>
          </div>
          <CardDescription>Manage your Strava integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-orange-500" />
              <div>
                <p className="font-medium text-slate-900">Strava Account</p>
                <p className="text-sm text-slate-600">
                  {profile.strava_connected
                    ? `Connected • Athlete ID: ${profile.strava_athlete_id}`
                    : 'Not connected'}
                </p>
              </div>
            </div>
            <Badge variant={profile.strava_connected ? 'default' : 'secondary'}>
              {profile.strava_connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>

          <div className="flex gap-3">
            {profile.strava_connected ? (
              <Button variant="destructive" onClick={handleDisconnectStrava} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  'Disconnect Strava'
                )}
              </Button>
            ) : (
              <Button
                variant="strava"
                onClick={() => window.location.href = '/onboarding'}
              >
                <Activity className="h-4 w-4 mr-2" />
                Connect with Strava
              </Button>
            )}
          </div>

          {profile.strava_connected && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Disconnecting your Strava account will not delete your existing activities. You can reconnect at any time to continue syncing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Privacy & Security</CardTitle>
          </div>
          <CardDescription>Manage your privacy and security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
            <div>
              <p className="font-medium text-slate-900">Account ID</p>
              <p className="text-sm text-slate-600 font-mono">{profile.id}</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium text-slate-900 mb-2">Data Privacy</h4>
            <p className="text-sm text-slate-600 mb-4">
              Your activity data is stored securely and is only visible to you. We use Supabase for data storage with Row Level Security (RLS) to ensure your data privacy.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications (Future Feature) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-slate-50 text-center">
            <p className="text-sm text-slate-600">
              Notification settings coming soon
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>Manage your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
