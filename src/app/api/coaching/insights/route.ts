import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatPace } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { question, model = 'openai' } = await request.json()
    const useOllama = model === 'ollama'

    // Get user's recent activities for context (increased limit for better context)
    const supabase = await createClient()
    const { data: activities, error } = await supabase
      .from('activities')
      .select('name, type, distance, moving_time, elapsed_time, total_elevation_gain, average_heartrate, max_heartrate, average_speed, start_date, start_date_local')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(50) // Increased to 50 for better context

    if (error) throw error

    // Get planned workouts for context (past and future)
    const today = new Date().toISOString().split('T')[0]
    const { data: plannedWorkouts } = await supabase
      .from('planned_workouts')
      .select('date, type, name, description, duration, distance')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .limit(50) // Get more workouts to include past ones

    // Get user's units preference
    const { data: profile } = await supabase
      .from('profiles')
      .select('units_preference')
      .eq('id', user.id)
      .single()

    const units = (profile?.units_preference || 'metric') as 'metric' | 'imperial'

    // Search for specific activities if the question mentions them
    const questionLower = question?.toLowerCase() || ''
    let specificActivities: typeof activities = []
    
    // Extract dates from the question (e.g., "November 2nd", "Nov 2", "2024-11-02")
    let detectedDate: Date | null = null
    const monthNames: { [key: string]: number } = {
      'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
      'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11,
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    }
    
    // Pattern 1: "November 2nd", "November 2", "Nov 2nd", "Nov 2", "November 2nd 2024"
    const monthNamePattern = new RegExp(`(${Object.keys(monthNames).join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?`, 'i')
    const monthMatch = question.match(monthNamePattern)
    if (monthMatch) {
      try {
        const monthStr = monthMatch[1].toLowerCase()
        const day = parseInt(monthMatch[2])
        const year = monthMatch[3] ? parseInt(monthMatch[3]) : new Date().getFullYear()
        const month = monthNames[monthStr]
        if (month !== undefined && day >= 1 && day <= 31) {
          detectedDate = new Date(year, month, day)
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Pattern 2: "11/2", "11/02", "11-2", "11-02" (assume MM/DD format)
    if (!detectedDate) {
      const shortDatePattern = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/
      const shortMatch = question.match(shortDatePattern)
      if (shortMatch) {
        try {
          const parts = shortMatch[0].split(/[\/\-]/).map((p: string) => parseInt(p))
          if (parts.length === 2 && parts[0] >= 1 && parts[0] <= 12 && parts[1] >= 1 && parts[1] <= 31) {
            // MM/DD format, use current year
            detectedDate = new Date(new Date().getFullYear(), parts[0] - 1, parts[1])
          } else if (parts.length === 3) {
            // YYYY-MM-DD or MM-DD-YYYY
            if (parts[0] > 1000) {
              detectedDate = new Date(parts[0], parts[1] - 1, parts[2])
            } else {
              detectedDate = new Date(parts[2], parts[0] - 1, parts[1])
            }
          }
        } catch (e) {
          // Continue
        }
      }
    }
    
    // Pattern 3: "2024-11-02", "2024/11/02"
    if (!detectedDate) {
      const fullDatePattern = /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/
      const fullMatch = question.match(fullDatePattern)
      if (fullMatch) {
        try {
          const year = parseInt(fullMatch[1])
          const month = parseInt(fullMatch[2])
          const day = parseInt(fullMatch[3])
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            detectedDate = new Date(year, month - 1, day)
          }
        } catch (e) {
          // Continue
        }
      }
    }
    
    // If a date was detected, fetch activities for that specific date
    if (detectedDate) {
      // Extract date components
      const year = detectedDate.getFullYear()
      const month = detectedDate.getMonth()
      const day = detectedDate.getDate()
      
      // Format the target date as YYYY-MM-DD for comparison
      const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      // Query activities and filter by date
      // We'll fetch a broader range and filter in JavaScript to ensure accuracy
      // Query activities from 2 days before to 2 days after to cover all timezones
      const queryStartDate = new Date(year, month, day - 2, 0, 0, 0, 0)
      const queryEndDate = new Date(year, month, day + 2, 23, 59, 59, 999)
      
      // Query using start_date_local first (represents local time)
      const { data: dateActivitiesLocal } = await supabase
        .from('activities')
        .select('name, type, distance, moving_time, elapsed_time, total_elevation_gain, average_heartrate, max_heartrate, average_speed, start_date, start_date_local')
        .eq('user_id', user.id)
        .gte('start_date_local', queryStartDate.toISOString())
        .lte('start_date_local', queryEndDate.toISOString())
        .order('start_date', { ascending: false })
      
      // Also query using start_date (UTC time) as fallback
      const { data: dateActivitiesUTC } = await supabase
        .from('activities')
        .select('name, type, distance, moving_time, elapsed_time, total_elevation_gain, average_heartrate, max_heartrate, average_speed, start_date, start_date_local')
        .eq('user_id', user.id)
        .gte('start_date', queryStartDate.toISOString())
        .lte('start_date', queryEndDate.toISOString())
        .order('start_date', { ascending: false })
      
      // Combine and deduplicate results
      const allDateActivities = [...(dateActivitiesLocal || []), ...(dateActivitiesUTC || [])]
      const uniqueActivities = Array.from(
        new Map(allDateActivities.map(activity => [activity.start_date || activity.start_date_local, activity])).values()
      )
      const dateActivities = uniqueActivities
      
      if (dateActivities && dateActivities.length > 0) {
        // Filter results to ensure they're actually on the correct date
        // Check both start_date_local and start_date to handle different storage formats
        const filteredActivities = dateActivities.filter(activity => {
          // Try start_date_local first (represents local time)
          if (activity.start_date_local) {
            const activityDateStr = activity.start_date_local.toString().split('T')[0]
            if (activityDateStr === targetDateStr) return true
          }
          
          // Fallback to start_date (UTC time, but we'll check the date)
          if (activity.start_date) {
            const activityDate = new Date(activity.start_date)
            // Get the date components in local timezone
            const activityDateStr = `${activityDate.getFullYear()}-${String(activityDate.getMonth() + 1).padStart(2, '0')}-${String(activityDate.getDate()).padStart(2, '0')}`
            if (activityDateStr === targetDateStr) return true
          }
          
          return false
        })
        
        if (filteredActivities.length > 0) {
          specificActivities = filteredActivities
        }
      }
      
      // If no activities found with date query, also check the already-fetched activities list
      if (specificActivities.length === 0) {
        const year = detectedDate.getFullYear()
        const month = detectedDate.getMonth()
        const day = detectedDate.getDate()
        const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        
        const matchedFromList = activities.filter(activity => {
          // Check start_date_local
          if (activity.start_date_local) {
            const activityDateStr = activity.start_date_local.toString().split('T')[0]
            if (activityDateStr === targetDateStr) return true
          }
          
          // Check start_date
          if (activity.start_date) {
            const activityDate = new Date(activity.start_date)
            const activityDateStr = `${activityDate.getFullYear()}-${String(activityDate.getMonth() + 1).padStart(2, '0')}-${String(activityDate.getDate()).padStart(2, '0')}`
            if (activityDateStr === targetDateStr) return true
          }
          
          return false
        })
        
        if (matchedFromList.length > 0) {
          specificActivities = matchedFromList
        }
      }
    }
    
    // Extract potential activity names/keywords from the question
    // Look for race names, locations, or specific activity types
    const raceKeywords = ['cambridge', 'half', 'marathon', 'race', '5k', '10k', 'ultra', 'triathlon', 'duathlon']
    const foundKeywords = raceKeywords.filter(keyword => questionLower.includes(keyword))
    
    // Extract quoted strings that might be activity names
    const quotedMatches = question.match(/"([^"]+)"/g) || []
    const quotedTerms = quotedMatches.map((m: string) => m.replace(/"/g, '').toLowerCase())
    
    // Extract capitalized words/phrases (common in race names)
    const capitalizedPhrases = question.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []
    const capitalizedTerms = capitalizedPhrases
      .filter((phrase: string) => phrase.length > 3) // Filter out short words like "I", "My", etc.
      .map((phrase: string) => phrase.toLowerCase())
    
    // Extract multi-word phrases from the question (e.g., "cambridge half")
    const multiWordPhrases: string[] = []
    if (foundKeywords.length >= 2) {
      // Try to find adjacent keywords that form a phrase
      const words = questionLower.split(/\s+/)
      for (let i = 0; i < words.length - 1; i++) {
        if (foundKeywords.includes(words[i]) && foundKeywords.includes(words[i + 1])) {
          multiWordPhrases.push(`${words[i]} ${words[i + 1]}`)
        }
      }
      // Also check for non-adjacent but nearby keywords (within 2 words)
      for (let i = 0; i < words.length - 2; i++) {
        if (foundKeywords.includes(words[i]) && foundKeywords.includes(words[i + 2])) {
          multiWordPhrases.push(`${words[i]} ${words[i + 2]}`)
        }
      }
    }
    
    // Combine all search terms and remove duplicates
    const allSearchTerms = Array.from(new Set([...foundKeywords, ...quotedTerms, ...capitalizedTerms, ...multiWordPhrases]))
    
    if (allSearchTerms.length > 0 || (questionLower.includes('my') && (questionLower.includes('performance') || questionLower.includes('run') || questionLower.includes('race')))) {
      // Search for activities matching the terms (only if we don't already have date-based results)
      if (allSearchTerms.length > 0 && specificActivities.length === 0) {
        // First, try searching for full phrases (most specific) - search ALL activities, not just recent 50
        for (const phrase of multiWordPhrases) {
          if (specificActivities.length > 0) break
          const { data: phraseMatches } = await supabase
            .from('activities')
            .select('name, type, distance, moving_time, elapsed_time, total_elevation_gain, average_heartrate, max_heartrate, average_speed, start_date, start_date_local')
            .eq('user_id', user.id)
            .ilike('name', `%${phrase}%`)
            .order('start_date', { ascending: false })
            .limit(10)
          
          if (phraseMatches && phraseMatches.length > 0) {
            specificActivities = phraseMatches
            break
          }
        }
        
        // If no phrase matches, try searching with AND condition (both terms must be present)
        if (specificActivities.length === 0 && foundKeywords.length >= 2) {
          // Try to find activities that contain ALL keywords (more specific than OR)
          let query = supabase
            .from('activities')
            .select('name, type, distance, moving_time, elapsed_time, total_elevation_gain, average_heartrate, max_heartrate, average_speed, start_date, start_date_local')
            .eq('user_id', user.id)
          
          // Add ILIKE filters for each keyword (AND condition)
          for (const keyword of foundKeywords.slice(0, 3)) { // Limit to first 3 keywords to avoid too many conditions
            query = query.ilike('name', `%${keyword}%`)
          }
          
          const { data: andMatches } = await query
            .order('start_date', { ascending: false })
            .limit(10)
          
          if (andMatches && andMatches.length > 0) {
            specificActivities = andMatches
          }
        }
        
        // If no AND matches, try individual terms with OR (search ALL activities)
        if (specificActivities.length === 0) {
          // Build OR query: name.ilike.%term1%,name.ilike.%term2%
          const orConditions = allSearchTerms.map(term => `name.ilike.%${term}%`).join(',')
          const { data: searchedActivities } = await supabase
            .from('activities')
            .select('name, type, distance, moving_time, elapsed_time, total_elevation_gain, average_heartrate, max_heartrate, average_speed, start_date, start_date_local')
            .eq('user_id', user.id)
            .or(orConditions)
            .order('start_date', { ascending: false })
            .limit(10)
          
          if (searchedActivities && searchedActivities.length > 0) {
            specificActivities = searchedActivities
          }
        }
        
        // Also search in the already-fetched activities list as a fallback (checks recent 50)
        if (specificActivities.length === 0) {
          const matchedActivities = activities.filter(activity => {
            const activityNameLower = activity.name?.toLowerCase() || ''
            // Check if activity name contains all found keywords (for better matching)
            if (foundKeywords.length >= 2) {
              return foundKeywords.every(keyword => activityNameLower.includes(keyword))
            }
            return allSearchTerms.some(term => activityNameLower.includes(term))
          })
          if (matchedActivities.length > 0) {
            specificActivities = matchedActivities
          }
        }
      }
      
      // If no matches found, try broader search for half marathons or races
      if (specificActivities.length === 0 && (questionLower.includes('half') || questionLower.includes('marathon'))) {
        const { data: raceActivities } = await supabase
          .from('activities')
          .select('name, type, distance, moving_time, elapsed_time, total_elevation_gain, average_heartrate, max_heartrate, average_speed, start_date, start_date_local')
          .eq('user_id', user.id)
          .eq('type', 'Run')
          .gte('distance', 20000) // At least 20km (roughly half marathon distance)
          .order('start_date', { ascending: false })
          .limit(5)
        
        if (raceActivities) {
          specificActivities = raceActivities
        }
      }
    }

    // Calculate summary stats in meters
    const totalDistanceMeters = activities.reduce((sum, a) => sum + (a.distance || 0), 0)
    const totalTime = activities.reduce((sum, a) => sum + (a.moving_time || 0), 0) / 3600
    
    // Convert distances based on units preference
    const totalDistance = units === 'imperial' 
      ? totalDistanceMeters * 0.000621371 // Convert to miles
      : totalDistanceMeters / 1000 // Convert to km
    const avgDistance = totalDistance / (activities.length || 1)
    const distanceUnit = units === 'imperial' ? 'miles' : 'km'
    const distanceUnitShort = units === 'imperial' ? 'mi' : 'km'

    // Format activity details for display
    const formatActivityDetails = (a: typeof activities[0], index: number) => {
      const activityDistance = units === 'imperial' 
        ? (a.distance || 0) * 0.000621371 
        : (a.distance || 0) / 1000
      const pace = formatPace(a.average_speed, units)
      const elevation = units === 'imperial'
        ? a.total_elevation_gain ? (a.total_elevation_gain * 3.28084).toFixed(0) + ' ft' : 'N/A'
        : a.total_elevation_gain ? a.total_elevation_gain.toFixed(0) + ' m' : 'N/A'
      const date = new Date(a.start_date_local || a.start_date)
      const movingTimeMin = Math.floor((a.moving_time || 0) / 60)
      const movingTimeSec = (a.moving_time || 0) % 60
      const elapsedTimeMin = Math.floor((a.elapsed_time || a.moving_time || 0) / 60)
      const elapsedTimeSec = (a.elapsed_time || a.moving_time || 0) % 60
      
      return `${index}. "${a.name}" (${a.type})
   - Date: ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
   - Distance: ${activityDistance.toFixed(2)} ${distanceUnitShort}
   - Moving Time: ${movingTimeMin}:${String(movingTimeSec).padStart(2, '0')} (${Math.floor((a.moving_time || 0) / 60)} minutes)
   - Elapsed Time: ${elapsedTimeMin}:${String(elapsedTimeSec).padStart(2, '0')} (${Math.floor((a.elapsed_time || a.moving_time || 0) / 60)} minutes)
   - Average Pace: ${pace}
   - Elevation Gain: ${elevation}
   ${a.average_heartrate ? `   - Average Heart Rate: ${Math.round(a.average_heartrate)} bpm` : ''}
   ${a.max_heartrate ? `   - Max Heart Rate: ${a.max_heartrate} bpm` : ''}`
    }

    // Build detailed activity list with all available data
    const activitiesList = activities.map((a, i) => formatActivityDetails(a, i + 1)).join('\n\n')
    
    // Build specific activities section if found
    let specificActivitiesSection = ''
    if (specificActivities.length > 0) {
      const specificActivitiesList = specificActivities.map((a, i) => formatActivityDetails(a, i + 1)).join('\n\n')
      const sectionTitle = detectedDate 
        ? `ACTIVITIES FOUND FOR ${detectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}:`
        : 'MATCHING ACTIVITIES FOUND FOR YOUR QUESTION:'
      
      specificActivitiesSection = `

${sectionTitle}
${specificActivitiesList}

IMPORTANT: If the user is asking about a specific activity mentioned above, provide detailed analysis using the exact metrics from these matching activities.
`
    }

    // Build context for AI with proper units
    const currentDate = new Date()
    const currentDateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const currentDateISO = currentDate.toISOString().split('T')[0]
    
    const context = `
You are an expert running and endurance sports coach. Analyze the athlete's training data and provide personalized insights.

CURRENT DATE: Today is ${currentDateStr} (${currentDateISO}). Use this as the reference point for all date-related questions.

Athlete Profile:
- Name: ${user.fullName || user.email}
- Total activities (recent ${activities.length}): ${activities.length}
- Total distance: ${totalDistance.toFixed(2)} ${distanceUnit}
- Total time: ${totalTime.toFixed(2)} hours
- Average distance per activity: ${avgDistance.toFixed(2)} ${distanceUnit}
${specificActivitiesSection}
ALL ACTIVITIES WITH DETAILED DATA:
${activitiesList}

${plannedWorkouts && plannedWorkouts.length > 0 ? (() => {
  const today = new Date().toISOString().split('T')[0]
  const pastWorkouts = plannedWorkouts.filter(w => w.date < today)
  const futureWorkouts = plannedWorkouts.filter(w => w.date >= today)
  
  const formatWorkout = (w: any, i: number) => {
    const workoutDistance = w.distance && units === 'imperial'
      ? (w.distance * 0.000621371).toFixed(2) + 'mi'
      : w.distance
        ? (w.distance / 1000).toFixed(2) + 'km'
        : ''
    const dateStr = new Date(w.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    return `${i + 1}. ${w.type}${w.name ? ` - ${w.name}` : ''} on ${dateStr}${w.duration ? ` (${w.duration} min)` : ''}${workoutDistance ? ` (${workoutDistance})` : ''}${w.description ? ` - ${w.description}` : ''}`
  }
  
  let result = ''
  if (pastWorkouts.length > 0) {
    result += `Past Planned Workouts (Training Calendar):
${pastWorkouts.map((w, i) => formatWorkout(w, i + 1)).join('\n')}
`
  }
  if (futureWorkouts.length > 0) {
    result += `Upcoming Planned Workouts (Training Calendar):
${futureWorkouts.map((w, i) => formatWorkout(w, i + 1)).join('\n')}
`
  }
  return result
})() : ''}

User Question: ${question || 'Provide a general assessment of my training and suggestions for improvement.'}

IMPORTANT INSTRUCTIONS:
1. When responding, use ${distanceUnit} for distances. Be consistent with the units specified above.
2. ${specificActivities.length > 0 ? 'Matching activities have been found and are listed in the "MATCHING ACTIVITIES FOUND FOR YOUR QUESTION" section above. ALWAYS use these specific activities to answer the user\'s question with detailed metrics (pace, distance, heart rate, time, elevation).' : 'If the user asks about a specific existing run/activity by name or date, search through the detailed activity list above to find it. For prediction, analysis, or advice questions, use the general activity data provided.'}
3. When discussing a specific activity, ALWAYS reference its exact details from the list (name, date, distance, pace, heart rate, elevation, etc.). Be specific and quantitative.
4. For prediction questions (e.g., "what should I be able to run", "estimate my pace", "predict my time", "based on my previous runs"), analyze the user's past performance data including:
   - Recent race/event times and paces
   - Heart rate zones and effort levels
   - Training consistency and volume
   - Pace progression over time
   - Distance-specific performance history
   Use this data to provide realistic, evidence-based predictions and recommendations. Do NOT query for future events - use existing activity data.
5. You have access to the user's training calendar with both past and upcoming planned workouts. Use this information to:
   - Discuss training consistency and adherence to planned workouts
   - Compare planned vs actual workouts
   - Provide insights about upcoming training schedule
   - Suggest adjustments to future planned workouts based on past performance
6. For performance questions about specific EXISTING races or events, provide a comprehensive analysis including:
   - Pace analysis (how it compares to typical pace, whether it was consistent)
   - Heart rate zones and effort level
   - Distance accuracy
   - Time breakdown (moving time vs elapsed time)
   - Elevation profile impact
   - Any notable patterns or achievements
7. Provide specific, actionable coaching advice based on the actual data shown.
8. Be encouraging but honest. Consider training volume, consistency, activity variety, potential areas for improvement, injury prevention, progressive overload principles, and recovery.

Provide detailed, personalized coaching advice based on the actual training data.
`

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let apiResponse: Response

          if (useOllama) {
            // Enhanced context for Ollama with function calling instructions
            const ollamaContext = `${context}

IMPORTANT FUNCTION CALLING RULES:
- ONLY use functions that are explicitly defined. Do NOT invent or call functions that don't exist (like get_current_date, get_today, etc.). The current date is provided above in the context.
- If you need to search for specific activities, you can use the query_activities function by outputting a JSON object in this exact format:
{
  "function_call": {
    "name": "query_activities",
    "arguments": {
      "query_type": "search_by_name",
      "params": {
        "search_term": "activity name here"
      }
    }
  }
}

Available query types:
- search_by_name: Search by activity name (e.g., "Cambridge Half", "Morning Run")
- search_by_date: Search by date (params: year, month, day)
- search_by_name_and_date: Combined search
- search_by_type: Search by activity type (params: activity_type)
- get_recent: Get recent activities (params: limit)

When the user asks about a specific activity, you MUST output the function call JSON first, then wait for the results before providing your answer.`

            // Call Ollama API with streaming
            apiResponse = await fetch('http://localhost:11434/api/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'llama3.2',
                prompt: ollamaContext,
                stream: true,
                options: {
                  temperature: 0.7,
                  top_p: 0.9,
                },
              }),
            })

            if (!apiResponse.ok) {
              throw new Error('Failed to get response from Ollama. Make sure Ollama is running: ollama run llama3.2')
            }

            const reader = apiResponse.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) {
              throw new Error('No response body')
            }

            // Handle Ollama streaming with function calling
            let fullResponse = ''
            let functionCallDetected = false
            let functionCallBuffer = ''

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value)
              const lines = chunk.split('\n').filter((line) => line.trim() !== '')

              for (const line of lines) {
                try {
                  const parsed = JSON.parse(line)
                  if (parsed.response) {
                    fullResponse += parsed.response
                    
                    // Check if response contains function call JSON
                    if (!functionCallDetected) {
                      // Look for JSON object that might be a function call
                      // Try to find complete JSON objects with function_call
                      const jsonPatterns = [
                        /\{[\s\S]*?"function_call"[\s\S]*?\}/,
                        /\{[\s]*"function_call"[\s]*:\s*\{[^}]*"name"[\s]*:\s*"query_activities"[^}]*\}[^}]*\}/,
                      ]
                      
                      for (const pattern of jsonPatterns) {
                        const jsonMatch = fullResponse.match(pattern)
                        if (jsonMatch) {
                          try {
                            // Try to extract and parse the JSON
                            let jsonStr = jsonMatch[0]
                            // Try to find a complete JSON object
                            let braceCount = 0
                            let startIdx = -1
                            for (let i = 0; i < fullResponse.length; i++) {
                              if (fullResponse[i] === '{') {
                                if (startIdx === -1) startIdx = i
                                braceCount++
                              } else if (fullResponse[i] === '}') {
                                braceCount--
                                if (braceCount === 0 && startIdx !== -1) {
                                  jsonStr = fullResponse.substring(startIdx, i + 1)
                                  break
                                }
                              }
                            }
                            
                            const functionCall = JSON.parse(jsonStr)
                            if (functionCall.function_call && functionCall.function_call.name === 'query_activities') {
                              functionCallDetected = true
                              functionCallBuffer = jsonStr
                              
                              // Send function call event
                              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                                type: 'function_call',
                                function_name: functionCall.function_call.name,
                                status: 'executing',
                                arguments: JSON.stringify(functionCall.function_call.arguments)
                              })}\n\n`))
                              
                              // Execute the query
                              const functionArgs = functionCall.function_call.arguments
                              const protocol = request.headers.get('x-forwarded-proto') || 'http'
                              const host = request.headers.get('host') || 'localhost:3000'
                              const baseUrl = `${protocol}://${host}`
                              
                              const queryResponse = await fetch(`${baseUrl}/api/coaching/query`, {
                                method: 'POST',
                                headers: { 
                                  'Content-Type': 'application/json',
                                  'Cookie': request.headers.get('cookie') || '',
                                },
                                body: JSON.stringify({
                                  query_type: functionArgs.query_type,
                                  params: functionArgs.params || {},
                                }),
                              })
                              
                              const queryResult = await queryResponse.json()
                              
                              // Format query results
                              const formatActivityDetails = (a: any, index: number) => {
                                const activityDistance = units === 'imperial' 
                                  ? (a.distance || 0) * 0.000621371 
                                  : (a.distance || 0) / 1000
                                const pace = formatPace(a.average_speed, units)
                                const elevation = units === 'imperial'
                                  ? a.total_elevation_gain ? (a.total_elevation_gain * 3.28084).toFixed(0) + ' ft' : 'N/A'
                                  : a.total_elevation_gain ? a.total_elevation_gain.toFixed(0) + ' m' : 'N/A'
                                const date = new Date(a.start_date_local || a.start_date)
                                const movingTimeMin = Math.floor((a.moving_time || 0) / 60)
                                const movingTimeSec = (a.moving_time || 0) % 60
                                
                                return `${index}. "${a.name}" (${a.type})
   - Date: ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
   - Distance: ${activityDistance.toFixed(2)} ${units === 'imperial' ? 'mi' : 'km'}
   - Moving Time: ${movingTimeMin}:${String(movingTimeSec).padStart(2, '0')}
   - Average Pace: ${pace}
   - Elevation Gain: ${elevation}
   ${a.average_heartrate ? `   - Average Heart Rate: ${Math.round(a.average_heartrate)} bpm` : ''}
   ${a.max_heartrate ? `   - Max Heart Rate: ${a.max_heartrate} bpm` : ''}`
                              }
                              
                              const queryResultsText = queryResult.success && queryResult.data && queryResult.data.length > 0
                                ? `Query Results (${queryResult.count} activities found):\n${queryResult.data.map((a: any, i: number) => formatActivityDetails(a, i + 1)).join('\n\n')}`
                                : `Query Results: No activities found matching the search criteria.`
                              
                              // Send query result event
                              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                                type: 'query_result',
                                query: {
                                  type: functionArgs.query_type,
                                  params: functionArgs.params || {},
                                },
                                result: queryResult
                              })}\n\n`))
                              
                              // Continue with a follow-up prompt including query results
                              const followUpPrompt = `${ollamaContext}

${queryResultsText}

Now provide your analysis based on these query results.`
                              
                              // Make follow-up call with results
                              const followUpResponse = await fetch('http://localhost:11434/api/generate', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  model: 'llama3.2',
                                  prompt: followUpPrompt,
                                  stream: true,
                                  options: {
                                    temperature: 0.7,
                                    top_p: 0.9,
                                  },
                                }),
                              })
                              
                              if (followUpResponse.ok) {
                                const followUpReader = followUpResponse.body?.getReader()
                                if (followUpReader) {
                                  while (true) {
                                    const { done: followUpDone, value: followUpValue } = await followUpReader.read()
                                    if (followUpDone) break
                                    
                                    const followUpChunk = decoder.decode(followUpValue)
                                    const followUpLines = followUpChunk.split('\n').filter((l) => l.trim() !== '')
                                    
                                    for (const followUpLine of followUpLines) {
                                      try {
                                        const followUpParsed = JSON.parse(followUpLine)
                                        if (followUpParsed.response) {
                                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ chunk: followUpParsed.response })}\n\n`))
                                        }
                                        if (followUpParsed.done) {
                                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`))
                                          controller.close()
                                          return
                                        }
                                      } catch (e) {
                                        continue
                                      }
                                    }
                                  }
                                }
                              }
                              
                              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`))
                              controller.close()
                              return
                            }
                          } catch (e) {
                            // Not a function call, continue
                          }
                          // Break out of pattern loop if we found a match
                          if (functionCallDetected) {
                            break
                          }
                        }
                      }
                      
                      // If no function call detected, stream normally
                      if (!functionCallDetected) {
                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ chunk: parsed.response })}\n\n`))
                      }
                    }
                  }
                  if (parsed.done && !functionCallDetected) {
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                      done: true,
                      stats: {
                        totalActivities: activities.length,
                        totalDistance: totalDistanceMeters,
                        totalTime: totalTime.toFixed(2),
                        avgDistance: (totalDistanceMeters / (activities.length || 1)),
                      },
                    })}\n\n`))
                    controller.close()
                    return
                  }
                } catch (e) {
                  continue
                }
              }
            }
          } else {
            // Define functions for OpenAI function calling
            const functions = [
                  {
                    name: 'query_activities',
                    description: 'Query the activities database to find specific EXISTING workouts or runs by name or date. ONLY use this when the user asks about a SPECIFIC activity that already exists (e.g., "Cambridge Half", "my November 2nd run", "find my run from last Tuesday"). Do NOT use this for: prediction questions, "what should I be able to run", "estimate my pace", general analysis questions, or questions about future events. For those, use the activity data already provided in the context.',
                    parameters: {
                  type: 'object',
                  properties: {
                    query_type: {
                      type: 'string',
                      enum: ['search_by_name', 'search_by_date', 'search_by_name_and_date', 'search_by_type', 'get_recent'],
                      description: 'Type of query to perform'
                    },
                    params: {
                      type: 'object',
                      description: 'Query parameters',
                      properties: {
                        search_term: {
                          type: 'string',
                          description: 'Search term to match against activity name (e.g., "Cambridge Half", "5k", "Morning Run")'
                        },
                        year: {
                          type: 'integer',
                          description: 'Year (e.g., 2024)'
                        },
                        month: {
                          type: 'integer',
                          description: 'Month (1-12)'
                        },
                        day: {
                          type: 'integer',
                          description: 'Day of month (1-31). Can be used with year and month, or use date parameter instead.'
                        },
                        date: {
                          type: 'string',
                          description: 'Date in YYYY-MM-DD format (e.g., "2024-11-02"). Alternative to using year, month, day separately.'
                        },
                        activity_type: {
                          type: 'string',
                          description: 'Activity type (e.g., "Run", "Ride", "Swim")'
                        },
                        limit: {
                          type: 'integer',
                          description: 'Maximum number of results to return (default: 20, max: 50)'
                        }
                      },
                      required: []
                    }
                  },
                  required: ['query_type']
                }
              }
            ]

            // Call OpenAI API with function calling
            apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  {
                    role: 'system',
                    content: `You are an expert running and endurance sports coach. Analyze the athlete's training data and provide personalized insights.

IMPORTANT FUNCTION CALLING RULES:
- ONLY use functions that are explicitly defined and available. Do NOT invent or call functions that don't exist (like get_current_date, get_today, etc.). The current date is provided in the context above.
- Use query_activities function ONLY when the user asks about a SPECIFIC EXISTING activity by name or exact date (e.g., "Cambridge Half", "my November 2nd run", "find my 5k from last month").
- Do NOT use query_activities for:
  * Prediction/estimation questions ("what should I be able to run", "what pace should I target")
  * General analysis questions ("based on my previous runs", "analyze my training")
  * Questions about future events ("my next half marathon", "upcoming race")
  * Questions asking for advice or recommendations
  * Questions about the current date - use the date provided in the context
- For prediction, analysis, and advice questions, use the activity data already provided in the context. You have access to 50 recent activities with detailed metrics (pace, heart rate, distance, etc.) which is sufficient for analysis and predictions.

The user's units preference is: ${units}
${specificActivities.length > 0 ? `\n\nIMPORTANT: The following activities were already found in the context:\n${specificActivities.map((a, i) => `${i + 1}. ${a.name} (${a.type}) - ${new Date(a.start_date_local || a.start_date).toLocaleDateString()}`).join('\n')}` : ''}

Be encouraging but honest. Consider training volume, consistency, activity variety, potential areas for improvement, injury prevention, progressive overload principles, and recovery. Provide specific, actionable coaching advice based on the actual data from your queries.`,
                  },
                  {
                    role: 'user',
                    content: context,
                  },
                ],
                functions: functions,
                function_call: 'auto',
                stream: true,
                temperature: 0.7,
              }),
            })

            if (!apiResponse.ok) {
              const errorData = await apiResponse.json().catch(() => ({}))
              throw new Error(errorData.error?.message || 'Failed to get response from AI coach')
            }

            const reader = apiResponse.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) {
              throw new Error('No response body')
            }

            // Handle OpenAI streaming with function calling
            let functionCallBuffer = ''
            let functionName = ''
            let functionArguments = ''
            let messages: any[] = [
              {
                role: 'system',
                content: `You are an expert running and endurance sports coach. Analyze the athlete's training data and provide personalized insights.

IMPORTANT: When the user asks about a specific activity (like "Cambridge Half", "my November 2nd run", etc.), you MUST use the query_activities function to search the database. Do not rely on the provided context list alone - always query the database to find the exact activity the user is asking about.

The user's units preference is: ${units}
${specificActivities.length > 0 ? `\n\nIMPORTANT: The following activities were already found in the context:\n${specificActivities.map((a, i) => `${i + 1}. ${a.name} (${a.type}) - ${new Date(a.start_date_local || a.start_date).toLocaleDateString()}`).join('\n')}` : ''}

Be encouraging but honest. Consider training volume, consistency, activity variety, potential areas for improvement, injury prevention, progressive overload principles, and recovery. Provide specific, actionable coaching advice based on the actual data from your queries.`,
              },
              {
                role: 'user',
                content: context,
              },
            ]

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split('\n').filter((line) => line.trim() !== '')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6))
                    
                    if (data.choices && data.choices[0]) {
                      const delta = data.choices[0].delta
                      
                      // Handle function calling
                      if (delta?.function_call) {
                        if (delta.function_call.name && !functionName) {
                          // First time we see the function name - send function call initiated event
                          functionName = delta.function_call.name
                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                            type: 'function_call',
                            function_name: functionName,
                            status: 'initiated'
                          })}\n\n`))
                        }
                        if (delta.function_call.arguments) {
                          functionArguments += delta.function_call.arguments
                        }
                      }
                      
                      // Handle content
                      if (delta?.content) {
                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ chunk: delta.content })}\n\n`))
                      }
                      
                      // Check for finish reason
                      if (data.choices[0].finish_reason) {
                        // If function was called, execute it
                        if (data.choices[0].finish_reason === 'function_call' && functionName && functionArguments) {
                          try {
                            console.log('Function call detected:', { functionName, functionArguments })
                            
                            // Send function call executing event
                            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                              type: 'function_call',
                              function_name: functionName,
                              status: 'executing',
                              arguments: functionArguments
                            })}\n\n`))
                            
                            const functionArgs = JSON.parse(functionArguments)
                            console.log('Parsed function args:', functionArgs)
                            
                            // Execute the query
                            // Get the base URL from headers or environment
                            const protocol = request.headers.get('x-forwarded-proto') || 'http'
                            const host = request.headers.get('host') || 'localhost:3000'
                            const baseUrl = `${protocol}://${host}`
                            
                            console.log('Executing query:', functionArgs.query_type, functionArgs.params)
                            const queryResponse = await fetch(`${baseUrl}/api/coaching/query`, {
                              method: 'POST',
                              headers: { 
                                'Content-Type': 'application/json',
                                'Cookie': request.headers.get('cookie') || '', // Forward auth cookies
                              },
                              body: JSON.stringify({
                                query_type: functionArgs.query_type,
                                params: functionArgs.params || {},
                              }),
                            })
                            
                            const queryResult = await queryResponse.json()
                            console.log('Query result:', { success: queryResult.success, count: queryResult.count })
                            
                            // Format the query results with both human-readable and raw JSON
                            const formatActivityDetails = (a: any, index: number) => {
                              const activityDistance = units === 'imperial' 
                                ? (a.distance || 0) * 0.000621371 
                                : (a.distance || 0) / 1000
                              const pace = formatPace(a.average_speed, units)
                              const elevation = units === 'imperial'
                                ? a.total_elevation_gain ? (a.total_elevation_gain * 3.28084).toFixed(0) + ' ft' : 'N/A'
                                : a.total_elevation_gain ? a.total_elevation_gain.toFixed(0) + ' m' : 'N/A'
                              const date = new Date(a.start_date_local || a.start_date)
                              const movingTimeMin = Math.floor((a.moving_time || 0) / 60)
                              const movingTimeSec = (a.moving_time || 0) % 60
                              
                              return `${index}. "${a.name}" (${a.type})
   - Date: ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
   - Distance: ${activityDistance.toFixed(2)} ${units === 'imperial' ? 'mi' : 'km'}
   - Moving Time: ${movingTimeMin}:${String(movingTimeSec).padStart(2, '0')}
   - Average Pace: ${pace}
   - Elevation Gain: ${elevation}
   ${a.average_heartrate ? `   - Average Heart Rate: ${Math.round(a.average_heartrate)} bpm` : ''}
   ${a.max_heartrate ? `   - Max Heart Rate: ${a.max_heartrate} bpm` : ''}`
                            }
                            
                            // Create detailed query results text (without function call details)
                            let queryResultsText = ''
                            if (queryResult.success && queryResult.data && queryResult.data.length > 0) {
                              queryResultsText = `QUERY RESULTS (${queryResult.count} activities found):

${queryResult.data.map((a: any, i: number) => formatActivityDetails(a, i + 1)).join('\n\n')}`
                            } else {
                              queryResultsText = `QUERY RESULTS: No activities found matching the search criteria.`
                            }
                            
                            // Also send the raw data to the frontend for display
                            const queryResultEvent = {
                              type: 'query_result',
                              query: {
                                type: functionArgs.query_type,
                                params: functionArgs.params,
                              },
                              result: queryResult
                            }
                            console.log('Sending query_result event to frontend')
                            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(queryResultEvent)}\n\n`))
                            
                            // Add function call and result to messages
                            messages.push({
                              role: 'assistant',
                              content: null,
                              function_call: {
                                name: functionName,
                                arguments: functionArguments,
                              }
                            })
                            messages.push({
                              role: 'function',
                              name: functionName,
                              content: queryResultsText,
                            })
                            
                            // Make another API call with the function result
                            const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                              },
                              body: JSON.stringify({
                                model: 'gpt-4o-mini',
                                messages: messages,
                                functions: functions,
                                function_call: 'auto',
                                stream: true,
                                temperature: 0.7,
                              }),
                            })
                            
                            // Stream the follow-up response
                            const followUpReader = followUpResponse.body?.getReader()
                            if (followUpReader) {
                              while (true) {
                                const { done: followUpDone, value: followUpValue } = await followUpReader.read()
                                if (followUpDone) break
                                
                                const followUpChunk = decoder.decode(followUpValue, { stream: true })
                                const followUpLines = followUpChunk.split('\n').filter((l) => l.trim() !== '')
                                
                                for (const followUpLine of followUpLines) {
                                  if (followUpLine.startsWith('data: ')) {
                                    try {
                                      const followUpData = JSON.parse(followUpLine.slice(6))
                                      if (followUpData.choices && followUpData.choices[0]) {
                                        const followUpDelta = followUpData.choices[0].delta
                                        if (followUpDelta?.content) {
                                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ chunk: followUpDelta.content })}\n\n`))
                                        }
                                        if (followUpData.choices[0].finish_reason) {
                                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`))
                                          controller.close()
                                          return
                                        }
                                      }
                                    } catch (e) {
                                      continue
                                    }
                                  }
                                }
                              }
                            }
                            
                            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`))
                            controller.close()
                            return
                          } catch (error: any) {
                            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ chunk: `Error executing query: ${error.message}` })}\n\n`))
                          }
                        } else {
                          // Normal completion
                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                            done: true,
                            stats: {
                              totalActivities: activities.length,
                              totalDistance: totalDistanceMeters,
                              totalTime: totalTime.toFixed(2),
                              avgDistance: (totalDistanceMeters / (activities.length || 1)),
                            },
                          })}\n\n`))
                          controller.close()
                          return
                        }
                      }
                    }
                  } catch (e) {
                    if (line.includes('[DONE]')) {
                      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                        done: true,
                        stats: {
                          totalActivities: activities.length,
                          totalDistance: totalDistanceMeters,
                          totalTime: totalTime.toFixed(2),
                          avgDistance: (totalDistanceMeters / (activities.length || 1)),
                        },
                      })}\n\n`))
                      controller.close()
                      return
                    }
                    continue
                  }
                }
              }
            }
          }
        } catch (error) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            error: error instanceof Error ? error.message : 'Failed to stream response',
          })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Coaching insights error:', error)

    // Return streaming error response
    const errorStream = new ReadableStream({
      start(controller) {
        const errorMessage = error instanceof Error
          ? error.message
          : 'Failed to generate insights'
        
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`))
        controller.close()
      },
    })

    return new Response(errorStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      status: 500,
    })
  }
}
