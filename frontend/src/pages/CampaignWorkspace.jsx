import React, { useState, useEffect } from 'react';
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
    Bolt as MagicIcon,
    PersonAdd as ImportIcon
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
    const [potentialLeads, setPotentialLeads] = useState([]); // Matchmaker prospects
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0); // 0: All, 1: Social, 2: Webinar, 3: Matched Discovery
    
    // UI Overlay States
    const [selectedLead, setSelectedLead] = useState(null);
    const [intelOpen, setIntelOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);

    // --- 2. DATA FETCHING ---
    useEffect(() => { 
        fetchWorkspaceData(); 
    }, [id]);

    useEffect(() => {
        let interval = null;
        const hasPendingLeads = leads.some(l => l.ai_score === 0);
        if (hasPendingLeads) {
            interval = setInterval(() => fetchWorkspaceData(false), 3000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [leads]);

    const fetchWorkspaceData = async (showSpinner = true) => {
        if (showSpinner) setLoading(true);
        try {
            const [campRes, leadsRes, potentialRes] = await Promise.all([
                api.get(`/campaigns/list/${id}/`),
                api.get(`/campaigns/leads/?campaign_id=${id}`),
                api.get(`/campaigns/list/${id}/potential-matches/`)
            ]);
            setCampaign(campRes.data);
            setLeads(leadsRes.data);
            setPotentialLeads(potentialRes.data);
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

    const importFromPotential = async (leadId) => {
        try {
            await api.post('/campaigns/leads/import-from-leads/', {
                campaign_id: id,
                lead_ids: [leadId]
            });
            fetchWorkspaceData(false);
        } catch (err) { alert("Import failed."); }
    };

    const handleOpenIntel = (leadId, name) => {
        setSelectedLead({ id: leadId, first_name: name, last_name: '' });
        setIntelOpen(true);
    };

    const triggerManualAnalysis = async (leadId) => {
        try {
            await api.post(`/brain/analyze/${leadId}/?campaign_id=${id}`);
            fetchWorkspaceData(false);
        } catch (err) { alert("Analysis failed."); }
    };

    if (loading && !campaign) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 1 }}>
            {/* BREADCRUMBS & HEADER */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/campaigns')} sx={{ fontWeight: 800 }}>Back</Button>
                <Breadcrumbs>
                    <Typography color="text.disabled" variant="caption" sx={{ fontWeight: 800 }}>Campaigner</Typography>
                    <Typography color="text.primary" variant="caption" sx={{ fontWeight: 800 }}>{campaign?.name}</Typography>
                </Breadcrumbs>
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a237e' }}>{campaign?.name}</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Target: {campaign?.program_name} ({campaign?.batch})
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchWorkspaceData(true)} sx={{ borderRadius: 3, fontWeight: 800 }}>Refresh</Button>
                    <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setUploadOpen(true)} sx={{ borderRadius: 3, bgcolor: '#1a237e', fontWeight: 800, px: 3 }}>Add Leads</Button>
                </Stack>
            </Box>

            {/* TAB NAVIGATION */}
            <Paper sx={{ mb: 3, borderRadius: 4, bgcolor: '#f8f9fa', overflow: 'hidden' }}>
                <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} sx={{ px: 2, pt: 1 }}>
                    <Tab icon={<AllIcon sx={{ fontSize: 18 }} />} label={`Campaign Leads (${leads.length})`} sx={{ fontWeight: 800 }} />
                    <Tab icon={<SocialIcon sx={{ fontSize: 18 }} />} label={`Social`} sx={{ fontWeight: 800 }} />
                    <Tab icon={<WebinarIcon sx={{ fontSize: 18 }} />} label={`Webinars`} sx={{ fontWeight: 800 }} />
                    <Tab 
                        icon={<MagicIcon sx={{ fontSize: 18 }} />} 
                        label={`Matched Discovery (${potentialLeads.length})`} 
                        sx={{ fontWeight: 800, color: '#1a237e' }} 
                    />
                </Tabs>
            </Paper>

            {tabValue < 3 ? (
                /* --- CAMPAIGN LEADS TABLE --- */
                <TableContainer component={Paper} sx={{ borderRadius: 5, border: '1px solid #eee' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#fafafa' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>Prospect</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Profession</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>AI Score</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Intelligence</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Rating</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {getActiveLeads().length === 0 ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}>No leads in this view.</TableCell></TableRow>
                            ) : (
                                getActiveLeads().map((l) => (
                                    <TableRow key={l.id} hover>
                                        <TableCell>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a237e' }}>{l.name}</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{l.email}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{l.profession}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {l.ai_score > 0 ? (
                                                <Chip label={`${l.ai_score}%`} size="small" color={l.ai_score >= 80 ? 'success' : 'warning'} sx={{ fontWeight: 900 }} />
                                            ) : (
                                                <Button size="small" onClick={() => triggerManualAnalysis(l.lead)} sx={{ fontWeight: 800 }}>Analyze</Button>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleOpenIntel(l.lead, l.name)} sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2' }}><BrainIcon fontSize="small" /></IconButton>
                                        </TableCell>
                                        <TableCell>
                                            <Select value={l.status} onChange={(e) => updateStatus(l.id, e.target.value)} size="small" sx={{ borderRadius: 2.5, fontWeight: 800 }}>
                                                <MenuItem value="INITIATE">Initiate</MenuItem>
                                                <MenuItem value="FOLLOWUP">Follow-up</MenuItem>
                                                <MenuItem value="CONVERTED">Converted</MenuItem>
                                                <MenuItem value="NOT_CONVERTED">Closed</MenuItem>
                                            </Select>
                                        </TableCell>
                                        <TableCell><Rating value={l.user_rating} size="small" /></TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                /* --- MATCHED PROSPECTS TAB (NEW) --- */
                <Box>
                    <Alert severity="success" icon={<MagicIcon />} sx={{ mb: 3, borderRadius: 3, fontWeight: 700 }}>
                        The AI Matchmaker has found {potentialLeads.length} prospects in the Lead Bank who perfectly match this program's profile.
                    </Alert>
                    <TableContainer component={Paper} sx={{ borderRadius: 5, border: '1px solid #eee' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f0f4ff' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800 }}>Prospect</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Contact</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Discovery Match</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {potentialLeads.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 10 }}>No new matches found in Lead Bank.</TableCell></TableRow>
                                ) : (
                                    potentialLeads.map((l) => (
                                        <TableRow key={l.id} hover>
                                            <TableCell>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a237e' }}>{l.first_name} {l.last_name}</Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 600 }}>{l.additional_data?.profession}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{l.email}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    {l.campaign_status !== 'N/A' ? l.campaign_status : 'Verified by AI Discovery'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button 
                                                    variant="contained" 
                                                    startIcon={<ImportIcon />}
                                                    onClick={() => importFromPotential(l.id)}
                                                    sx={{ bgcolor: '#2e7d32', borderRadius: 2, fontWeight: 800 }}
                                                >
                                                    Import to Campaign
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            <LeadIntelligenceSidebar open={intelOpen} onClose={() => setIntelOpen(false)} lead={selectedLead} />
            <LeadImportModal open={uploadOpen} onClose={() => { setUploadOpen(false); fetchWorkspaceData(true); }} campaignId={id} />
        </Box>
    );
};

export default CampaignWorkspace;