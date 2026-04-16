import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Select, MenuItem, Rating, IconButton, Button, 
    Stack, Tooltip, CircularProgress, Breadcrumbs, Tabs, Tab, Chip, Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Psychology as BrainIcon, 
    CloudUpload as UploadIcon, 
    ArrowBack as ArrowBackIcon,
    Refresh as RefreshIcon,
    Campaign as SocialIcon,
    PresentToAll as WebinarIcon,
    Groups as AllIcon,
    AutoAwesome as MagicIcon
} from '@mui/icons-material';

// Internal API and Components
import api from '../api/axios';
import LeadIntelligenceSidebar from '../components/LeadIntelligenceSidebar';
import LeadImportModal from '../components/LeadImportModal';

const CampaignWorkspace = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // --- 1. STATE ---
    const [campaign, setCampaign] = useState(null);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0); // 0: All, 1: Social, 2: Webinar
    
    // UI Overlay States
    const [selectedLead, setSelectedLead] = useState(null);
    const [intelOpen, setIntelOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);

    // --- 2. DATA FETCHING ---
    useEffect(() => { 
        fetchWorkspaceData(); 
    }, [id]);

    // HIGH-SPEED POLLING: If any lead has 0% score, refresh every 3 seconds
    // Since the "Lightning Engine" finishes in 5-8s, 3s polling feels instant.
    useEffect(() => {
        let interval = null;
        const hasPendingLeads = leads.some(l => l.ai_score === 0);

        if (hasPendingLeads) {
            interval = setInterval(() => {
                fetchWorkspaceData(false); // Fetch silently in background
            }, 3000);
        }

        return () => { if (interval) clearInterval(interval); };
    }, [leads]);

    const fetchWorkspaceData = async (showSpinner = true) => {
        if (showSpinner) setLoading(true);
        try {
            const [campRes, leadsRes] = await Promise.all([
                api.get(`/campaigns/list/${id}/`),
                api.get(`/campaigns/leads/?campaign_id=${id}`)
            ]);
            setCampaign(campRes.data);
            setLeads(leadsRes.data);
        } catch (err) {
            console.error("Error loading workspace data:", err);
        } finally {
            setLoading(false);
        }
    };

    // --- 3. FILTERING LOGIC ---
    const socialLeads = leads.filter(l => l.category === 'SOCIAL');
    const webinarLeads = leads.filter(l => l.category === 'WEBINAR');
    
    const getActiveLeads = () => {
        if (tabValue === 1) return socialLeads;
        if (tabValue === 2) return webinarLeads;
        return leads;
    };

    // --- 4. ACTION HANDLERS ---
    const updateStatus = async (linkId, newStatus) => {
        try {
            await api.patch(`/campaigns/leads/${linkId}/`, { status: newStatus });
            setLeads(prev => prev.map(l => l.id === linkId ? { ...l, status: newStatus } : l));
        } catch (err) { alert("Failed to update status."); }
    };

    const updateRating = async (linkId, newRating) => {
        try {
            await api.patch(`/campaigns/leads/${linkId}/`, { user_rating: newRating });
            setLeads(prev => prev.map(l => l.id === linkId ? { ...l, user_rating: newRating } : l));
        } catch (err) { alert("Failed to update rating."); }
    };

    const handleOpenIntel = (leadLink) => {
        setSelectedLead({ 
            id: leadLink.lead, 
            first_name: leadLink.name, 
            last_name: '' 
        });
        setIntelOpen(true);
    };

    const triggerManualAnalysis = async (leadId) => {
        try {
            await api.post(`/brain/analyze/${leadId}/?campaign_id=${id}`);
            fetchWorkspaceData(false);
        } catch (err) { alert("Analysis failed to start."); }
    };

    // --- 5. RENDER HELPERS ---
    const getScoreColor = (score) => {
        if (score >= 80) return 'success';
        if (score >= 50) return 'warning';
        if (score > 0) return 'error';
        return 'default';
    };

    if (loading && !campaign) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 1 }}>
            {/* BREADCRUMBS */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/campaigns')} sx={{ fontWeight: 800 }}>
                    Back
                </Button>
                <Breadcrumbs>
                    <Typography color="text.disabled" variant="caption" sx={{ fontWeight: 800 }}>Campaigner</Typography>
                    <Typography color="text.primary" variant="caption" sx={{ fontWeight: 800 }}>{campaign?.name}</Typography>
                </Breadcrumbs>
            </Stack>

            {/* HEADER */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a237e' }}>{campaign?.name}</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Target: {campaign?.program_name} ({campaign?.batch})
                    </Typography>
                </Box>
                
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchWorkspaceData(true)} sx={{ borderRadius: 3, fontWeight: 800 }}>
                        Refresh
                    </Button>
                    <Button 
                        variant="contained" 
                        startIcon={<UploadIcon />} 
                        onClick={() => setUploadOpen(true)}
                        sx={{ borderRadius: 3, bgcolor: '#1a237e', fontWeight: 800, px: 3 }}
                    >
                        Add Leads
                    </Button>
                </Stack>
            </Box>

            {/* TAB NAVIGATION */}
            <Paper sx={{ mb: 3, borderRadius: 4, bgcolor: '#f8f9fa', overflow: 'hidden' }}>
                <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} indicatorColor="primary" textColor="primary" sx={{ px: 2, pt: 1 }}>
                    <Tab icon={<AllIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`All (${leads.length})`} sx={{ fontWeight: 800 }} />
                    <Tab icon={<SocialIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Social (${socialLeads.length})`} sx={{ fontWeight: 800 }} />
                    <Tab icon={<WebinarIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Webinars (${webinarLeads.length})`} sx={{ fontWeight: 800 }} />
                </Tabs>
            </Paper>

            {/* AI STATUS ALERT (Visible if background worker is active) */}
            {leads.some(l => l.ai_score === 0 && leads.length > 0) && (
                <Alert icon={<MagicIcon />} severity="info" sx={{ mb: 3, borderRadius: 3, fontWeight: 700 }}>
                    Lightning AI Engine is background-processing your new leads.
                </Alert>
            )}

            {/* WORKSPACE TABLE */}
            <TableContainer component={Paper} sx={{ borderRadius: 5, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #eee' }}>
                <Table sx={{ minWidth: 1100 }}>
                    <TableHead sx={{ bgcolor: '#fafafa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>Prospect</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Profession / Org</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>AI Propensity</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Intelligence</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>User Rating</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {getActiveLeads().length === 0 ? (
                            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}>No leads found.</TableCell></TableRow>
                        ) : (
                            getActiveLeads().map((l) => (
                                <TableRow key={l.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a237e' }}>{l.name}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{l.email}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#455a64' }}>{l.profession}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{l.organization}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            {l.ai_score > 0 ? (
                                                <Chip 
                                                    label={`${l.ai_score}%`} 
                                                    size="small" 
                                                    color={getScoreColor(l.ai_score)} 
                                                    sx={{ fontWeight: 900, borderRadius: 1.5, width: 70 }} 
                                                />
                                            ) : (
                                                <Tooltip title="Trigger Manual AI Analysis">
                                                    <Button size="small" onClick={() => triggerManualAnalysis(l.lead)} sx={{ fontSize: '0.6rem', fontWeight: 800 }}>
                                                        Analyze
                                                    </Button>
                                                </Tooltip>
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="View Insights & Script">
                                            <IconButton onClick={() => handleOpenIntel(l)} sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2', '&:hover': { bgcolor: '#7b1fa2', color: '#fff' } }}>
                                                <BrainIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Select value={l.status} onChange={(e) => updateStatus(l.id, e.target.value)} size="small" sx={{ borderRadius: 2.5, fontWeight: 800, fontSize: '0.75rem', minWidth: 170 }}>
                                            <MenuItem value="INITIATE">Need to Initiate</MenuItem>
                                            <MenuItem value="FOLLOWUP">Needs Follow-up</MenuItem>
                                            <MenuItem value="CONVERTED">Converted</MenuItem>
                                            <MenuItem value="NOT_CONVERTED">Not Converted</MenuItem>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Rating value={l.user_rating} onChange={(event, newValue) => updateRating(l.id, newValue)} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* OVERLAYS */}
            <LeadIntelligenceSidebar open={intelOpen} onClose={() => setIntelOpen(false)} lead={selectedLead} />
            <LeadImportModal open={uploadOpen} onClose={() => { setUploadOpen(false); fetchWorkspaceData(true); }} campaignId={id} />
        </Box>
    );
};

export default CampaignWorkspace;