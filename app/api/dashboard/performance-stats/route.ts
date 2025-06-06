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
    
    // Fetch performance data by category
    const { data: categoryPerformance, error: performanceError } = await supabase
      .from('test_sessions')
      .select(`
        id,
        score,
        total_questions,
        correct_answers,
        tests!inner (
          category_id,
          categories (
            id,
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
    
    if (performanceError) {
      console.error('Error fetching performance data:', performanceError)
      return NextResponse.json({ error: 'Failed to fetch performance statistics' }, { status: 500 })
    }
    
    // Group by category and calculate statistics
    const categoryStats: Record<string, {
      name: string
      totalQuestions: number
      correctAnswers: number
      testCount: number
      averageScore: number
    }> = {}
    
    categoryPerformance?.forEach(session => {
      const categoryId = (session as any).tests?.category_id || (session as any).tests?.categoryIds?.[0]
      const categoryName = (session as any).tests?.categories?.name || 'Unknown'
      
      if (!categoryStats[categoryId]) {
        categoryStats[categoryId] = {
          name: categoryName,
          totalQuestions: 0,
          correctAnswers: 0,
          testCount: 0,
          averageScore: 0
        }
      }
      
      categoryStats[categoryId].totalQuestions += session.total_questions
      categoryStats[categoryId].correctAnswers += session.correct_answers
      categoryStats[categoryId].testCount += 1
    })
    
    // Calculate average scores and prepare data for charts
    const performanceByCategory = Object.values(categoryStats).map(stats => ({
      category: stats.name,
      percentage: stats.totalQuestions > 0 
        ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
        : 0,
      testsCompleted: stats.testCount,
      questionsAnswered: stats.totalQuestions,
      correctAnswers: stats.correctAnswers
    }))
    
    // Identify strengths and weaknesses
    const sortedCategories = [...performanceByCategory].sort((a, b) => b.percentage - a.percentage)
    const strengths = sortedCategories.slice(0, 3).filter(c => c.percentage >= 70)
    const weaknesses = sortedCategories.reverse().slice(0, 3).filter(c => c.percentage < 70)
    
    // Fetch recent performance trend (last 10 tests)
    const { data: recentTests, error: recentError } = await supabase
      .from('test_sessions')
      .select('started_at, score, total_questions, correct_answers')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(10)
    
    if (recentError) {
      console.error('Error fetching recent tests:', recentError)
    }
    
    const performanceTrend = recentTests?.reverse().map(test => ({
      date: new Date(test.started_at).toLocaleDateString(),
      score: test.total_questions > 0
        ? Math.round((test.correct_answers / test.total_questions) * 100)
        : 0
    })) || []
    
    return NextResponse.json({
      performanceByCategory,
      strengths: strengths.map(s => ({
        category: s.category,
        score: s.percentage,
        message: `Excellent performance with ${s.percentage}% accuracy`
      })),
      weaknesses: weaknesses.map(w => ({
        category: w.category,
        score: w.percentage,
        message: `Needs improvement - currently at ${w.percentage}% accuracy`
      })),
      performanceTrend,
      overallStats: {
        totalCategories: performanceByCategory.length,
        averageAccuracy: performanceByCategory.length > 0
          ? Math.round(
              performanceByCategory.reduce((sum, cat) => sum + cat.percentage, 0) / 
              performanceByCategory.length
            )
          : 0
      }
    })
    
  } catch (error) {
    console.error('Unexpected error in performance-stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}