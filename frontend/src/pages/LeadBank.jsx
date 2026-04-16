import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Grid, 
    Stack, Chip, Tabs, Tab, List, ListItem, ListItemButton, 
    ListItemText, Divider, Breadcrumbs, Card, CardContent, Tooltip
} from '@mui/material';
import { 
    Delete as DeleteIcon, 
    Edit as EditIcon,
    ChevronRight as ChevronRightIcon,
    Groups as GroupsIcon,
    School as SchoolIcon,
    Campaign as SocialIcon,
    PresentToAll as WebinarIcon,
    ArrowBack as ArrowBackIcon,
    Folder as FolderIcon,
    Psychology as BrainIcon,
    AutoAwesome as MagicIcon
} from '@mui/icons-material';

// Internal Components
import api from '../api/axios';
import LeadImportModal from '../components/LeadImportModal';
import LeadIntelligenceSidebar from '../components/LeadIntelligenceSidebar';

const LeadBank = () => {
    // --- 1. STATE MANAGEMENT ---
    const [leads, setLeads] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [activeTab, setActiveTab] = useState(0); // 0: PARTICIPANT, 1: SOCIAL, 2: WEBINAR
    const [selectedProgramId, setSelectedProgramId] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    
    // UI States
    const [openImport, setOpenImport] = useState(false);
    const [intelSidebarOpen, setIntelSidebarOpen] = useState(false);
    const [activeLeadForIntel, setActiveLeadForIntel] = useState(null);

    const categories = ['PARTICIPANT', 'SOCIAL', 'WEBINAR'];

    // --- 2. DATA FETCHING ---
    useEffect(() => { 
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [leadsRes, progRes] = await Promise.all([
                api.get('/leads/manage/'),
                api.get('/courses/programs/')
            ]);
            setLeads(leadsRes.data);
            setPrograms(progRes.data);
        } catch (err) { console.error("Error loading Lead Bank data", err); }
    };

    // --- 3. HIERARCHICAL FILTERING LOGIC ---
    
    // Level 1: Filter by the active Tab (Participant, Social, or Webinar)
    const filteredLeadsByCategory = leads.filter(l => l.category === categories[activeTab]);

    // Level 2: Find which programs actually have leads in this category for the Sidebar
    const programIdsWithLeads = [...new Set(filteredLeadsByCategory.map(l => l.program))];
    const programsInView = programs.filter(p => programIdsWithLeads.includes(p.id));

    // Level 3: Filter leads by the selected Program from the sidebar
    const leadsInSelectedProgram = filteredLeadsByCategory.filter(l => l.program === selectedProgramId);

    // Level 4: Grouping by Batch (Only for "Course Participants")
    const batches = [...new Set(leadsInSelectedProgram.map(l => l.batch))].filter(Boolean);

    // Final Level: The list of leads to display in the table
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
                fetchData();
            } catch (err) { alert("Delete failed"); }
        }
    };

    const handleDeleteBatch = async (batchName) => {
        if(window.confirm(`Delete all leads in batch "${batchName}"?`)) {
            const leadsToDelete = leadsInSelectedProgram.filter(l => l.batch === batchName);
            try {
                await Promise.all(leadsToDelete.map(l => api.delete(`/leads/manage/${l.id}/`)));
                setSelectedBatch(null);
                fetchData();
            } catch (err) { alert("Error deleting batch"); }
        }
    };

    return (
        <Box sx={{ p: 1 }}>
            {/* --- TOP HEADER --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a237e' }}>Lead Bank</Typography>
                    <Typography variant="body1" color="text.secondary">Master Management of All Prospects</Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<MagicIcon />}
                    onClick={() => setOpenImport(true)} 
                    sx={{ borderRadius: 3, bgcolor: '#1a237e', px: 3, fontWeight: 700, boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)' }}
                >
                    Import New Leads
                </Button>
            </Box>

            {/* --- CATEGORY NAVIGATION TABS --- */}
            <Paper sx={{ borderRadius: 4, mb: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange} 
                    variant="fullWidth" 
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab icon={<SchoolIcon />} label="Course Participants" sx={{ fontWeight: 800 }} />
                    <Tab icon={<SocialIcon />} label="Social Media" sx={{ fontWeight: 800 }} />
                    <Tab icon={<WebinarIcon />} label="Webinar Leads" sx={{ fontWeight: 800 }} />
                </Tabs>
            </Paper>

            <Grid container spacing={3}>
                {/* --- SUB-NAVIGATION: PROGRAM SIDEBAR --- */}
                <Grid item xs={12} md={3.5}>
                    <Typography variant="caption" sx={{ mb: 1, px: 1, fontWeight: 900, color: 'text.disabled', textTransform: 'uppercase', display: 'block', letterSpacing: 1 }}>
                        Course Filters
                    </Typography>
                    <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #eef0f2', boxShadow: 'none' }}>
                        <List sx={{ p: 0 }}>
                            {programsInView.length === 0 ? (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.disabled">No leads found in this category.</Typography>
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

                {/* --- CONTENT AREA: BATCHES OR LEADS --- */}
                <Grid item xs={12} md={8.5}>
                    {!selectedProgramId ? (
                        <Box sx={{ textAlign: 'center', py: 15, bgcolor: '#f8f9fa', borderRadius: 6, border: '2px dashed #e0e4e8' }}>
                            <FolderIcon sx={{ fontSize: 80, color: '#d1d9ff', mb: 2 }} />
                            <Typography variant="h6" fontWeight={700} color="text.secondary">Select a Course Profile</Typography>
                            <Typography variant="body2" color="text.disabled">Choose a specific sub-tab on the left to manage leads.</Typography>
                        </Box>
                    ) : (
                        <Box>
                            {/* Dynamic Breadcrumbs */}
                            <Breadcrumbs sx={{ mb: 3, bgcolor: '#fff', p: 1.5, borderRadius: 3, border: '1px solid #f0f0f0' }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#90a4ae' }}>{categories[activeTab]}</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#1a237e' }}>
                                    {programs.find(p => p.id === selectedProgramId)?.name}
                                </Typography>
                                {selectedBatch && <Typography variant="caption" sx={{ fontWeight: 800, color: '#d32f2f' }}>{selectedBatch}</Typography>}
                            </Breadcrumbs>

                            {/* VIEW 1: BATCH CARDS (Only for Participants + No Batch Selected) */}
                            {activeTab === 0 && !selectedBatch ? (
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 3, color: '#37474f' }}>Enrolled Batches</Typography>
                                    <Grid container spacing={2}>
                                        {batches.map(b => (
                                            <Grid item xs={12} sm={6} key={b}>
                                                <Card sx={{ borderRadius: 4, border: '1px solid #eef0f2', transition: '0.3s', '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.05)', borderColor: '#1a237e' } }}>
                                                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Box sx={{ cursor: 'pointer' }} onClick={() => setSelectedBatch(b)}>
                                                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a237e' }}>{b}</Typography>
                                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                                                {leadsInSelectedProgram.filter(l => l.batch === b).length} Participants
                                                            </Typography>
                                                        </Box>
                                                        <Stack direction="row" spacing={0.5}>
                                                            <IconButton size="small" color="primary"><EditIcon fontSize="small"/></IconButton>
                                                            <IconButton size="small" color="error" onClick={() => handleDeleteBatch(b)}><DeleteIcon fontSize="small"/></IconButton>
                                                        </Stack>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            ) : (
                                /* VIEW 2: LEAD DIRECTORY TABLE */
                                <Paper sx={{ borderRadius: 5, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #eee' }}>
                                    <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#fafafa', borderBottom: '1px solid #eee' }}>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            {selectedBatch && (
                                                <Button startIcon={<ArrowBackIcon />} onClick={() => setSelectedBatch(null)} variant="outlined" size="small" sx={{ borderRadius: 2, fontWeight: 800 }}>
                                                    Back
                                                </Button>
                                            )}
                                            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#1a237e' }}>
                                                {selectedBatch ? `Batch: ${selectedBatch}` : 'Lead Directory'}
                                            </Typography>
                                        </Stack>
                                        <Chip label={`${finalLeads.length} Records`} size="small" sx={{ fontWeight: 800, bgcolor: '#1a237e', color: '#fff' }} />
                                    </Box>
                                    
                                    <TableContainer sx={{ maxHeight: '65vh' }}>
                                        <Table size="small" stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 800, bgcolor: '#f8f9fa' }}>Prospect Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 800, bgcolor: '#f8f9fa' }}>Email</TableCell>
                                                    <TableCell sx={{ fontWeight: 800, bgcolor: '#f8f9fa' }}>Phone</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8f9fa' }}>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {finalLeads.map((l) => (
                                                    <TableRow key={l.id} hover>
                                                        <TableCell sx={{ fontWeight: 700 }}>{l.first_name} {l.last_name}</TableCell>
                                                        <TableCell>{l.email}</TableCell>
                                                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{l.phone || '-'}</TableCell>
                                                        <TableCell align="right">
                                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                                <Tooltip title="AI Intelligence">
                                                                    <IconButton 
                                                                        size="small" 
                                                                        sx={{ bgcolor: '#ede7f6', color: '#5e35b1', '&:hover': { bgcolor: '#5e35b1', color: '#fff' } }}
                                                                        onClick={() => handleOpenIntel(l)}
                                                                    >
                                                                        <BrainIcon fontSize="small"/>
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <IconButton size="small" color="primary"><EditIcon fontSize="small"/></IconButton>
                                                                <IconButton size="small" color="error" onClick={() => handleDeleteLead(l.id)}><DeleteIcon fontSize="small"/></IconButton>
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            )}
                        </Box>
                    )}
                </Grid>
            </Grid>

            {/* --- OVERLAY COMPONENTS --- */}
            
            {/* Modal for CSV Import */}
            <LeadImportModal 
                open={openImport} 
                onClose={() => { setOpenImport(false); fetchData(); }} 
                programs={programs}
            />

            {/* AI Brain Intelligence Sidebar */}
            <LeadIntelligenceSidebar 
                open={intelSidebarOpen} 
                onClose={() => setIntelSidebarOpen(false)} 
                lead={activeLeadForIntel} 
            />
        </Box>
    );
};

export default LeadBank;