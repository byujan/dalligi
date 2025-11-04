import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Safe query endpoint for LLM to query activities database
 * Only allows parameterized queries on the activities table
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { query_type, params } = await request.json()
    const supabase = await createClient()

    // Validate query type
    const allowedQueryTypes = [
      'search_by_name',
      'search_by_date',
      'search_by_name_and_date',
      'search_by_type',
      'get_recent'
    ]

    if (!allowedQueryTypes.includes(query_type)) {
      return NextResponse.json(
        { error: 'Invalid query type' },
        { status: 400 }
      )
    }

    let result: any[] = []

    switch (query_type) {
      case 'search_by_name': {
        const { search_term, limit = 20 } = params || {}
        if (!search_term) {
          return NextResponse.json(
            { error: 'search_term parameter is required' },
            { status: 400 }
          )
        }
        
        const { data, error } = await supabase
          .from('activities')
          .select('name, type, distance, moving_time, elapsed_time, total_elevation_gain, average_heartrate, max_heartrate, average_speed, start_date, start_date_local')
          .eq('user_id', user.id)
          .ilike('name', `%${search_term}%`)
          .order('start_date', { ascending: false })
          .limit(Math.min(limit, 50))
        
        if (error) throw error
        result = data || []
        break
      }

      case 'search_by_date': {
        const { year, month, day, date, limit = 20 } = params || {}
        
        let targetYear: number
        let targetMonth: number
        let targetDay: number
        
        // Parse date string if provided, otherwise use individual parameters
        if (date) {
          try {
            const dateObj = new Date(date)
            if (isNaN(dateObj.getTime())) {
              return NextResponse.json(
                { error: 'Invalid date format. Use YYYY-MM-DD or provide year, month, day' },
                { status: 400 }
              )
            }
            targetYear = dateObj.getFullYear()
            targetMonth = dateObj.getMonth() + 1
            targetDay = dateObj.getDate()
          } catch (e) {
            return NextResponse.json(
              { error: 'Invalid date format. Use YYYY-MM-DD or provide year, month, day' },
              { status: 400 }
            )
          }
        } else if (year && month && day) {
          targetYear = year
          targetMonth = month
          targetDay = day
        } else {
          return NextResponse.json(
            { error: 'Either date (YYYY-MM-DD) or year, month, and day parameters are required' },
            { status: 400 }
          )
        }

        // Format date as YYYY-MM-DD
        const targetDateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
        
        // Query a range around the date
        const queryStartDate = new Date(targetYear, targetMonth - 1, targetDay - 1, 0, 0, 0, 0)
        const queryEndDate = new Date(targetYear, targetMonth - 1, targetDay + 1, 23, 59, 59, 999)

        const { data: dateActivitiesLocal } = await supabase
          .from('activities')
          .select('name, type, distance, moving_time, elapsed_time, total_elevation_gain, average_heartrate, max_heartrate, average_speed, start_date, start_date_local')
          .eq('user_id', user.id)
          .gte('start_date_local', queryStartDate.toISOString())
          .lte('start_date_local', queryEndDate.toISOString())
          .order('start_date', { ascending: false })

        // Filter to exact date match
        const filtered = (dateActivitiesLocal || []).filter(activity => {
          if (activity.start_date_local) {
            const activityDateStr = activity.start_date_local.toString().split('T')[0]
            return activityDateStr === targetDateStr
          }
          if (activity.start_date) {
            const activityDate = new Date(activity.start_date)
            const activityDateStr = `${activityDate.getFullYear()}-${String(activityDate.getMonth() + 1).padStart(2, '0')}-${String(activityDate.getDate()).padStart(2, '0')}`
            return activityDateStr === targetDateStr
          }
          return false
        })

        result = filtered.slice(0, Math.min(limit, 50))
        break
      }

      case 'search_by_name_and_date': {
        const { search_term, year, month, day, date, limit = 20 } = params || {}
        
        if (!search_term) {
          return NextResponse.json(
            { error: 'search_term parameter is required' },
            { status: 400 }
          )
        }
        
        let targetYear: number
        let targetMonth: number
        let targetDay: number
        
        // Parse date string if provided, otherwise use individual parameters
        if (date) {
          try {
            const dateObj = new Date(date)
            if (isNaN(dateObj.getTime())) {
              return NextResponse.json(
                { error: 'Invalid date format. Use YYYY-MM-DD or provide year, month, day' },
                { status: 400 }
              )
            }
            targetYear = dateObj.getFullYear()
            targetMonth = dateObj.getMonth() + 1
            targetDay = dateObj.getDate()
          } catch (e) {
            return NextResponse.json(
              { error: 'Invalid date format. Use YYYY-MM-DD or provide year, month, day' },
              { status: 400 }
            )
          }
        } else if (year && month && day) {
          targetYear = year
          targetMonth = month
          targetDay = day
        } else {
          return NextResponse.json(
            { error: 'Either date (YYYY-MM-DD) or year, month, and day parameters are required' },
            { status: 400 }
          )
        }

        const targetDateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
        const queryStartDate = new Date(targetYear, targetMonth - 1, targetDay - 1, 0, 0, 0, 0)
        const queryEndDate = new Date(targetYear, targetMonth - 1, targetDay + 1, 23, 59, 59, 999)

        const { data } = await supabase
          .from('activities')
          .select('name, type, distance, moving_time, elapsed_time, total_elevation_gain, average_heartrate, max_heartrate, average_speed, start_date, start_date_local')
          .eq('user_id', user.id)
          .ilike('name', `%${search_term}%`)
          .gte('start_date_local', queryStartDate.toISOString())
          .lte('start_date_local', queryEndDate.toISOString())
          .order('start_date', { ascending: false })
          .limit(Math.min(limit, 50))

        // Filter to exact date match
        const filtered = (data || []).filter(activity => {
          if (activity.start_date_local) {
            const activityDateStr = activity.start_date_local.toString().split('T')[0]
            return activityDateStr === targetDateStr
          }
          return false
        })

        result = filtered
        break
      }

      case 'search_by_type': {
        const { activity_type, limit = 20 } = params || {}
        if (!activity_type) {
          return NextResponse.json(
            { error: 'activity_type parameter is required' },
            { status: 400 }
          )
        }

        const { data, error } = await supabase
          .from('activities')
          .select('name, type, distance, moving_time, elapsed_time, total_elevation_gain, average_heartrate, max_heartrate, average_speed, start_date, start_date_local')
          .eq('user_id', user.id)
          .eq('type', activity_type)
          .order('start_date', { ascending: false })
          .limit(Math.min(limit, 50))
        
        if (error) throw error
        result = data || []
        break
      }

      case 'get_recent': {
        const { limit = 50 } = params || {}
        const { data, error } = await supabase
          .from('activities')
          .select('name, type, distance, moving_time, elapsed_time, total_elevation_gain, average_heartrate, max_heartrate, average_speed, start_date, start_date_local')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false })
          .limit(Math.min(limit, 100))
        
        if (error) throw error
        result = data || []
        break
      }
    }

    return NextResponse.json({
      success: true,
      count: result.length,
      data: result
    })
  } catch (error: any) {
    console.error('Query error:', error)
    return NextResponse.json(
      { error: error.message || 'Query failed' },
      { status: 500 }
    )
  }
}

