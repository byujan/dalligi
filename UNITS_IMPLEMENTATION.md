# Units System Implementation

## Overview
The application now supports both **Metric** (kilometers, meters) and **Imperial** (miles, feet) unit systems throughout the entire dashboard.

## What Was Changed

### 1. Settings Location
- **Moved Settings** from main navigation to the bottom footer of the sidebar
- Replaced the "Try AI Coach" promotional section with the Settings link
- Settings now has the same active state highlighting as other navigation items

### 2. Database Schema
- Added `units_preference` column to the `profiles` table
- Created `units_preference` ENUM type with values: 'metric' | 'imperial'
- Default value is 'metric'

**To apply the database migration:**
```bash
# Run this SQL in your Supabase SQL Editor:
# See: add-units-preference.sql
```

### 3. Units Context Provider
- Created `src/contexts/units-context.tsx` - Global context for units preference
- Wraps the entire dashboard layout in `src/app/dashboard/layout.tsx`
- Automatically loads user's units preference from database
- Provides `setUnits()` function to update preference

### 4. Formatting Utilities
Updated `src/lib/utils.ts` with units-aware functions:

- **formatDistance()** - Converts meters → km or miles
- **formatElevation()** - Converts meters → m or feet
- **formatSpeed()** - Converts m/s → km/h or mph
- **formatPace()** - Converts m/s → min/km or min/mi

All functions accept an optional `units` parameter (defaults to 'metric').

### 5. Custom Hook
Created `src/hooks/use-formatted-units.ts`:
- Provides formatting functions with user's units automatically applied
- Use this hook in client components to format measurements

**Example usage:**
```typescript
'use client'

import { useFormattedUnits } from '@/hooks/use-formatted-units'

export function MyComponent() {
  const { formatDistance, formatElevation, formatPace, formatSpeed, units } = useFormattedUnits()

  return (
    <div>
      <p>Distance: {formatDistance(5000)}</p> {/* 5.00 km or 3.11 mi */}
      <p>Elevation: {formatElevation(500)}</p> {/* 500 m or 1640 ft */}
    </div>
  )
}
```

### 6. Settings UI
Updated `src/app/dashboard/settings/page.tsx`:
- Added **Units Preference** card with visual toggle
- Side-by-side buttons for Metric vs Imperial
- Shows which measurements each system uses
- Saves preference immediately on change
- Displays success/error messages

### 7. Component Updates
**Updated components to use units:**
- `src/components/activity-card.tsx` - Uses `useFormattedUnits()` hook
- `src/components/dashboard-metrics.tsx` - New wrapper component for dashboard metrics
- `src/app/dashboard/page.tsx` - Uses `DashboardMetrics` component

**Components that need updating (for full coverage):**
- `src/app/dashboard/calendar/page.tsx` - Calendar distance/elevation display
- `src/app/dashboard/analytics/page.tsx` - All charts and metrics
- `src/components/performance-charts.tsx` - Chart labels and tooltips

## Conversion Rates

| Metric | Imperial | Conversion |
|--------|----------|------------|
| 1 meter | 3.28084 feet | × 3.28084 |
| 1 kilometer | 0.621371 miles | × 0.621371 |
| 1 m/s | 2.23694 mph | × 2.23694 |
| 1 m/s | 3.6 km/h | × 3.6 |

## How to Use

### For Users
1. Go to **Settings** (bottom of sidebar)
2. Find the **Units Preference** card
3. Click **Metric** or **Imperial**
4. Settings save automatically
5. All distances, elevations, and paces update across the app

### For Developers

**In Client Components:**
```typescript
'use client'
import { useFormattedUnits } from '@/hooks/use-formatted-units'

export function MyComponent({ distance }: { distance: number }) {
  const { formatDistance } = useFormattedUnits()
  return <div>{formatDistance(distance)}</div>
}
```

**In Server Components:**
Create a client wrapper component that uses the hook, then use it in your server component.

**Direct usage (when units are known):**
```typescript
import { formatDistance } from '@/lib/utils'

// Explicit units
const display = formatDistance(5000, 'imperial') // "3.11 mi"
```

## Testing

1. **Apply database migration**: Run `add-units-preference.sql` in Supabase
2. **Login to dashboard**
3. **Navigate to Settings** (bottom of sidebar)
4. **Switch between Metric and Imperial**
5. **Check dashboard page** - distances should update
6. **Check activity cards** - all measurements should reflect chosen units

## Future Improvements

- Update Calendar page to use units
- Update Analytics page charts to use units
- Update Performance Charts component
- Add units to chart axis labels
- Persist units in local storage as fallback
- Add "Use System Settings" option (auto-detect from browser locale)
