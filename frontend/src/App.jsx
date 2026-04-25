import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// --- PAGE IMPORTS ---
import Login from './pages/Login';
import AdminEnrollment from './pages/AdminEnrollment';
import ChangePassword from './pages/ChangePassword';
import Programs from './pages/Programs';
import LeadBank from './pages/LeadBank';
import DiscoveryHub from './pages/DiscoveryHub';
import B2BHub from './pages/B2BHub';
import AgentTuning from './pages/AgentTuning';
import Campaigns from './pages/Campaigns';
import CampaignWorkspace from './pages/CampaignWorkspace';
import Dashboard from './pages/Dashboard'; // <--- THE REAL DASHBOARD WITH CHARTS

// --- LAYOUT COMPONENTS ---
import Layout from './components/Layout';

/**
 * AUTH GUARD: ProtectedRoute
 * This is the central security logic for the entire CRM.
 * 1. Checks for a valid JWT token.
 * 2. Forces users to /change-password if 'is_first_login' is true.
 * 3. Enforces Role-Based Access Control (RBAC).
 */
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
    const token = localStorage.getItem('token');
    const location = useLocation();

    // 1. Check if token exists
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        // 2. Session Expiry Check
        if (decoded.exp < currentTime) {
            localStorage.removeItem('token');
            return <Navigate to="/login" replace />;
        }

        // 3. Forced Password Change Policy
        // If flag is true and user isn't already on the change-password page, redirect them.
        if (decoded.is_first_login && location.pathname !== '/change-password') {
            return <Navigate to="/change-password" replace />;
        }

        // 4. RBAC Enforcement
        if (requiredRoles.length > 0) {
            const userRoles = decoded.roles || [];
            
            // Admins, Superusers, and Managers have 'Global Access'
            const hasGlobalAccess = 
                decoded.is_superuser || 
                userRoles.includes('Admin') || 
                userRoles.includes('Manager');

            // Check if the user has at least one of the specific required roles
            const hasSpecificRole = requiredRoles.some(role => userRoles.includes(role));

            if (!hasGlobalAccess && !hasSpecificRole) {
                console.warn(`Access Denied: ${location.pathname}. User roles:`, userRoles);
                return <Navigate to="/dashboard" replace />;
            }
        }

        return children;
    } catch (error) {
        console.error("Auth Guard Error:", error);
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }
};

function App() {
    return (
        <Router>
            <Routes>
                {/* --- PUBLIC ROUTES --- */}
                <Route path="/login" element={<Login />} />

                {/* --- SECURITY ROUTES (No Sidebar) --- */}
                <Route 
                    path="/change-password" 
                    element={
                        <ProtectedRoute>
                            <ChangePassword />
                        </ProtectedRoute>
                    } 
                />

                {/* --- CORE WORKSPACE ROUTES (With Sidebar/Layout) --- */}
                
                {/* 1. Main Dashboard (Analytics & Overview) */}
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <Layout><Dashboard /></Layout>
                        </ProtectedRoute>
                    } 
                />

                {/* 2. Lead Bank (Requires Lead manager or Manager role) */}
                <Route 
                    path="/leads" 
                    element={
                        <ProtectedRoute requiredRoles={['Lead manager']}>
                            <Layout><LeadBank /></Layout>
                        </ProtectedRoute>
                    } 
                />

                {/* 2b. Discovery Hub (AI Matchmaking Index) */}
                <Route 
                    path="/discovery" 
                    element={
                        <ProtectedRoute requiredRoles={['Lead manager']}>
                            <Layout><DiscoveryHub /></Layout>
                        </ProtectedRoute>
                    } 
                />

                {/* 2c. B2B Hub (Organization Strategy) */}
                <Route 
                    path="/b2b" 
                    element={
                        <ProtectedRoute requiredRoles={['Lead manager']}>
                            <Layout><B2BHub /></Layout>
                        </ProtectedRoute>
                    } 
                />

                {/* AI Agent Tuning */}
                <Route 
                    path="/tuning" 
                    element={
                        <ProtectedRoute requiredRoles={['Admin', 'Manager']}>
                            <Layout><AgentTuning /></Layout>
                        </ProtectedRoute>
                    } 
                />

                {/* 3. Campaigner (Requires Campaign manager or Manager role) */}
                <Route 
                    path="/campaigns" 
                    element={
                        <ProtectedRoute requiredRoles={['Campaign manager']}>
                            <Layout><Campaigns /></Layout>
                        </ProtectedRoute>
                    } 
                />
                
                {/* 4. Specific Campaign Workspace */}
                <Route 
                    path="/campaigns/:id" 
                    element={
                        <ProtectedRoute requiredRoles={['Campaign manager']}>
                            <Layout><CampaignWorkspace /></Layout>
                        </ProtectedRoute>
                    } 
                />

                {/* 5. Academic Programs / Knowledge Base (Skills Admin, Admin, Manager) */}
                <Route 
                    path="/programs" 
                    element={
                        <ProtectedRoute requiredRoles={['Skills admin']}>
                            <Layout><Programs /></Layout>
                        </ProtectedRoute>
                    } 
                />

                {/* 6. Staff Management (Strictly Admin only) */}
                <Route 
                    path="/enroll" 
                    element={
                        <ProtectedRoute requiredRoles={['Admin']}>
                            <Layout><AdminEnrollment /></Layout>
                        </ProtectedRoute>
                    } 
                />

                {/* --- DEFAULT SYSTEM REDIRECTS --- */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                {/* Catch-all route for non-existent URLs */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Router>
    );
}

export default App;