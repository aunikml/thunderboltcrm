import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Container } from '@mui/material';
import api from '../api/axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/accounts/login/', { email, password });
            localStorage.setItem('token', res.data.access);
            navigate('/dashboard');
        } catch (err) {
            alert("Login Failed");
        }
    };

    return (
        <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
            <Paper elevation={6} sx={{ p: 4, width: '100%', textAlign: 'center', borderRadius: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#1976d2', mb: 1 }}>THUNDERBOLT</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontWeight: 'bold' }}>ACADEMIC CRM CONSOLE</Typography>
                <form onSubmit={handleLogin}>
                    <TextField fullWidth label="Email" variant="outlined" sx={{ mb: 2 }} onChange={(e) => setEmail(e.target.value)} />
                    <TextField fullWidth label="Password" type="password" variant="outlined" sx={{ mb: 3 }} onChange={(e) => setPassword(e.target.value)} />
                    <Button fullWidth variant="contained" size="large" type="submit" sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 2 }}>
                        Sign In
                    </Button>
                </form>
            </Paper>
        </Container>
    );
};

export default Login;