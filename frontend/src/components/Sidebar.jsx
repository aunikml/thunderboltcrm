import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
    Drawer, List, ListItem, ListItemButton, ListItemIcon, 
    ListItemText, Toolbar, Typography, Divider, Box, Avatar 
} from '@mui/material';
import { 
    Dashboard as DashboardIcon, 
    PersonAdd as PersonAddIcon, 
    ExitToApp as LogoutIcon,
    School as SchoolIcon,
    Groups as GroupsIcon,
    RocketLaunch as CampaignIcon, // Icon for Campaigner
    AutoGraph as AutoGraphIcon,
    Layers as LayersIcon
} from '@mui/icons-material';
import { jwtDecode } from 'jwt-decode';

const drawerWidth = 280;

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');
    
    let decoded = { email: 'User', roles: [], is_superuser: false };
    if (token) {
        try { decoded = jwtDecode(token); } catch(e) {}
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // --- RBAC PERMISSIONS ---
    const isSuper = decoded.is_superuser;
    const isAdmin = isSuper || decoded.roles?.includes('Admin');
    const isManager = isAdmin || decoded.roles?.includes('Manager');
    
    // Campaigners need access for Campaign Manager, Manager, and Admin
    const isCampaignManager = isManager || decoded.roles?.includes('Campaign manager');
    
    // Lead Bank needs access for Lead Manager, Manager, and Admin
    const isLeadManager = isManager || decoded.roles?.includes('Lead manager');
    
    // Programs need access for Skills Admin, Manager, and Admin
    const isSkillsAdmin = isManager || decoded.roles?.includes('Skills admin');

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, visible: true },
        { label: 'Lead Bank', path: '/leads', icon: <GroupsIcon />, visible: isLeadManager },
        { label: 'Campaigner', path: '/campaigns', icon: <CampaignIcon />, visible: isCampaignManager },
        { label: 'Academic Programs', path: '/programs', icon: <SchoolIcon />, visible: isSkillsAdmin },
        { label: 'Staff Management', path: '/enroll', icon: <PersonAddIcon />, visible: isAdmin },
    ];

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': { 
                    width: drawerWidth, 
                    boxSizing: 'border-box', 
                    borderRight: '1px solid #eef0f2',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '4px 0 10px rgba(0,0,0,0.02)'
                },
            }}
        >
            {/* Branding */}
            <Toolbar sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 4, px: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#1a237e', letterSpacing: '-1.5px' }}>
                    THUNDERBOLT
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    Academic Console
                </Typography>
            </Toolbar>
            
            <Divider variant="middle" />

            {/* Navigation */}
            <Box sx={{ flexGrow: 1, mt: 3, px: 2 }}>
                <List>
                    {navItems.map((item) => item.visible && (
                        <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton 
                                component={Link} 
                                to={item.path} 
                                selected={location.pathname.startsWith(item.path)} // Logic to keep selected if in sub-pages
                                sx={{ 
                                    borderRadius: 3,
                                    '&.Mui-selected': { bgcolor: '#e8eaf6', color: '#1a237e' },
                                    '&.Mui-selected:hover': { bgcolor: '#d1d9ff' },
                                }}
                            >
                                <ListItemIcon sx={{ color: location.pathname.startsWith(item.path) ? '#1a237e' : 'inherit' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.label} 
                                    primaryTypographyProps={{ fontWeight: location.pathname.startsWith(item.path) ? 800 : 600 }} 
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                <Divider sx={{ my: 3, mx: 1 }} />
                
                <Typography variant="caption" sx={{ px: 3, fontWeight: 900, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 1 }}>
                    AI Intelligence
                </Typography>
                <List sx={{ px: 0, opacity: 0.4 }}>
                    <ListItem disablePadding>
                        <ListItemButton disabled>
                            <ListItemIcon><AutoGraphIcon /></ListItemIcon>
                            <ListItemText primary="Market Analysis" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>

            {/* User Profile Area */}
            <Box sx={{ p: 2, m: 2, bgcolor: '#f8f9fa', borderRadius: 4, border: '1px solid #eee' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, px: 1 }}>
                    <Avatar sx={{ bgcolor: '#1a237e', width: 36, height: 36, fontSize: '0.9rem', fontWeight: 'bold' }}>
                        {decoded.email[0].toUpperCase()}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, noWrap: true, color: '#333' }}>
                            {decoded.email.split('@')[0]}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                            {decoded.is_superuser ? 'Super Admin' : (decoded.roles[0] || 'Staff')}
                        </Typography>
                    </Box>
                </Box>
                <ListItemButton 
                    onClick={handleLogout} 
                    sx={{ 
                        borderRadius: 3, color: '#d32f2f', bgcolor: '#fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        '&:hover': { bgcolor: '#ffebee' }
                    }}
                >
                    <ListItemIcon><LogoutIcon color="error" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Sign Out" primaryTypographyProps={{ fontWeight: 800, fontSize: '0.85rem' }} />
                </ListItemButton>
            </Box>
        </Drawer>
    );
};

export default Sidebar;