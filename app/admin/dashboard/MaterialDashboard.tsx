// COMMENTED OUT - Duplicate MaterialDashboard component (use MuiDashboard.tsx instead)
// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { 
//   Box, 
//   Typography, 
//   Grid, 
//   Card, 
//   CardContent, 
//   CardHeader, 
//   Button, 
//   Paper, 
//   Table, 
//   TableBody, 
//   TableCell, 
//   TableContainer, 
//   TableHead, 
//   TableRow, 
//   Skeleton,
//   Alert,
//   Stack,
//   Divider,
//   LinearProgress
// } from '@mui/material';
// import { 
//   Assessment as AssessmentIcon,
//   QuestionAnswer as QuestionIcon,
//   Category as CategoryIcon,
//   Visibility as ViewIcon,
//   Add as AddIcon
// } from '@mui/icons-material';
// import { TestData, Question, Category } from "@/app/lib/types";
// import { mockCategories, mockQuestions, mockTests } from "@/app/components/admin/MockData";

// interface DashboardStats {
//   totalTests: number;
//   totalQuestions: number;
//   totalCategories: number;
//   categoriesBreakdown: {
//     name: string;
//     testCount: number;
//     questionCount: number;
//   }[];
//   recentTests: TestData[];
// }

// export default function MaterialAdminDashboard() {
//   const [stats, setStats] = useState<DashboardStats>({
//     totalTests: 0,
//     totalQuestions: 0,
//     totalCategories: 0,
//     categoriesBreakdown: [],
//     recentTests: [],
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Load dashboard stats
//   useEffect(() => {
//     async function loadStats() {
//       setLoading(true);
//       setError(null);
      
//       try {
//         // Simulate API delay
//         await new Promise(resolve => setTimeout(resolve, 1000));
        
//         // Use mock data for the demo
//         const tests = mockTests;
//         const questions = mockQuestions;
//         const categories = mockCategories;
        
//         // Calculate category breakdown
//         const categoriesMap = new Map();
        
//         // Initialize with all categories
//         categories.forEach(category => {
//           categoriesMap.set(category.id, {
//             name: category.name,
//             testCount: 0,
//             questionCount: 0
//           });
//         });
        
//         // Count tests per category
//         tests.forEach(test => {
//           if (test.category && categoriesMap.has(test.category)) {
//             const categoryData = categoriesMap.get(test.category);
//             categoryData.testCount += 1;
//             categoriesMap.set(test.category, categoryData);
//           }
//         });
        
//         // Count questions per category
//         questions.forEach(question => {
//           if (question.category && categoriesMap.has(question.category)) {
//             const categoryData = categoriesMap.get(question.category);
//             categoryData.questionCount += 1;
//             categoriesMap.set(question.category, categoryData);
//           }
//         });
        
//         // Set stats
//         setStats({
//           totalTests: tests.length,
//           totalQuestions: questions.length,
//           totalCategories: categories.length,
//           categoriesBreakdown: Array.from(categoriesMap.values()),
//           recentTests: tests.slice(0, 5),
//         });
//       } catch (err) {
//         console.error('Error loading dashboard stats:', err);
//         setError(err instanceof Error ? err.message : 'Failed to load dashboard stats');
//       } finally {
//         setLoading(false);
//       }
//     }
    
//     loadStats();
//   }, []);

//   return (
//     <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
//       <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
//         Admin Dashboard
//       </Typography>
      
//       {error && (
//         <Alert severity="error" sx={{ mb: 4 }}>
//           {error}
//         </Alert>
//       )}
      
//       {/* Summary Stats */}
//       <Grid container spacing={3} sx={{ mb: 5 }}>
//         <Grid item xs={12} md={4}>
//           <Card elevation={2} sx={{ height: '100%' }}>
//             <CardContent sx={{ 
//               display: 'flex', 
//               flexDirection: 'column', 
//               height: '100%', 
//               p: 3 
//             }}>
//               <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
//                 <AssessmentIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
//                 <Typography variant="h6" component="h2">
//                   Total Tests
//                 </Typography>
//               </Box>
//               {loading ? (
//                 <Skeleton variant="rectangular" height={60} />
//               ) : (
//                 <>
//                   <Typography variant="h3" component="p" sx={{ fontWeight: 'bold', mb: 2 }}>
//                     {stats.totalTests}
//                   </Typography>
//                   <Button 
//                     component={Link} 
//                     href="/admin/tests"
//                     variant="outlined" 
//                     color="primary"
//                     sx={{ mt: 'auto' }}
//                     endIcon={<ViewIcon />}
//                   >
//                     Manage Tests
//                   </Button>
//                 </>
//               )}
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} md={4}>
//           <Card elevation={2} sx={{ height: '100%' }}>
//             <CardContent sx={{ 
//               display: 'flex', 
//               flexDirection: 'column', 
//               height: '100%', 
//               p: 3 
//             }}>
//               <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
//                 <QuestionIcon sx={{ fontSize: 32, color: 'secondary.main', mr: 1 }} />
//                 <Typography variant="h6" component="h2">
//                   Total Questions
//                 </Typography>
//               </Box>
//               {loading ? (
//                 <Skeleton variant="rectangular" height={60} />
//               ) : (
//                 <>
//                   <Typography variant="h3" component="p" sx={{ fontWeight: 'bold', mb: 2 }}>
//                     {stats.totalQuestions}
//                   </Typography>
//                   <Button 
//                     component={Link} 
//                     href="/admin/questions"
//                     variant="outlined" 
//                     color="secondary"
//                     sx={{ mt: 'auto' }}
//                     endIcon={<ViewIcon />}
//                   >
//                     Manage Questions
//                   </Button>
//                 </>
//               )}
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} md={4}>
//           <Card elevation={2} sx={{ height: '100%' }}>
//             <CardContent sx={{ 
//               display: 'flex', 
//               flexDirection: 'column', 
//               height: '100%', 
//               p: 3 
//             }}>
//               <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
//                 <CategoryIcon sx={{ fontSize: 32, color: 'success.main', mr: 1 }} />
//                 <Typography variant="h6" component="h2">
//                   Categories
//                 </Typography>
//               </Box>
//               {loading ? (
//                 <Skeleton variant="rectangular" height={60} />
//               ) : (
//                 <>
//                   <Typography variant="h3" component="p" sx={{ fontWeight: 'bold', mb: 2 }}>
//                     {stats.totalCategories}
//                   </Typography>
//                   <Button 
//                     component={Link} 
//                     href="/admin/categories"
//                     variant="outlined" 
//                     color="success"
//                     sx={{ mt: 'auto' }}
//                     endIcon={<ViewIcon />}
//                   >
//                     Manage Categories
//                   </Button>
//                 </>
//               )}
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>
      
//       {/* Recent Tests */}
//       <Box sx={{ mb: 5 }}>
//         <Box sx={{ 
//           display: 'flex', 
//           justifyContent: 'space-between', 
//           alignItems: 'center', 
//           mb: 2 
//         }}>
//           <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
//             Recent Tests
//           </Typography>
//           <Button 
//             component={Link} 
//             href="/admin/tests/new" 
//             variant="contained" 
//             color="primary" 
//             startIcon={<AddIcon />}
//           >
//             Create New Test
//           </Button>
//         </Box>
        
//         {loading ? (
//           <Skeleton variant="rectangular" height={200} />
//         ) : stats.recentTests.length === 0 ? (
//           <Card>
//             <CardContent sx={{ py: 6, textAlign: 'center' }}>
//               <Typography color="text.secondary" gutterBottom>
//                 No tests created yet.
//               </Typography>
//               <Button 
//                 component={Link} 
//                 href="/admin/tests/new" 
//                 variant="contained" 
//                 color="primary" 
//                 sx={{ mt: 2 }}
//                 startIcon={<AddIcon />}
//               >
//                 Create Your First Test
//               </Button>
//             </CardContent>
//           </Card>
//         ) : (
//           <TableContainer component={Paper} elevation={2}>
//             <Table sx={{ minWidth: 650 }}>
//               <TableHead>
//                 <TableRow sx={{ backgroundColor: 'primary.light' }}>
//                   <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Title</TableCell>
//                   <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Questions</TableCell>
//                   <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Time Limit</TableCell>
//                   <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Actions</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {stats.recentTests.map((test) => (
//                   <TableRow key={test.id} hover>
//                     <TableCell component="th" scope="row">
//                       <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
//                         {test.title}
//                       </Typography>
//                     </TableCell>
//                     <TableCell>{test.questions.length}</TableCell>
//                     <TableCell>{Math.floor(test.timeLimit / 60)} minutes</TableCell>
//                     <TableCell>
//                       <Stack direction="row" spacing={1}>
//                         <Button 
//                           component={Link}
//                           href={`/admin/tests/${test.id}/questions`}
//                           variant="contained" 
//                           size="small"
//                           sx={{ textTransform: 'none' }}
//                         >
//                           Manage
//                         </Button>
//                         <Button 
//                           component={Link}
//                           href={`/test/${test.id}`}
//                           variant="outlined" 
//                           size="small"
//                           sx={{ textTransform: 'none' }}
//                         >
//                           Preview
//                         </Button>
//                       </Stack>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         )}
//       </Box>
      
//       {/* Categories Breakdown */}
//       <Box>
//         <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
//           Categories Breakdown
//         </Typography>
        
//         {loading ? (
//           <Skeleton variant="rectangular" height={250} />
//         ) : stats.categoriesBreakdown.length === 0 ? (
//           <Card>
//             <CardContent sx={{ py: 6, textAlign: 'center' }}>
//               <Typography color="text.secondary" gutterBottom>
//                 No categories created yet.
//               </Typography>
//               <Button 
//                 component={Link} 
//                 href="/admin/categories/new" 
//                 variant="contained" 
//                 color="primary" 
//                 sx={{ mt: 2 }}
//                 startIcon={<AddIcon />}
//               >
//                 Create Your First Category
//               </Button>
//             </CardContent>
//           </Card>
//         ) : (
//           <Grid container spacing={3}>
//             {stats.categoriesBreakdown.map((category, index) => (
//               <Grid item xs={12} md={6} key={index}>
//                 <Card elevation={2}>
//                   <CardContent sx={{ p: 3 }}>
//                     <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
//                       {category.name}
//                     </Typography>
//                     <Grid container spacing={2} sx={{ mb: 2 }}>
//                       <Grid item xs={6}>
//                         <Typography variant="body2" color="text.secondary">
//                           Tests
//                         </Typography>
//                         <Typography variant="h5" fontWeight="bold">
//                           {category.testCount}
//                         </Typography>
//                       </Grid>
//                       <Grid item xs={6}>
//                         <Typography variant="body2" color="text.secondary">
//                           Questions
//                         </Typography>
//                         <Typography variant="h5" fontWeight="bold">
//                           {category.questionCount}
//                         </Typography>
//                       </Grid>
//                     </Grid>
//                     <Divider sx={{ my: 2 }} />
//                     <Typography variant="body2" sx={{ mb: 1 }}>
//                       Question Coverage
//                     </Typography>
//                     <LinearProgress 
//                       variant="determinate" 
//                       value={Math.min(100, (category.questionCount / (stats.totalQuestions || 1)) * 100)} 
//                       sx={{ height: 8, borderRadius: 5, mb: 1 }}
//                     />
//                     <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
//                       <Button 
//                         component={Link}
//                         href={`/admin/categories/${index}`}
//                         variant="text" 
//                         color="primary"
//                       >
//                         View Details
//                       </Button>
//                     </Box>
//                   </CardContent>
//                 </Card>
//               </Grid>
//             ))}
//           </Grid>
//         )}
//       </Box>
//     </Box>
//   );
// }