'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Paper,
  Typography,
  Box,
  Container,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  LinearProgress,
  Skeleton,
  Alert,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  NoSsr,
  Avatar
} from '@mui/material';

import {
  Assessment as AssessmentIcon,
  QuestionAnswer as QuestionIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Timer as TimerIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

// Import mock data and types
import { mockCategories, mockQuestions, mockTests } from "@/app/components/admin/MockData";
import { Test, Question, Category } from "@/app/lib/types";
import { createClientSupabase } from "@/app/supabase";

// Chart components using recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface DashboardStats {
  totalTests: number;
  totalQuestions: number;
  totalCategories: number;
  totalUsers: number;
  totalSessions: number;
  questionsByType: {
    type: string;
    count: number;
  }[];
  categoriesBreakdown: {
    name: string;
    testCount: number;
    questionCount: number;
  }[];
  recentTests: Test[];
  questionTypeData: { name: string; value: number }[];
  categoryPerformanceData: { name: string; questions: number; tests: number }[];
}

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Component for info cards
function InfoCard({ 
  title, 
  value, 
  icon, 
  linkText, 
  linkHref, 
  loading, 
  color = 'primary' 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  linkText: string; 
  linkHref: string; 
  loading: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}) {
  return (
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        height: 180,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[6],
        },
      }}
      elevation={2}
    >
      {/* Background color accent */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          width: '40%', 
          height: '100%', 
          bgcolor: `${color}.light`, 
          opacity: 0.15,
          borderTopLeftRadius: '100%',
          borderBottomLeftRadius: '100%',
          zIndex: 0
        }} 
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, zIndex: 1 }}>
        <Box 
          sx={{ 
            p: 1, 
            borderRadius: '50%', 
            bgcolor: `${color}.light`, 
            color: `${color}.main`,
            display: 'flex',
            mr: 1
          }}
        >
          {icon}
        </Box>
        <Typography component="h2" variant="h6" color="primary" gutterBottom sx={{ mb: 0 }}>
          {title}
        </Typography>
      </Box>
      
      {loading ? (
        <Skeleton variant="rectangular" height={40} animation="wave" />
      ) : (
        <Typography component="p" variant="h3" sx={{ fontWeight: 'bold', my: 1, zIndex: 1 }}>
          {value}
        </Typography>
      )}
      
      <div style={{ flexGrow: 1 }} />
      
      <Box sx={{ mt: 1, zIndex: 1 }}>
        <Link href={linkHref} style={{ textDecoration: 'none' }}>
          <Button size="small" color={color}>
            {linkText}
          </Button>
        </Link>
      </Box>
    </Paper>
  );
}

export default function MuiDashboard() {
  // Wrap the component with NoSsr to avoid hydration issues
  return (
    <NoSsr>
      <MuiDashboardContent />
    </NoSsr>
  );
}

function MuiDashboardContent() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    totalQuestions: 0,
    totalCategories: 0,
    totalUsers: 0,
    totalSessions: 0,
    questionsByType: [],
    categoriesBreakdown: [],
    recentTests: [],
    questionTypeData: [],
    categoryPerformanceData: []
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard stats
  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClientSupabase();
        
        // Fetch real categories from database
        console.log("Fetching categories from database...");
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (categoriesError) {
          console.error("Error fetching categories:", categoriesError);
          throw new Error("Failed to load categories");
        }
        
        console.log("Categories fetched:", categoriesData?.length || 0);
        
        // Use database categories or fallback to mock data
        const categories = categoriesData && categoriesData.length > 0 
          ? categoriesData.map(cat => ({
              id: cat.id,
              name: cat.name,
              description: cat.description || `Category: ${cat.name}`
            }))
          : mockCategories;
        
        // Set categories state
        setCategories(categories);
        
        // Use mock data for tests and questions (for now)
        const tests = mockTests;
        const questions = mockQuestions;
        
        // Count questions by type
        const questionTypeCount = new Map<string, number>();
        questions.forEach(question => {
          const count = questionTypeCount.get(question.type) || 0;
          questionTypeCount.set(question.type, count + 1);
        });
        
        const questionsByType = Array.from(questionTypeCount.entries()).map(
          ([type, count]) => ({ type, count })
        );
        
        // Data for pie chart
        const questionTypeData = questionsByType.map(item => ({
          name: item.type,
          value: item.count
        }));
        
        // Calculate category breakdown
        const categoriesMap = new Map();
        
        // Initialize with all categories
        categories.forEach(category => {
          categoriesMap.set(category.id, {
            name: category.name,
            testCount: 0,
            questionCount: 0
          });
        });
        
        console.log("tests:", tests)
        // Count tests per category
        tests.forEach(test => {
          if (test.categoryIds && Array.isArray(test.categoryIds)) {
            test.categoryIds.forEach(categoryId => {
              if (categoriesMap.has(categoryId)) {
                const categoryData = categoriesMap.get(categoryId);
                categoryData.testCount += 1;
                categoriesMap.set(categoryId, categoryData);
              }
            });
          }
        });
        
        // Count questions per category
        questions.forEach(question => {
          if (question.category && categoriesMap.has(question.category)) {
            const categoryData = categoriesMap.get(question.category);
            categoryData.questionCount += 1;
            categoriesMap.set(question.category, categoryData);
          }
        });
        
        const categoriesBreakdown = Array.from(categoriesMap.values());
        
        // Data for bar chart
        const categoryPerformanceData = categoriesBreakdown.map(cat => ({
          name: cat.name,
          questions: cat.questionCount,
          tests: cat.testCount
        }));
        
        // Set all stats
        setStats({
          totalTests: tests.length,
          totalQuestions: questions.length,
          totalCategories: categories.length,
          totalUsers: 42, // Mock data
          totalSessions: 124, // Mock data
          questionsByType,
          categoriesBreakdown,
          recentTests: tests.slice(0, 5),
          questionTypeData,
          categoryPerformanceData
        });
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    }
    
    loadStats();
  }, []);

  // Format date function
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to get appropriate color for question type
  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'multiple-choice':
        return 'primary';
      case 'single-choice':
        return 'secondary';
      case 'true-false':
        return 'success';
      case 'matching':
        return 'warning';
      case 'sequence':
        return 'info';
      case 'drag-drop':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ px: { xs: 3, sm: 4, md: 5 }, py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {/* Page header */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Dashboard
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/tests/new"
          sx={{ px: 3, py: 1 }}
        >
          Create New Test
        </Button>
      </Box>
      
      {/* Summary cards */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
          Overview
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
          <Box>
            <InfoCard 
              title="Tests" 
              value={stats.totalTests} 
              icon={<AssessmentIcon />} 
              linkText="Manage Tests" 
              linkHref="/admin/tests"
              loading={loading}
              color="primary"
            />
          </Box>
          <Box>
            <InfoCard 
              title="Questions" 
              value={stats.totalQuestions} 
              icon={<QuestionIcon />} 
              linkText="Manage Questions" 
              linkHref="/admin/questions"
              loading={loading}
              color="secondary"
            />
          </Box>
          <Box>
            <InfoCard 
              title="Categories" 
              value={stats.totalCategories} 
              icon={<CategoryIcon />} 
              linkText="Manage Categories" 
              linkHref="/admin/categories"
              loading={loading}
              color="success"
            />
          </Box>
          <Box>
            <InfoCard 
              title="Users" 
              value={stats.totalUsers} 
              icon={<PeopleIcon />} 
              linkText="View Users" 
              linkHref="/admin/users"
              loading={loading}
              color="info"
            />
          </Box>
        </Box>
      </Box>
      
      {/* Charts section */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
          Analytics
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          {/* Bar chart - Categories breakdown */}
          <Box>
            <Paper 
              sx={{ 
                p: 3, 
                height: 420,
                borderRadius: 2,
                boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)'
              }} 
              elevation={1}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'medium' }}>
                Content by Category
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                  <Skeleton variant="rectangular" width="90%" height={300} animation="wave" />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={stats.categoryPerformanceData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                    barSize={25}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#666', fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: '#eee' }}
                    />
                    <YAxis 
                      tick={{ fill: '#666', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                      contentStyle={{ borderRadius: '4px' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: 15 }}
                      iconType="circle"
                    />
                    <Bar 
                      dataKey="questions" 
                      fill="#8884d8" 
                      name="Questions" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="tests" 
                      fill="#82ca9d" 
                      name="Tests" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Box>
          
          {/* Pie chart - Question types */}
          <Box>
            <Paper 
              sx={{ 
                p: 3, 
                height: 420,
                borderRadius: 2,
                boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)'
              }} 
              elevation={1}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'medium' }}>
                Question Types
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                  <Skeleton variant="circular" width={200} height={200} animation="wave" />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={stats.questionTypeData}
                      cx="50%"
                      cy="45%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {stats.questionTypeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ paddingTop: 25 }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Box>
        </Box>
      </Box>
      
      {/* Recent tests */}
      <Box sx={{ mb: 5 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2 
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            Recent Tests
          </Typography>
          <Button 
            variant="outlined" 
            size="small"
            component={Link} 
            href="/admin/tests"
            endIcon={<MoreVertIcon />}
            sx={{ borderRadius: 2 }}
          >
            See All
          </Button>
        </Box>
        
        <Paper 
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)'
          }} 
          elevation={1}
        >
          {loading ? (
            <Box sx={{ p: 3 }}>
              <Skeleton variant="rectangular" height={250} animation="wave" />
            </Box>
          ) : stats.recentTests.length === 0 ? (
            <Box sx={{ py: 6, px: 3, textAlign: 'center' }}>
              <Typography color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                No tests created yet
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                component={Link}
                href="/admin/tests/new"
                sx={{ mt: 1 }}
              >
                Create Your First Test
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ py: 2, px: 3 }}>Test Title</TableCell>
                    <TableCell sx={{ py: 2 }}>Category</TableCell>
                    <TableCell sx={{ py: 2 }}>Questions</TableCell>
                    <TableCell sx={{ py: 2 }}>Time Limit</TableCell>
                    <TableCell sx={{ py: 2 }}>Created</TableCell>
                    <TableCell sx={{ py: 2, pr: 3 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.recentTests.map((test) => (
                    <TableRow key={test.id} hover>
                      <TableCell sx={{ py: 2, px: 3 }}>
                        <Typography variant="subtitle2">{test.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={test.categoryIds && test.categoryIds.length > 0 ? categories.find(c => test.categoryIds!.includes(c.id))?.name || 'Uncategorized' : 'Uncategorized'}
                          size="small"
                          sx={{ 
                            fontSize: '0.75rem', 
                            borderRadius: 1,
                            bgcolor: 'primary.50',
                            color: 'primary.main',
                            border: 'none'
                          }}
                        />
                      </TableCell>
                      <TableCell>{test.questionCount || 0}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TimerIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                          {Math.floor(test.timeLimit / 60)} minutes
                        </Box>
                      </TableCell>
                      <TableCell>{formatDate(test.createdAt ? (typeof test.createdAt === 'string' ? test.createdAt : test.createdAt.toISOString()) : new Date().toISOString())}</TableCell>
                      <TableCell align="right" sx={{ py: 1.5, pr: 3 }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            variant="contained"
                            size="small"
                            component={Link}
                            href={`/admin/tests/${test.id}/edit`}
                            startIcon={<EditIcon fontSize="small" />}
                            sx={{ 
                              borderRadius: 1.5, 
                              px: 2,
                              py: 0.5,
                              boxShadow: 'none',
                              textTransform: 'none'
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            component={Link}
                            href={`/test/${test.id}`}
                            startIcon={<VisibilityIcon fontSize="small" />}
                            sx={{ 
                              borderRadius: 1.5, 
                              px: 2,
                              py: 0.5,
                              textTransform: 'none'
                            }}
                          >
                            Preview
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
      
      {/* Question types breakdown */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
          Question Types Breakdown
        </Typography>
        
        {loading ? (
          <Skeleton variant="rectangular" height={200} animation="wave" />
        ) : stats.questionsByType.length === 0 ? (
          <Paper 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2,
              boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)'
            }}
          >
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No questions created yet
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              component={Link}
              href="/admin/questions/new"
            >
              Create Your First Question
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
            {stats.questionsByType.map((item, index) => (
              <Box key={item.type}>
                <Paper
                  sx={{ 
                    borderRadius: 2,
                    overflow: 'hidden',
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px 0 rgba(0,0,0,0.1)'
                    },
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  elevation={1}
                >
                  <Box
                    sx={{
                      p: 3,
                      background: (theme: any) => `linear-gradient(45deg, ${
                        theme.palette[getQuestionTypeColor(item.type) as any].main
                      }22, ${
                        theme.palette[getQuestionTypeColor(item.type) as any].light
                      }33)`,
                      borderBottom: '1px solid',
                      borderColor: `${getQuestionTypeColor(item.type)}.light`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <Box>
                      <Chip 
                        label={item.type}
                        color={getQuestionTypeColor(item.type) as any}
                        size="small"
                        sx={{ 
                          mb: 2,
                          fontWeight: 500,
                          textTransform: 'capitalize'
                        }}
                      />
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        {item.count}
                      </Typography>
                    </Box>
                    <Avatar
                      sx={{ 
                        bgcolor: `${getQuestionTypeColor(item.type)}.main`,
                        color: 'white',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      <QuestionIcon />
                    </Avatar>
                  </Box>
                  <Box 
                    sx={{ 
                      p: 2, 
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {(item.count / stats.totalQuestions * 100).toFixed(1)}% of total questions
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button 
                      variant="outlined"
                      color={getQuestionTypeColor(item.type) as any}
                      size="small" 
                      component={Link}
                      href={`/admin/questions?type=${item.type}`}
                      sx={{ 
                        alignSelf: 'flex-start',
                        borderRadius: 1.5,
                        textTransform: 'none'
                      }}
                    >
                      View Questions
                    </Button>
                  </Box>
                </Paper>
              </Box>
            ))}
          </Box>
        )}
      </Box>
      
      {/* Categories section */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
          Categories
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
            {[1, 2, 3, 4].map(i => (
              <Box key={i}>
                <Skeleton variant="rectangular" height={120} animation="wave" />
              </Box>
            ))}
          </Box>
        ) : categories.length === 0 ? (
          <Paper 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2,
              boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)'
            }}
          >
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No categories found
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              component={Link}
              href="/admin/categories/new"
            >
              Create Your First Category
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {categories.map((category) => (
              <Box sx={{ flex: "1 1 250px" }}>
                <Paper
                  sx={{ 
                    p: 3,
                    borderRadius: 2,
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px 0 rgba(0,0,0,0.1)'
                    },
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  elevation={1}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CategoryIcon 
                      sx={{ 
                        color: 'primary.main', 
                        mr: 1.5,
                        fontSize: '1.5rem'
                      }} 
                    />
                    <Typography 
                      variant="h6" 
                      component="h3"
                      sx={{ 
                        fontWeight: 'medium',
                        fontSize: '1.1rem'
                      }}
                    >
                      {category.name}
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      mb: 2,
                      flexGrow: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {category.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                    <Button 
                      variant="outlined"
                      size="small" 
                      startIcon={<VisibilityIcon />}
                      component={Link}
                      href={`/admin/categories/${category.id}`}
                      sx={{ 
                        borderRadius: 1.5,
                        textTransform: 'none',
                        flex: 1
                      }}
                    >
                      View
                    </Button>
                    <Button 
                      variant="outlined"
                      size="small" 
                      startIcon={<EditIcon />}
                      component={Link}
                      href={`/admin/categories/${category.id}/edit`}
                      sx={{ 
                        borderRadius: 1.5,
                        textTransform: 'none',
                        flex: 1
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                </Paper>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
}