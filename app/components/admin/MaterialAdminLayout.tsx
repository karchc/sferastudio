"use client";

import { useState } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Divider, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Button,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';

import {
  Dashboard as DashboardIcon,
  Quiz as QuizIcon,
  LiveHelp as QuestionIcon,
  Category as CategoryIcon,
  Storage as DataIcon,
  Login as LoginIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  ChevronLeft as ChevronLeftIcon,
  Settings as SettingsIcon,
  VpnKey as KeyIcon
} from '@mui/icons-material';

const drawerWidth = 280;

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  badge?: string;
}

export function MaterialAdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const navItems: NavItem[] = [
    { path: "/admin/tests", label: "Test Management", icon: <QuizIcon /> },
    { path: "/admin/questions", label: "Question Management", icon: <QuestionIcon /> },
    { path: "/admin/categories", label: "Categories", icon: <CategoryIcon /> },
    { path: "/admin/test-data", label: "Test Data", icon: <DataIcon /> },
  ];

  const specialItems: NavItem[] = [
    { 
      path: "/admin/categories-basic", 
      label: "Basic CRUD Test", 
      icon: <SettingsIcon />, 
      variant: 'success',
      badge: '🔧'
    },
    { 
      path: "/admin/auth", 
      label: "Admin Login", 
      icon: <LoginIcon /> 
    },
    { 
      path: "/admin/auth-bypass", 
      label: "Auth Bypass", 
      icon: <LoginIcon />, 
      variant: 'warning',
      badge: '⚠️'
    },
    { 
      path: "/admin/direct-login", 
      label: "Direct Login", 
      icon: <KeyIcon />, 
      variant: 'info',
      badge: '🔑'
    },
    { 
      path: "/admin/categories-admin", 
      label: "Admin Categories", 
      icon: <CategoryIcon />, 
      variant: 'success',
      badge: '✅'
    },
  ];
  
  // Function to get button color based on variant
  const getButtonColor = (variant?: string) => {
    switch(variant) {
      case 'success':
        return {
          bgcolor: isActive(`/admin/${variant}`) ? 'success.main' : 'success.light',
          color: isActive(`/admin/${variant}`) ? 'white' : 'success.dark',
          '&:hover': { bgcolor: 'success.main', color: 'white' }
        };
      case 'warning':
        return {
          bgcolor: isActive(`/admin/${variant}`) ? 'warning.main' : 'warning.light', 
          color: isActive(`/admin/${variant}`) ? 'white' : 'warning.dark',
          '&:hover': { bgcolor: 'warning.main', color: 'white' }
        };
      case 'error':
        return {
          bgcolor: isActive(`/admin/${variant}`) ? 'error.main' : 'error.light',
          color: isActive(`/admin/${variant}`) ? 'white' : 'error.dark',
          '&:hover': { bgcolor: 'error.main', color: 'white' }
        };
      case 'info':
        return {
          bgcolor: isActive(`/admin/${variant}`) ? 'info.main' : 'info.light',
          color: isActive(`/admin/${variant}`) ? 'white' : 'info.dark',
          '&:hover': { bgcolor: 'info.main', color: 'white' }
        };
      default:
        return {};
    }
  };

  const drawer = (
    <div>
      <Toolbar sx={{ 
        justifyContent: 'center', 
        p: 1,
        bgcolor: 'primary.dark'
      }}>
        <Typography variant="h6" component="div" sx={{ color: 'white', fontWeight: 'bold' }}>
          Test Engine Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <Link href={item.path} style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}>
              <ListItemButton 
                selected={isActive(item.path)}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive(item.path) ? 'white' : 'inherit',
                  minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <List>
        {specialItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <Link href={item.path} style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}>
              <ListItemButton 
                selected={isActive(item.path)}
                sx={{
                  ...(isActive(item.path) && !item.variant && {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    }
                  }),
                  ...(item.variant && getButtonColor(item.variant))
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive(item.path) ? 'inherit' : 'inherit',
                  minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {item.badge && (
                        <Box component="span" sx={{ mr: 1 }}>
                          {item.badge}
                        </Box>
                      )}
                      {item.label}
                    </Box>
                  } 
                />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Test Engine Admin Dashboard
          </Typography>
          <Button 
            variant="outlined" 
            component={Link} 
            href="/" 
            startIcon={<HomeIcon />}
          >
            Back to Home
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="admin navigation"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: '#f5f5f5',
          minHeight: '100vh'
        }}
      >
        <Toolbar /> {/* This creates space for the AppBar */}
        {children}
      </Box>
    </Box>
  );
}