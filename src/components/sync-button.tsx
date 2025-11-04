'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export function SyncButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    success: boolean
    message?: string
    count?: number
  } | null>(null)

  async function handleSync() {
    setIsOpen(true)
    setIsSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/activities/sync', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setSyncResult({
          success: true,
          message: data.message,
          count: data.count,
        })
        // Refresh the page after successful sync
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Failed to sync activities',
        })
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleSync}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Sync Activities
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          {!isSyncing && syncResult?.success ? null : (
            <DialogClose onClick={() => setIsOpen(false)} />
          )}
          <DialogHeader>
            <DialogTitle>Syncing Activities</DialogTitle>
            <DialogDescription>
              {isSyncing
                ? 'Fetching your activities from Strava...'
                : syncResult?.success
                  ? syncResult.message || 'Activities synced successfully!'
                  : syncResult?.message || 'There was an error syncing activities.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {isSyncing ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-sm text-slate-600">Please wait while we sync your activities...</p>
              </div>
            ) : syncResult ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                {syncResult.success ? (
                  <>
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                    <p className="text-sm font-medium text-slate-900">
                      {syncResult.count !== undefined
                        ? `Successfully synced ${syncResult.count} ${syncResult.count === 1 ? 'activity' : 'activities'}`
                        : 'Activities synced successfully!'}
                    </p>
                    <p className="text-xs text-slate-500">Refreshing page...</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-12 w-12 text-red-500" />
                    <p className="text-sm font-medium text-slate-900">
                      {syncResult.message || 'Failed to sync activities'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="mt-4"
                    >
                      Close
                    </Button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

