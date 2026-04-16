import React from 'react';
import Sidebar from './Sidebar';
import { Box } from '@mui/material';

const Layout = ({ children }) => {
    return (
        <Box sx={{ display: 'flex', bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            <Sidebar />
            <Box component="main" sx={{ flexGrow: 1, p: 4, mt: 2 }}>
                {children}
            </Box>
        </Box>
    );
};

export default Layout;