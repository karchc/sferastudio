import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '../../../lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Fetch detailed answer data with question types
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select(`
        id,
        question_id,
        is_correct,
        time_spent,
        test_session_id,
        questions (
          id,
          type,
          text,
          category_id,
          categories (
            id,
            name
          )
        ),
        test_sessions (
          id,
          test_id,
          started_at,
          ended_at,
          status
        )
      `)
      .eq('user_id', user.id)
      .not('test_sessions', 'is', null)
      .eq('test_sessions.status', 'completed')
      .order('created_at', { ascending: false })
      .limit(500) // Analyze last 500 answers
    
    if (answersError) {
      console.error('Error fetching user answers:', answersError)
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 })
    }
    
    // Analyze by question type
    const questionTypeStats: Record<string, {
      total: number
      correct: number
      totalTime: number
      averageTime: number
      accuracy: number
    }> = {}
    
    userAnswers?.forEach(answer => {
      const type = (answer as any).questions?.type || (answer as any).questions?.[0]?.type || 'unknown'
      
      if (!questionTypeStats[type]) {
        questionTypeStats[type] = {
          total: 0,
          correct: 0,
          totalTime: 0,
          averageTime: 0,
          accuracy: 0
        }
      }
      
      questionTypeStats[type].total += 1
      if (answer.is_correct) {
        questionTypeStats[type].correct += 1
      }
      if (answer.time_spent) {
        questionTypeStats[type].totalTime += answer.time_spent
      }
    })
    
    // Calculate averages
    const questionTypeAnalytics = Object.entries(questionTypeStats).map(([type, stats]) => {
      stats.averageTime = stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0
      stats.accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
      
      return {
        questionType: type,
        totalAnswered: stats.total,
        correctAnswers: stats.correct,
        accuracy: stats.accuracy,
        averageTimeSeconds: stats.averageTime,
        performanceLevel: stats.accuracy >= 80 ? 'excellent' : 
                         stats.accuracy >= 60 ? 'good' : 
                         stats.accuracy >= 40 ? 'needs improvement' : 'struggling'
      }
    })
    
    // Identify problem areas (question types with < 60% accuracy)
    const problemAreas = questionTypeAnalytics
      .filter(qt => qt.accuracy < 60 && qt.totalAnswered >= 5)
      .sort((a, b) => a.accuracy - b.accuracy)
    
    // Calculate time distribution
    const timeRanges = {
      fast: 0,      // < 30 seconds
      normal: 0,    // 30-60 seconds
      slow: 0,      // 60-120 seconds
      verySlot: 0   // > 120 seconds
    }
    
    userAnswers?.forEach(answer => {
      if (answer.time_spent) {
        if (answer.time_spent < 30) timeRanges.fast++
        else if (answer.time_spent <= 60) timeRanges.normal++
        else if (answer.time_spent <= 120) timeRanges.slow++
        else timeRanges.verySlot++
      }
    })
    
    // Calculate speed vs accuracy correlation
    const speedAccuracyData = userAnswers?.reduce((acc, answer) => {
      if (answer.time_spent) {
        const timeRange = answer.time_spent < 30 ? 'fast' :
                         answer.time_spent <= 60 ? 'normal' :
                         answer.time_spent <= 120 ? 'slow' : 'very_slow'
        
        if (!acc[timeRange]) {
          acc[timeRange] = { total: 0, correct: 0 }
        }
        
        acc[timeRange].total++
        if (answer.is_correct) {
          acc[timeRange].correct++
        }
      }
      return acc
    }, {} as Record<string, { total: number, correct: number }>)
    
    const speedAccuracyAnalysis = Object.entries(speedAccuracyData || {}).map(([range, data]) => ({
      timeRange: range,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      count: data.total
    }))
    
    // Generate improvement suggestions
    const suggestions = []
    
    // Add suggestions based on problem areas
    problemAreas.forEach(area => {
      suggestions.push({
        type: 'practice',
        priority: 'high',
        message: `Focus on ${area.questionType} questions - current accuracy is only ${area.accuracy}%`,
        category: area.questionType
      })
    })
    
    // Add time-based suggestions
    const avgTimeSpent = userAnswers && userAnswers.length > 0
      ? userAnswers.reduce((sum, a) => sum + (a.time_spent || 0), 0) / userAnswers.length
      : 0
      
    if (avgTimeSpent > 90) {
      suggestions.push({
        type: 'speed',
        priority: 'medium',
        message: 'Try to improve your answer speed - you\'re averaging over 90 seconds per question',
        category: 'time_management'
      })
    }
    
    return NextResponse.json({
      questionTypeAnalytics,
      problemAreas,
      timeDistribution: {
        labels: ['< 30s', '30-60s', '60-120s', '> 120s'],
        data: [timeRanges.fast, timeRanges.normal, timeRanges.slow, timeRanges.verySlot]
      },
      speedAccuracyAnalysis,
      suggestions,
      summary: {
        totalQuestionsAnalyzed: userAnswers?.length || 0,
        averageTimePerQuestion: Math.round(avgTimeSpent),
        overallAccuracy: userAnswers && userAnswers.length > 0
          ? Math.round((userAnswers.filter(a => a.is_correct).length / userAnswers.length) * 100)
          : 0
      }
    })
    
  } catch (error) {
    console.error('Unexpected error in analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}