"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Tabs,
  Tab,
  Container,
  Chip,
  CircularProgress,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Stack,
  Alert
} from '@mui/material';

import {
  AccessTime as ClockIcon,
  Star as StarIcon,
  CheckCircle,
  ExpandMore as ExpandMoreIcon,
  ShoppingCart as ShoppingCartIcon,
  Assessment as AssessmentIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';
import { PurchaseModal } from "../components/ui/purchase-modal";
import { AuthRequiredModal } from "../components/ui/auth-required-modal";
import { SuccessModal } from "../components/ui/success-modal";
import { PurchaseButton } from "../components/stripe/PurchaseButton";
import { Button as ShadcnButton } from "../components/ui/button";
import { Loader2, ShoppingCart } from 'lucide-react';

// Material UI Dashboard with TabPanel component for better organization
function TabPanel(props: any) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: any) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
}

export default function MaterialDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [purchasedTests, setPurchasedTests] = useState<any[]>([]);
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testsLoading, setTestsLoading] = useState(false);
  const [takingTestId, setTakingTestId] = useState<string | null>(null);
  const [previewingTestId, setPreviewingTestId] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [purchasingTestId, setPurchasingTestId] = useState<string | null>(null);
  const [testStatistics, setTestStatistics] = useState<Record<string, any>>({});
  const [hasFetchedTests, setHasFetchedTests] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Helper function to format time in seconds to MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Fetch purchased tests
  const fetchPurchasedTests = async () => {
    console.log('Fetching purchased tests...');
    setTestsLoading(true);
    try {
      const response = await fetch('/api/user/purchased-tests');
      if (response.ok) {
        const data = await response.json();
        const tests = data.purchasedTests || [];
        console.log('Purchased tests received:', tests.length);
        setPurchasedTests(tests);
        
        // Fetch statistics for each purchased test
        tests.forEach((purchase: any) => {
          if (purchase.test?.id) {
            fetchTestStatistics(purchase.test.id);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching purchased tests:', error);
    } finally {
      setTestsLoading(false);
    }
  };

  // Fetch available tests for purchase (excluding already purchased)
  const fetchAvailableTests = async () => {
    try {
      const response = await fetch('/api/test');
      if (response.ok) {
        const data = await response.json();
        
        // Filter out tests that the user has already purchased
        const purchasedTestIds = purchasedTests.map(p => p.test?.id).filter(Boolean);
        const unpurchasedTests = (data || []).filter((test: any) => 
          !purchasedTestIds.includes(test.id)
        );
        
        setAvailableTests(unpurchasedTests);
      }
    } catch (error) {
      console.error('Error fetching available tests:', error);
    }
  };

  // Fetch test statistics for a specific test
  const fetchTestStatistics = async (testId: string) => {
    try {
      const response = await fetch(`/api/test/${testId}/history`);
      if (response.ok) {
        const data = await response.json();
        setTestStatistics(prev => ({
          ...prev,
          [testId]: data.overallStats
        }));
      }
    } catch (error) {
      console.error('Error fetching test statistics:', error);
    }
  };

  const handleTakeTest = (testId: string) => {
    setTakingTestId(testId);
    router.push(`/test/${testId}`);
  };

  const handlePreviewTest = (testId: string) => {
    setPreviewingTestId(testId);
    router.push(`/preview-test/${testId}`);
  };

  const handlePurchase = (test: any) => {
    setSelectedTest(test);

    if (!user) {
      // User not logged in, show auth modal
      setShowAuthModal(true);
      return;
    }

    // User is logged in, show purchase confirmation modal
    setShowPurchaseModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedTest) return;

    setPurchasingTestId(selectedTest.id);
    try {
      // Add test to user's library
      const response = await fetch('/api/user/purchased-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_id: selectedTest.id,
          status: 'active'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setShowPurchaseModal(false);

        // Refresh purchased tests (this will also trigger fetchAvailableTests)
        await fetchPurchasedTests();

        // Show success modal
        setSuccessMessage(result.message || 'Test successfully added to your library!');
        setShowSuccessModal(true);
      } else {
        const error = await response.json();
        if (error.error === 'You already own this test') {
          setShowPurchaseModal(false);
          setSuccessMessage('You already own this test! You can find it in "My Tests" tab.');
          setShowSuccessModal(true);
          await fetchPurchasedTests();
        } else {
          setShowPurchaseModal(false);
          setSuccessMessage(`Error: ${error.error || 'Failed to add test to library'}`);
          setShowSuccessModal(true);
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setShowPurchaseModal(false);
      setSuccessMessage('An error occurred while adding the test. Please try again.');
      setShowSuccessModal(true);
    } finally {
      setPurchasingTestId(null);
    }
  };

  const handleClosePurchaseModal = () => {
    setShowPurchaseModal(false);
    setSelectedTest(null);
    setPurchasingTestId(null);
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
    setSelectedTest(null);
  };

  useEffect(() => {
    if (user && authProfile) {
      setProfile(authProfile);
      setLoading(false);
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authProfile, authLoading]);
  
  // Redirect admin users to /admin and fetch purchased tests for regular users
  useEffect(() => {
    if (profile?.is_admin) {
      router.push('/admin');
    } else if (profile && !hasFetchedTests) {
      setHasFetchedTests(true);
      fetchPurchasedTests();
    }
  }, [profile, router, hasFetchedTests]);
  
  // Fetch available tests after purchased tests are loaded
  useEffect(() => {
    if (!testsLoading && purchasedTests.length >= 0) {
      fetchAvailableTests();
    }
  }, [purchasedTests, testsLoading]);

  // Handle payment success callback
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const testId = searchParams.get('test_id');

    if (paymentStatus === 'success' && testId) {
      setPaymentSuccess(true);
      // Refresh purchased tests to show the newly purchased test
      fetchPurchasedTests();
      // Switch to "My Tests" tab
      setTabValue(0);

      // Clear the URL parameters
      router.replace('/dashboard');

      // Auto-hide success message after 10 seconds
      setTimeout(() => setPaymentSuccess(false), 10000);
    } else if (paymentStatus === 'cancelled') {
      // Payment was cancelled
      console.log('Payment was cancelled');
      // Clear the URL parameters
      router.replace('/dashboard');
    }
  }, [searchParams, router]);
  
  const formatDate = (dateString: string) => {
    const options = { year: 'numeric' as const, month: 'short' as const, day: 'numeric' as const };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const handleTabChange = (_event: any, newValue: any) => {
    setTabValue(newValue);
  };

  // Show loading while redirecting admin users
  if (profile?.is_admin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Redirecting to admin dashboard...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Dashboard Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 4, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}
            src={profile?.avatar_url}
          >
            {loading ? (
              <Skeleton variant="circular" width={56} height={56} />
            ) : (
              profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'
            )}
          </Avatar>
          <Box>
            <Typography variant="h5" component="h1" fontWeight="bold">
              {loading ? (
                <Skeleton width={200} />
              ) : (
                profile?.full_name || user?.email?.split('@')[0] || 'User'
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {loading ? (
                <Skeleton width={150} />
              ) : (
                user?.email || 'Loading...'
              )}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Payment Success Alert */}
      {paymentSuccess && (
        <Alert
          severity="success"
          onClose={() => setPaymentSuccess(false)}
          sx={{ mb: 3 }}
        >
          Payment successful! Your test has been added to your library.
        </Alert>
      )}

      {/* Dashboard Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="dashboard tabs"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="My Tests" {...a11yProps(0)} />
          <Tab label="Buy More Tests" {...a11yProps(1)} />
        </Tabs>
      </Box>
      
      {/* My Tests Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="h2" fontWeight="bold">My Purchased Tests</Typography>
            <Chip 
              label={`${purchasedTests.length} test${purchasedTests.length !== 1 ? 's' : ''} owned`} 
              color="primary" 
              variant="outlined"
            />
          </Box>
          
          {testsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : purchasedTests.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {purchasedTests.map((purchase: any) => (
                <Accordion key={purchase.purchaseId} elevation={2}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <AssessmentIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="medium">
                            {purchase.test?.title || 'Untitled Test'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Purchased {formatDate(purchase.purchaseDate)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label="OWNED" 
                          color="success" 
                          size="small" 
                          icon={<CheckCircle />}
                        />
                        <Typography variant="body2" color="text.secondary">
                          ${purchase.paymentAmount || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Test Details */}
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          Test Details
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <ClockIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                Time Limit: {Math.floor((purchase.test?.time_limit || 0) / 60)} minutes
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <CreditCardIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                Purchase Date: {formatDate(purchase.purchaseDate)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {purchase.test?.description || 'No description available'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Divider />
                      
                      {/* Test Statistics */}
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          Your Performance
                        </Typography>
                        {testStatistics[purchase.test?.id] ? (
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                              <Typography variant="h4" fontWeight="bold" color="primary">
                                {testStatistics[purchase.test?.id]?.totalAttempts || 0}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Attempts
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                              <Typography variant="h4" fontWeight="bold" color="success.main">
                                {testStatistics[purchase.test?.id]?.bestScore || 0}%
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Best Score
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                              <Typography variant="h4" fontWeight="bold" color="warning.main">
                                {testStatistics[purchase.test?.id]?.averageScore || 0}%
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Avg Score
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                              <Typography variant="h4" fontWeight="bold" color="info.main">
                                {formatTime(testStatistics[purchase.test?.id]?.averageTime || 0)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Avg Time
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                              <Typography variant="h4" fontWeight="bold" color="primary">
                                0
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Attempts
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                              <Typography variant="h4" fontWeight="bold" color="success.main">
                                -
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Best Score
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                              <Typography variant="h4" fontWeight="bold" color="warning.main">
                                -
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Avg Score
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                              <Typography variant="h4" fontWeight="bold" color="info.main">
                                -
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Time Spent
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>
                      
                      <Divider />
                      
                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button 
                          variant="outlined" 
                          component={Link} 
                          href={`/test-history/${purchase.test?.id}`}
                        >
                          View History
                        </Button>
                        <Button 
                          variant="contained" 
                          onClick={() => handleTakeTest(purchase.test?.id)}
                          startIcon={!takingTestId || takingTestId !== purchase.test?.id ? <StarIcon /> : undefined}
                          disabled={takingTestId === purchase.test?.id}
                        >
                          {takingTestId === purchase.test?.id ? (
                            <>
                              <CircularProgress size={16} sx={{ mr: 1 }} />
                              Loading...
                            </>
                          ) : (
                            'Take Test'
                          )}
                        </Button>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ) : (
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary" gutterBottom>
                  You haven't purchased any tests yet.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => setTabValue(1)}
                  startIcon={<ShoppingCartIcon />}
                >
                  Browse Available Tests
                </Button>
              </CardContent>
            </Card>
          )}
        </Box>
      </TabPanel>

      {/* Buy More Tests Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="h2" fontWeight="bold">Available Tests</Typography>
            <Typography variant="body2" color="text.secondary">
              {availableTests.length} test{availableTests.length !== 1 ? 's' : ''} available
            </Typography>
          </Box>
          
          {availableTests.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
              {availableTests.map((test: any) => {
                const isPaidTest = !test.is_free && test.price && test.price > 0;

                return (
                  <Card key={test.id} elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h3" fontWeight="medium" gutterBottom>
                          {test.title}
                        </Typography>
                        {isPaidTest && (
                          <Chip
                            label={`${test.currency || 'USD'} $${parseFloat(test.price).toFixed(2)}`}
                            color="primary"
                            size="small"
                            icon={<CreditCardIcon />}
                          />
                        )}
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {test.description || 'No description available'}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <ClockIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {Math.floor((test.time_limit || 0) / 60)} minutes
                        </Typography>
                      </Box>
                    </CardContent>

                    <Box sx={{ p: 2, pt: 0 }}>
                      <Stack spacing={1}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => handlePreviewTest(test.id)}
                          disabled={previewingTestId === test.id}
                        >
                          {previewingTestId === test.id ? (
                            <>
                              <CircularProgress size={16} sx={{ mr: 1 }} />
                              Loading...
                            </>
                          ) : (
                            'Preview Test'
                          )}
                        </Button>

                        {isPaidTest ? (
                          <PurchaseButton
                            testId={test.id}
                            testTitle={test.title}
                            price={parseFloat(test.price)}
                            currency={test.currency || 'USD'}
                            className="w-full"
                          />
                        ) : (
                          <ShadcnButton
                            className="w-full"
                            onClick={() => handlePurchase(test)}
                            disabled={purchasingTestId === test.id}
                          >
                            {purchasingTestId === test.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Add to Library
                              </>
                            )}
                          </ShadcnButton>
                        )}
                      </Stack>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          ) : (
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary" gutterBottom>
                  No tests available at the moment.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check back later for new test releases.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </TabPanel>

      {/* Modals */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={handleClosePurchaseModal}
        onConfirm={handleConfirmPurchase}
        test={selectedTest || { id: '', title: '', time_limit: 0 }}
        isLoading={purchasingTestId === selectedTest?.id}
      />

      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal}
        test={selectedTest || undefined}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setTabValue(0); // Switch to "My Tests" tab
          setSelectedTest(null);
        }}
        title="Added to Library"
        message={successMessage}
        buttonText="Go to My Tests"
      />
    </Container>
  );
}