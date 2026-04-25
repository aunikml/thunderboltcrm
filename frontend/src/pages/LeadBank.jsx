import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Grid, 
    Stack, Chip, Tabs, Tab, List, ListItem, ListItemButton, 
    ListItemText, Divider, Breadcrumbs, Card, CardContent, Tooltip,
    Alert, CircularProgress
} from '@mui/material';
import { 
    Delete as DeleteIcon, 
    Edit as EditIcon,
    ChevronRight as ChevronRightIcon,
    School as SchoolIcon,
    Campaign as SocialIcon,
    PresentToAll as WebinarIcon,
    ArrowBack as ArrowBackIcon,
    Folder as FolderIcon,
    Psychology as BrainIcon,
    AutoAwesome as MagicIcon,
    AssignmentInd as CampaignIcon,
    FindInPage as DiscoveryIcon
} from '@mui/icons-material';

// Internal Components
import api from '../api/axios';
import LeadImportModal from '../components/LeadImportModal';
import LeadIntelligenceSidebar from '../components/LeadIntelligenceSidebar';

const LeadBank = () => {
    // --- 1. STATE MANAGEMENT ---
    const [leads, setLeads] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [activeTab, setActiveTab] = useState(0); // 0: PARTICIPANT, 1: SOCIAL, 2: WEBINAR, 3: CAMPAIGN, 4: DISCOVERY
    const [selectedProgramId, setSelectedProgramId] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [openImport, setOpenImport] = useState(false);
    const [intelSidebarOpen, setIntelSidebarOpen] = useState(false);
    const [activeLeadForIntel, setActiveLeadForIntel] = useState(null);

    const categories = ['PARTICIPANT', 'SOCIAL', 'WEBINAR', 'CAMPAIGN', 'CAMPAIGN']; // Use CAMPAIGN category for discovery as well

    // --- 2. DATA FETCHING ---
    useEffect(() => { 
        fetchData();
    }, []);

    const fetchData = async (showSpinner = true) => {
        if (showSpinner) setLoading(true);
        try {
            const [leadsRes, progRes] = await Promise.all([
                api.get('/leads/manage/'),
                api.get('/courses/programs/')
            ]);
            setLeads(leadsRes.data);
            setPrograms(progRes.data);
        } catch (err) { console.error("Error loading Lead Bank data", err); }
        finally { setLoading(false); }
    };

    // POLLING for Discovery: If any lead has no program, refresh every 5 seconds
    useEffect(() => {
        const hasUnassigned = leads.some(l => !l.program);
        let interval = null;
        if (hasUnassigned) {
            interval = setInterval(() => fetchData(false), 5000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [leads]);

    // --- 3. FILTERING LOGIC ---
    
    // Level 1: Filter by the active Tab
    const filteredLeadsByCategory = activeTab === 4 
        ? leads.filter(l => !l.program) // Discovery Pool: Leads with NO program
        : leads.filter(l => l.category === categories[activeTab] && l.program);

    // Level 2: Sidebar Programs
    const programIdsWithLeads = [...new Set(filteredLeadsByCategory.map(l => l.program))].filter(Boolean);
    const programsInView = programs.filter(p => programIdsWithLeads.includes(p.id));

    // Level 3: Selection
    const leadsInSelectedProgram = activeTab === 4 
        ? filteredLeadsByCategory // In Discovery, we show all at once usually
        : filteredLeadsByCategory.filter(l => l.program === selectedProgramId);

    // Level 4: Grouping by Batch
    const batches = [...new Set(leadsInSelectedProgram.map(l => l.batch))].filter(Boolean);

    // Final Level
    const finalLeads = selectedBatch 
        ? leadsInSelectedProgram.filter(l => l.batch === selectedBatch)
        : leadsInSelectedProgram;

    // --- 4. EVENT HANDLERS ---
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setSelectedProgramId(null);
        setSelectedBatch(null);
    };

    const handleOpenIntel = (lead) => {
        setActiveLeadForIntel(lead);
        setIntelSidebarOpen(true);
    };

    const handleDeleteLead = async (id) => {
        if(window.confirm("Permanently delete this lead?")) {
            try {
                await api.delete(`/leads/manage/${id}/`);
                fetchData(false);
            } catch (err) { alert("Delete failed"); }
        }
    };

    const getTabLabel = (index) => {
        switch(index) {
            case 0: return "Participants";
            case 1: return "Social Media";
            case 2: return "Webinars";
            case 3: return "Campaigns";
            case 4: return "Discovery Pool";
            default: return "";
        }
    };

    return (
        <Box sx={{ p: 1 }}>
            {/* --- TOP HEADER --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a237e' }}>Lead Bank</Typography>
                    <Typography variant="body1" color="text.secondary">Hybrid Intelligence Management</Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<MagicIcon />}
                    onClick={() => setOpenImport(true)} 
                    sx={{ borderRadius: 3, bgcolor: '#1a237e', px: 3, fontWeight: 700, boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)' }}
                >
                    Import & Match
                </Button>
            </Box>

            {/* --- NAVIGATION TABS --- */}
            <Paper sx={{ borderRadius: 4, mb: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange} 
                    variant="fullWidth" 
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab icon={<SchoolIcon />} label="Participants" sx={{ fontWeight: 800 }} />
                    <Tab icon={<SocialIcon />} label="Social" sx={{ fontWeight: 800 }} />
                    <Tab icon={<WebinarIcon />} label="Webinars" sx={{ fontWeight: 800 }} />
                    <Tab icon={<CampaignIcon />} label="Campaigns" sx={{ fontWeight: 800 }} />
                    <Tab icon={<DiscoveryIcon />} label="Discovery" sx={{ fontWeight: 800 }} />
                </Tabs>
            </Paper>

            {activeTab === 4 && leads.some(l => !l.program) && (
                <Alert severity="warning" icon={<MagicIcon />} sx={{ mb: 3, borderRadius: 3, fontWeight: 700 }}>
                    AI Matchmaker is currently scanning the catalog to pair {leads.filter(l => !l.program).length} unassigned prospects.
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* --- SIDEBAR --- */}
                {activeTab !== 4 && (
                    <Grid item xs={12} md={3.5}>
                        <Typography variant="caption" sx={{ mb: 1, px: 1, fontWeight: 900, color: 'text.disabled', textTransform: 'uppercase', display: 'block', letterSpacing: 1 }}>
                            Course Catalog
                        </Typography>
                        <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #eef0f2', boxShadow: 'none' }}>
                            <List sx={{ p: 0 }}>
                                {programsInView.length === 0 ? (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.disabled">No leads found.</Typography>
                                    </Box>
                                ) : (
                                    programsInView.map((p) => (
                                        <ListItemButton 
                                            key={p.id} 
                                            selected={selectedProgramId === p.id}
                                            onClick={() => { setSelectedProgramId(p.id); setSelectedBatch(null); }}
                                            sx={{ 
                                                py: 2, 
                                                borderLeft: selectedProgramId === p.id ? '5px solid #1a237e' : '5px solid transparent',
                                                bgcolor: selectedProgramId === p.id ? '#f5f7ff' : 'transparent'
                                            }}
                                        >
                                            <ListItemText 
                                                primary={p.name} 
                                                primaryTypographyProps={{ 
                                                    fontSize: '0.85rem', 
                                                    fontWeight: selectedProgramId === p.id ? 800 : 600,
                                                    color: selectedProgramId === p.id ? '#1a237e' : '#455a64'
                                                }}
                                            />
                                            <ChevronRightIcon fontSize="small" sx={{ opacity: 0.3 }} />
                                        </ListItemButton>
                                    ))
                                )}
                            </List>
                        </Paper>
                    </Grid>
                )}

                {/* --- CONTENT --- */}
                <Grid item xs={12} md={activeTab === 4 ? 12 : 8.5}>
                    {activeTab !== 4 && !selectedProgramId ? (
                        <Box sx={{ textAlign: 'center', py: 15, bgcolor: '#f8f9fa', borderRadius: 6, border: '2px dashed #e0e4e8' }}>
                            <FolderIcon sx={{ fontSize: 80, color: '#d1d9ff', mb: 2 }} />
                            <Typography variant="h6" fontWeight={700} color="text.secondary">Select a Course Profile</Typography>
                        </Box>
                    ) : (
                        <Box>
                            <Paper sx={{ borderRadius: 5, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #eee' }}>
                                <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#fafafa', borderBottom: '1px solid #eee' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#1a237e' }}>
                                        {getTabLabel(activeTab)}
                                    </Typography>
                                    <Chip label={`${finalLeads.length} Records`} size="small" sx={{ fontWeight: 800, bgcolor: '#1a237e', color: '#fff' }} />
                                </Box>
                                
                                <TableContainer sx={{ maxHeight: '70vh' }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800, bgcolor: '#f8f9fa' }}>Prospect</TableCell>
                                                <TableCell sx={{ fontWeight: 800, bgcolor: '#f8f9fa' }}>Contact</TableCell>
                                                <TableCell sx={{ fontWeight: 800, bgcolor: '#f8f9fa' }}>Matched Course</TableCell>
                                                {activeTab === 4 && <TableCell sx={{ fontWeight: 800, bgcolor: '#f8f9fa' }}>AI Match Reasoning</TableCell>}
                                                <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8f9fa' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {finalLeads.length === 0 ? (
                                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}>No records in this pool.</TableCell></TableRow>
                                            ) : (
                                                finalLeads.map((l) => (
                                                    <TableRow key={l.id} hover>
                                                        <TableCell sx={{ py: 2 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a237e' }}>{l.first_name} {l.last_name}</Typography>
                                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{l.additional_data?.profession || 'Professional'}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{l.email}</Typography>
                                                            <Typography variant="caption" color="text.disabled">{l.phone || 'No Phone'}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            {l.program_name ? (
                                                                <Chip label={l.program_name} size="small" sx={{ fontWeight: 800, bgcolor: '#e3f2fd', color: '#1565c0' }} />
                                                            ) : (
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <CircularProgress size={14} />
                                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled' }}>MATCHING...</Typography>
                                                                </Stack>
                                                            )}
                                                        </TableCell>
                                                        {activeTab === 4 && (
                                                            <TableCell sx={{ maxWidth: 300 }}>
                                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                                    {l.campaign_status !== 'N/A' ? l.campaign_status : 'Pending AI Discovery...'}
                                                                </Typography>
                                                            </TableCell>
                                                        )}
                                                        <TableCell align="right">
                                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                                <Tooltip title="View AI Intelligence">
                                                                    <IconButton 
                                                                        size="small" 
                                                                        disabled={!l.program}
                                                                        sx={{ bgcolor: '#ede7f6', color: '#5e35b1', '&:hover': { bgcolor: '#5e35b1', color: '#fff' } }}
                                                                        onClick={() => handleOpenIntel(l)}
                                                                    >
                                                                        <BrainIcon fontSize="small"/>
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <IconButton size="small" color="error" onClick={() => handleDeleteLead(l.id)}><DeleteIcon fontSize="small"/></IconButton>
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Box>
                    )}
                </Grid>
            </Grid>

            <LeadImportModal open={openImport} onClose={() => { setOpenImport(false); fetchData(true); }} />
            <LeadIntelligenceSidebar open={intelSidebarOpen} onClose={() => setIntelSidebarOpen(false)} lead={activeLeadForIntel} />
        </Box>
    );
};

export default LeadBank;