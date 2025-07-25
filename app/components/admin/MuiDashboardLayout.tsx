'use client';

import * as React from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Container,
  Drawer as MuiDrawer,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  ThemeProvider,
  createTheme,
  ListSubheader
} from '@mui/material';

// Add NoSsr wrapper component
import NoSsr from '@mui/material/NoSsr';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

// Icons
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  QuestionAnswer as QuestionIcon,
  Category as CategoryIcon,
  TimerOutlined as TimerIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

const drawerWidth: number = 240;

// Drawer component with transitions
const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);

// Create custom theme for the dashboard
const mdTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(25, 118, 210, 0.12)',
            borderLeft: '4px solid #1976d2',
            paddingLeft: '12px',
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.20)',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: '40px',
        },
      },
    },
  },
});

interface MuiDashboardLayoutProps {
  children: React.ReactNode;
}

export function MuiDashboardLayout({ children }: MuiDashboardLayoutProps) {
  // Using useEffect to ensure state is only initialized client-side
  const [open, setOpen] = React.useState(false);
  const [initialized, setInitialized] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  // Initialize state after mounting
  React.useEffect(() => {
    setOpen(true);
    setInitialized(true);
  }, []);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  // Function to check if current path matches the navigation item
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Sign out function using auth context
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still redirect even if there's an error
      router.push('/');
    }
  };

  // Only render the full UI when initialized
  if (!initialized) {
    return <div style={{ padding: 20 }}>Initializing admin dashboard...</div>;
  }

  // Show loading state while auth is being determined
  if (authLoading) {
    return <div style={{ padding: 20 }}>Checking authentication...</div>;
  }

  return (
    <NoSsr>
      <ThemeProvider theme={mdTheme}>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
        
        
        {/* Sidebar Navigation */}
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: open ? 'space-between' : 'center',
              px: [1],
              minHeight: 64,
            }}
          >
            {!open && (
              <IconButton onClick={toggleDrawer} sx={{ mb: 1 }}>
                <MenuIcon />
              </IconButton>
            )}
            {open && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <img 
                    src="/Test-engine-logo.webp" 
                    alt="Practice SAP Logo" 
                    style={{ 
                      height: '32px', 
                      width: 'auto',
                      objectFit: 'contain'
                    }} 
                  />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: 'primary.main',
                      fontSize: '1.1rem'
                    }}
                  >
                    Practice SAP
                  </Typography>
                </Box>
                <IconButton onClick={toggleDrawer}>
                  <ChevronLeftIcon />
                </IconButton>
              </>
            )}
          </Toolbar>
          <Divider />
          
          {/* Main Navigation */}
          <List component="nav">
            <Link href="/admin/tests" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
              <ListItemButton selected={isActive('/admin/tests')}>
                <ListItemIcon>
                  <AssessmentIcon color={isActive('/admin/tests') ? 'primary' : undefined} />
                </ListItemIcon>
                <ListItemText primary="Tests" />
              </ListItemButton>
            </Link>

            <Divider sx={{ my: 1 }} />
            
            {/* Sign Out - only show when authenticated */}
            {user && (
              <ListItemButton onClick={handleSignOut}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Sign Out" />
              </ListItemButton>
            )}
            
            {/* Show auth status for debugging */}
            {!user && (
              <ListItemButton disabled>
                <ListItemIcon>
                  <LogoutIcon color="disabled" />
                </ListItemIcon>
                <ListItemText primary="Not Authenticated" />
              </ListItemButton>
            )}
            
            {/* Navigation */}
            <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
              <ListItemButton>
                <ListItemIcon>
                  <ArrowBackIcon />
                </ListItemIcon>
                <ListItemText primary="Back to Website" />
              </ListItemButton>
            </Link>
          </List>
        </Drawer>
        
        {/* Main Content */}
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {children}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
    </NoSsr>
  );
}