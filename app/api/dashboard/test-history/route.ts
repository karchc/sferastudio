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
    
    // Fetch test history with test details
    const { data: testSessions, error: sessionsError } = await supabase
      .from('test_sessions')
      .select(`
        id,
        test_id,
        started_at,
        ended_at,
        score,
        total_questions,
        correct_answers,
        status,
        tests (
          id,
          title,
          category_id,
          categories (
            id,
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(20)
    
    if (sessionsError) {
      console.error('Error fetching test sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch test history' }, { status: 500 })
    }
    
    // Calculate additional metrics for each session
    const enrichedSessions = testSessions?.map(session => {
      const duration = session.ended_at && session.started_at
        ? new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()
        : null
        
      const percentage = session.total_questions > 0
        ? Math.round((session.correct_answers / session.total_questions) * 100)
        : 0
        
      return {
        ...session,
        duration,
        percentage,
        categoryName: (session as any).tests?.categories?.name || 'Unknown',
        testTitle: (session as any).tests?.title || 'Unknown Test'
      }
    }) || []
    
    // Calculate summary statistics
    const completedTests = enrichedSessions.filter(s => s.status === 'completed')
    const averageScore = completedTests.length > 0
      ? Math.round(completedTests.reduce((sum, test) => sum + test.percentage, 0) / completedTests.length)
      : 0
      
    // Find best category
    const categoryScores: Record<string, { total: number, count: number }> = {}
    completedTests.forEach(test => {
      const category = test.categoryName
      if (!categoryScores[category]) {
        categoryScores[category] = { total: 0, count: 0 }
      }
      categoryScores[category].total += test.percentage
      categoryScores[category].count += 1
    })
    
    const bestCategory = Object.entries(categoryScores)
      .map(([name, stats]) => ({
        name,
        average: Math.round(stats.total / stats.count)
      }))
      .sort((a, b) => b.average - a.average)[0]?.name || 'N/A'
    
    return NextResponse.json({
      testHistory: enrichedSessions,
      summary: {
        totalTests: testSessions?.length || 0,
        completedTests: completedTests.length,
        averageScore,
        bestCategory
      }
    })
    
  } catch (error) {
    console.error('Unexpected error in test-history API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}