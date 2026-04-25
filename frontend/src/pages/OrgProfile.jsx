import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, Paper, Grid, Stack, Chip, 
    Divider, IconButton, CircularProgress, Card, CardContent,
    List, ListItem, ListItemIcon, ListItemText, Alert, LinearProgress
} from '@mui/material';
import { 
    ArrowBack as ArrowBackIcon,
    Psychology as BrainIcon,
    Bolt as MagicIcon,
    CheckCircle as CheckIcon,
    Lightbulb as PointerIcon,
    Speed as StrategyIcon,
    TrendingUp as ScoreIcon,
    Warning as GapIcon
} from '@mui/icons-material';
import api from '../api/axios';

const OrgProfile = ({ orgId, onBack }) => {
    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        fetchOrg();
    }, [orgId]);

    const fetchOrg = async () => {
        try {
            const res = await api.get(`/b2b/organizations/${orgId}/`);
            setOrg(res.data);
        } catch (err) { console.error("Error fetching org profile", err); }
        finally { setLoading(false); }
    };

    const triggerAI = async () => {
        setAnalyzing(true);
        try {
            await api.post(`/b2b/organizations/${orgId}/analyze/`);
            // Poll for results after 5 seconds
            setTimeout(fetchOrg, 5000);
        } catch (err) { alert("AI analysis failed to start."); }
        finally { setAnalyzing(false); }
    };

    if (loading) return <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 1 }}>
            {/* TOP BAR */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                <IconButton onClick={onBack} sx={{ bgcolor: '#f5f7ff' }}><ArrowBackIcon /></IconButton>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a237e' }}>{org.name}</Typography>
                    <Typography variant="body1" color="text.secondary">Organization Strategic Profile</Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Button 
                    variant="contained" 
                    startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <MagicIcon />}
                    onClick={triggerAI}
                    disabled={analyzing}
                    sx={{ borderRadius: 3, bgcolor: '#7b1fa2', fontWeight: 800, px: 4, '&:hover': { bgcolor: '#4a148c' } }}
                >
                    {org.matches?.length > 0 ? "Re-Analyze Strategy" : "Generate AI Strategy"}
                </Button>
            </Stack>

            <Grid container spacing={3}>
                {/* LEFT COL: PROFILE DATA */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 5, border: '1px solid #eef0f2' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: '#1a237e' }}>Core Identity</Typography>
                        <Stack spacing={2.5}>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase' }}>Thematic Areas</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{org.thematic_areas}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase' }}>HQ & Location</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{org.hq_location}, {org.country}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase' }}>Funding Status</Typography>
                                <Chip label={org.funding_status} color="primary" size="small" sx={{ fontWeight: 800, mt: 0.5 }} />
                            </Box>
                            
                            <Divider />
                            
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a237e' }}>Strategic Focus</Typography>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase' }}>Challenges</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{org.challenges || "Not specified"}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase' }}>Capacity Gaps</Typography>
                                <Alert icon={<GapIcon />} severity="warning" sx={{ mt: 1, borderRadius: 3, fontSize: '0.75rem', fontWeight: 600 }}>
                                    {org.capacity_gaps || "Identify gaps to get better AI signals."}
                                </Alert>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>

                {/* RIGHT COL: AI MATCHES */}
                <Grid item xs={12} md={8}>
                    {org.matches?.length === 0 ? (
                        <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 6, bgcolor: '#fcfcfe', border: '2px dashed #d1d9ff' }}>
                            <BrainIcon sx={{ fontSize: 60, color: '#d1d9ff', mb: 2 }} />
                            <Typography variant="h6" fontWeight={800} color="#1a237e">No AI Insights Yet</Typography>
                            <Typography variant="body2" color="text.secondary">Trigger the AI Strategy Engine to identify course matches and pitching pointers.</Typography>
                        </Paper>
                    ) : (
                        <Stack spacing={3}>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#1a237e' }}>AI Strategic Matches</Typography>
                            
                            {org.matches.map((match, idx) => (
                                <Card key={match.id} sx={{ borderRadius: 6, border: '1px solid #eef0f2', overflow: 'visible', position: 'relative' }}>
                                    <Box sx={{ 
                                        position: 'absolute', top: -10, right: 20, 
                                        bgcolor: match.propensity_score >= 80 ? '#2e7d32' : '#f57c00',
                                        color: '#fff', px: 2, py: 0.5, borderRadius: 2, boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                    }}>
                                        <Typography variant="caption" sx={{ fontWeight: 900 }}>{match.propensity_score}% PROPENSITY</Typography>
                                    </Box>
                                    
                                    <CardContent sx={{ p: 4 }}>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#1a237e', mb: 1 }}>{match.program_name}</Typography>
                                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mb: 3 }}>
                                            "{match.match_reasoning}"
                                        </Typography>

                                        <Grid container spacing={4}>
                                            <Grid item xs={12} md={7}>
                                                <Box sx={{ p: 2, bgcolor: '#f5f7ff', borderRadius: 4, mb: 2 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                        <StrategyIcon sx={{ fontSize: 18, color: '#1a237e' }} />
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Campaign Strategy</Typography>
                                                    </Stack>
                                                    <Typography variant="body2" sx={{ lineHeight: 1.6, color: '#455a64' }}>
                                                        {match.campaign_strategy}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            
                                            <Grid item xs={12} md={5}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <PointerIcon sx={{ fontSize: 18, color: '#fbc02d' }} /> Pitching Pointers
                                                </Typography>
                                                <List dense>
                                                    {match.pitching_pointers.map((pointer, pIdx) => (
                                                        <ListItem key={pIdx} sx={{ px: 0 }}>
                                                            <ListItemIcon sx={{ minWidth: 28 }}><CheckIcon sx={{ fontSize: 16, color: '#2e7d32' }} /></ListItemIcon>
                                                            <ListItemText primary={pointer} primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 700 }} />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default OrgProfile;
