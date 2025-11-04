'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Units = 'metric' | 'imperial'

interface UnitsContextType {
  units: Units
  setUnits: (units: Units) => Promise<void>
  isLoading: boolean
}

const UnitsContext = createContext<UnitsContextType | undefined>(undefined)

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [units, setUnitsState] = useState<Units>('metric')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUnits()
  }, [])

  async function loadUnits() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('units_preference')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data?.units_preference) {
        setUnitsState(data.units_preference as Units)
      }
    } catch (error) {
      console.error('Error loading units preference:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function setUnits(newUnits: Units) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({ units_preference: newUnits })
        .eq('id', user.id)

      if (error) throw error

      setUnitsState(newUnits)
    } catch (error) {
      console.error('Error updating units preference:', error)
      throw error
    }
  }

  return (
    <UnitsContext.Provider value={{ units, setUnits, isLoading }}>
      {children}
    </UnitsContext.Provider>
  )
}

export function useUnits() {
  const context = useContext(UnitsContext)
  if (context === undefined) {
    throw new Error('useUnits must be used within a UnitsProvider')
  }
  return context
}
