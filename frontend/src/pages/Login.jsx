import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, TextField, Button, Typography, Paper, Container, 
    InputAdornment, IconButton, Stack, CircularProgress 
} from '@mui/material';
import { 
    Email as EmailIcon, 
    Lock as LockIcon, 
    Visibility, 
    VisibilityOff
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../api/axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Use a string path instead of a static import to prevent Vite from crashing if file is missing
    const logoUrl = "/src/assets/brac_ied_logo.png";

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/accounts/login/', { email, password });
            localStorage.setItem('token', res.data.access);
            navigate('/dashboard');
        } catch (err) {
            alert("Login Failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
            position: 'relative'
        }}>
            <Container maxWidth="xs">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Paper elevation={24} sx={{ 
                        p: 5, width: '100%', textAlign: 'center', borderRadius: 8,
                        bgcolor: 'rgba(255, 255, 255, 0.98)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                    }}>
                        {/* BRAC IED Logo Fallback Container */}
                        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', minHeight: '80px' }}>
                            <img 
                                src={logoUrl} 
                                alt="BRAC IED" 
                                style={{ maxHeight: '80px', objectFit: 'contain' }} 
                                onError={(e) => { 
                                    // If image is missing, show a styled text fallback instead of crashing
                                    e.target.style.display = 'none'; 
                                }}
                            />
                        </Box>

                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a237e', letterSpacing: '-1px', mb: 0.5 }}>
                            Thunderbolt
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: 2, textTransform: 'uppercase', mb: 4, display: 'block' }}>
                            BRAC IED CRM CONSOLE
                        </Typography>

                        <form onSubmit={handleLogin}>
                            <Stack spacing={3}>
                                <TextField 
                                    fullWidth 
                                    label="Email" 
                                    variant="outlined" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
                                />
                                
                                <TextField 
                                    fullWidth 
                                    label="Password" 
                                    type={showPassword ? 'text' : 'password'}
                                    variant="outlined" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
                                />

                                <Button 
                                    fullWidth 
                                    variant="contained" 
                                    size="large" 
                                    type="submit" 
                                    disabled={loading}
                                    sx={{ 
                                        py: 2, 
                                        fontWeight: 900, 
                                        borderRadius: 4, 
                                        bgcolor: '#1a237e',
                                        textTransform: 'none',
                                        '&:hover': { bgcolor: '#0d47a1' }
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : "Access Console"}
                                </Button>
                            </Stack>
                        </form>
                    </Paper>
                </motion.div>
            </Container>
        </Box>
    );
};

export default Login;