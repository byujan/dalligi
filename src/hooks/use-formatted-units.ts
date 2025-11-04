'use client'

import { useUnits } from '@/contexts/units-context'
import {
  formatDistance as formatDistanceBase,
  formatElevation as formatElevationBase,
  formatSpeed as formatSpeedBase,
  formatPace as formatPaceBase,
} from '@/lib/utils'

/**
 * Hook that provides formatting functions with the user's units preference
 */
export function useFormattedUnits() {
  const { units } = useUnits()

  return {
    units,
    formatDistance: (meters: number | null | undefined) => formatDistanceBase(meters, units),
    formatElevation: (meters: number | null | undefined) => formatElevationBase(meters, units),
    formatSpeed: (metersPerSecond: number | null | undefined) => formatSpeedBase(metersPerSecond, units),
    formatPace: (metersPerSecond: number | null | undefined) => formatPaceBase(metersPerSecond, units),
  }
}
