import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, Alert, Stack } from '@mui/material';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import api from '../api/axios';
import StatCard from '../components/dashboard/StatCard';

const COLORS = ['#1a237e', '#00695c', '#6a1b9a', '#ef6c00', '#c62828'];

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/dashboard/analytics/');
            setData(res.data);
        } catch (err) {
            setError("Failed to load analytics data.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress />
        </Box>
    );

    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box sx={{ p: 1 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a237e' }}>Console Dashboard</Typography>
                <Typography color="text.secondary">Real-time sales performance and AI insights</Typography>
            </Box>

            {/* 1. TOP STATS CARDS */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <StatCard title="Total Leads" value={data.stats.total_leads} type="leads" />
                <StatCard title="Active Campaigns" value={data.stats.active_campaigns} type="campaigns" />
                <StatCard title="Converted" value={data.stats.total_converted} type="converted" />
                <StatCard title="Avg. Propensity" value={data.stats.avg_propensity} type="ai" />
            </Grid>

            <Grid container spacing={3}>
                {/* 2. PROFESSION DISTRIBUTION CHART */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 3, borderRadius: 5, height: 450, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #eee' }}>
                        <Typography variant="h6" fontWeight={800} gutterBottom>Top Lead Professions</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
                            Segmented by career data extracted from Lead Bank
                        </Typography>
                        <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={data.professions}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" fontSize={11} fontWeight={700} />
                                <YAxis fontSize={12} />
                                <Tooltip cursor={{fill: '#f8f9fa'}} />
                                <Bar dataKey="value" fill="#1a237e" radius={[10, 10, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* 3. SALES FUNNEL CHART */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 3, borderRadius: 5, height: 450, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #eee' }}>
                        <Typography variant="h6" fontWeight={800} gutterBottom>Conversion Funnel</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
                            Current status of leads across all campaigns
                        </Typography>
                        <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={data.funnel} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="step" type="category" width={110} fontSize={11} fontWeight={700} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#00695c" radius={[0, 10, 10, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* 4. COURSE POPULARITY LIST */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 5, border: '1px solid #eee', boxShadow: 'none' }}>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Program Popularity Index</Typography>
                        <Stack direction="row" spacing={3} sx={{ overflowX: 'auto', pb: 1 }}>
                            {data.courses.map((course, i) => (
                                <Box key={i} sx={{ minWidth: 200, p: 2, bgcolor: '#f8f9fa', borderRadius: 4, border: '1px solid #eef0f2' }}>
                                    <Typography variant="h4" fontWeight={900} color="primary">{course.leads}</Typography>
                                    <Typography variant="caption" fontWeight={800} color="text.secondary" display="block">{course.course}</Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;