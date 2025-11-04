import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export type Units = 'metric' | 'imperial'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format distance from meters with units preference
 */
export function formatDistance(meters: number | null | undefined, units: Units = 'metric'): string {
  if (meters == null) return units === 'metric' ? '0 km' : '0 mi'

  if (units === 'imperial') {
    const miles = meters * 0.000621371
    return `${miles.toFixed(2)} mi`
  }

  const km = meters / 1000
  return `${km.toFixed(2)} km`
}

/**
 * Format time from seconds to human-readable format (e.g., "1h 23m")
 */
export function formatTime(seconds: number | null | undefined): string {
  if (seconds == null) return '0m'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 && hours === 0) parts.push(`${secs}s`)

  return parts.length > 0 ? parts.join(' ') : '0m'
}

/**
 * Format elevation with units preference
 */
export function formatElevation(meters: number | null | undefined, units: Units = 'metric'): string {
  if (meters == null) return units === 'metric' ? '0 m' : '0 ft'

  if (units === 'imperial') {
    const feet = meters * 3.28084
    return `${Math.round(feet)} ft`
  }

  return `${Math.round(meters)} m`
}

/**
 * Format speed with units preference
 */
export function formatSpeed(metersPerSecond: number | null | undefined, units: Units = 'metric'): string {
  if (metersPerSecond == null || metersPerSecond === 0) {
    return units === 'metric' ? '0 km/h' : '0 mph'
  }

  if (units === 'imperial') {
    const mph = metersPerSecond * 2.23694
    return `${mph.toFixed(1)} mph`
  }

  const kmh = metersPerSecond * 3.6
  return `${kmh.toFixed(1)} km/h`
}

/**
 * Format pace with units preference
 */
export function formatPace(metersPerSecond: number | null | undefined, units: Units = 'metric'): string {
  if (metersPerSecond == null || metersPerSecond === 0) {
    return units === 'metric' ? '0:00 /km' : '0:00 /mi'
  }

  if (units === 'imperial') {
    const secondsPerMile = 1609.34 / metersPerSecond
    const minutes = Math.floor(secondsPerMile / 60)
    const seconds = Math.round(secondsPerMile % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')} /mi`
  }

  const secondsPerKm = 1000 / metersPerSecond
  const minutes = Math.floor(secondsPerKm / 60)
  const seconds = Math.round(secondsPerKm % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`
}

/**
 * Format heartrate
 */
export function formatHeartrate(bpm: number | null | undefined): string {
  if (bpm == null) return 'N/A'
  return `${Math.round(bpm)} bpm`
}

/**
 * Format date to readable format
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

/**
 * Get activity icon emoji based on type
 */
export function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    Run: '🏃',
    Ride: '🚴',
    Swim: '🏊',
    Walk: '🚶',
    Hike: '🥾',
    VirtualRide: '🚴',
    VirtualRun: '🏃',
    AlpineSki: '⛷️',
    BackcountrySki: '⛷️',
    NordicSki: '⛷️',
    Snowboard: '🏂',
    Rowing: '🚣',
    Kayaking: '🛶',
    Canoeing: '🛶',
    Surfing: '🏄',
    StandUpPaddling: '🏄',
    Yoga: '🧘',
    WeightTraining: '🏋️',
    Workout: '💪',
    Soccer: '⚽',
    Golf: '⛳',
  }

  return icons[type] || '🏃'
}
