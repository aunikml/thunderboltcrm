import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Stack, 
    Chip, Button, Breadcrumbs, CircularProgress, Tooltip, Alert
} from '@mui/material';
import { 
    Visibility as ViewIcon, 
    Bolt as MagicIcon,
    ArrowBack as ArrowBackIcon,
    Refresh as RefreshIcon,
    CloudDownload as DownloadIcon,
    Psychology as BrainIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LeadIntelligenceSidebar from '../components/LeadIntelligenceSidebar';

const DiscoveryHub = () => {
    const navigate = useNavigate();
    
    // --- 1. STATE ---
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [batchLeads, setBatchLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    
    // UI States
    const [intelSidebarOpen, setIntelSidebarOpen] = useState(false);
    const [activeLeadForIntel, setActiveLeadForIntel] = useState(null);

    // --- 2. DATA FETCHING ---
    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        setLoading(true);
        try {
            // Only fetch discovery-mode batches
            const res = await api.get('/leads/batches/?is_discovery=true');
            setBatches(res.data);
        } catch (err) {
            console.error("Error fetching discovery batches:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBatchDetails = async (batchId) => {
        setDetailLoading(true);
        try {
            // We fetch leads filtered by this batch ID
            // Assuming LeadViewSet supports filtering by import_batch
            const res = await api.get(`/leads/manage/?import_batch=${batchId}`);
            setBatchLeads(res.data);
            setSelectedBatchId(batchId);
        } catch (err) {
            console.error("Error fetching batch leads:", err);
        } finally {
            setDetailLoading(false);
        }
    };

    // POLLING for Discovery: If any lead in the current view is missing a program
    useEffect(() => {
        const hasUnassigned = batchLeads.some(l => !l.program);
        let interval = null;
        if (hasUnassigned && selectedBatchId) {
            interval = setInterval(() => {
                api.get(`/leads/manage/?import_batch=${selectedBatchId}`)
                   .then(res => setBatchLeads(res.data));
            }, 4000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [batchLeads, selectedBatchId]);

    // --- 3. RENDER HELPERS ---
    const getBatchName = () => {
        const b = batches.find(b => b.id === selectedBatchId);
        return b ? b.name : 'Unknown Batch';
    };

    if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 1 }}>
            {/* HEADER */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a237e' }}>Discovery Hub</Typography>
                    <Typography variant="body1" color="text.secondary">AI Matchmaking Index & History</Typography>
                </Box>
                {selectedBatchId && (
                    <Button 
                        startIcon={<ArrowBackIcon />} 
                        onClick={() => setSelectedBatchId(null)}
                        variant="outlined"
                        sx={{ fontWeight: 800, borderRadius: 3 }}
                    >
                        Back to Index
                    </Button>
                )}
            </Stack>

            {!selectedBatchId ? (
                /* --- VIEW 1: BATCH INDEX --- */
                <TableContainer component={Paper} sx={{ borderRadius: 5, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #eee' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#fafafa' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>Discovery Batch</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Date Indexed</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Prospect Count</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {batches.length === 0 ? (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}>No discovery uploads yet.</TableCell></TableRow>
                            ) : (
                                batches.map((b) => (
                                    <TableRow key={b.id} hover>
                                        <TableCell sx={{ fontWeight: 800, color: '#1a237e' }}>{b.name}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Chip label={`${b.total_count} leads`} size="small" sx={{ fontWeight: 800, bgcolor: '#f5f7ff' }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                icon={<MagicIcon sx={{ fontSize: '0.8rem !important' }} />}
                                                label="AI Processed" 
                                                size="small" 
                                                color="success" 
                                                sx={{ fontWeight: 900, borderRadius: 1.5 }} 
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button 
                                                variant="contained" 
                                                size="small" 
                                                startIcon={<ViewIcon />}
                                                onClick={() => fetchBatchDetails(b.id)}
                                                sx={{ bgcolor: '#1a237e', borderRadius: 2, fontWeight: 800 }}
                                            >
                                                Open List
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                /* --- VIEW 2: BATCH DETAIL (LEADS) --- */
                <Box>
                    <Breadcrumbs sx={{ mb: 3 }}>
                        <Typography color="text.disabled" sx={{ fontWeight: 800, cursor: 'pointer' }} onClick={() => setSelectedBatchId(null)}>Index</Typography>
                        <Typography color="text.primary" sx={{ fontWeight: 800 }}>{getBatchName()}</Typography>
                    </Breadcrumbs>

                    {batchLeads.some(l => !l.program) && (
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 3, fontWeight: 700 }}>
                            Lightning AI is currently identifying the best courses for your new prospects.
                        </Alert>
                    )}

                    <TableContainer component={Paper} sx={{ borderRadius: 5, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #eee' }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#fafafa' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800 }}>Prospect</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Contact</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>AI Match Reasoning</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Assigned Course</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>Intelligence</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {detailLoading ? (
                                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
                                ) : (
                                    batchLeads.map((l) => (
                                        <TableRow key={l.id} hover>
                                            <TableCell>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a237e' }}>{l.first_name} {l.last_name}</Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{l.additional_data?.profession || 'Professional'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{l.email}</Typography>
                                                <Typography variant="caption" color="text.disabled">{l.phone || '-'}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 350 }}>
                                                <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                                    {l.campaign_status !== 'N/A' ? l.campaign_status : 'Pending AI Discovery...'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {l.program_name ? (
                                                    <Chip 
                                                        label={l.program_name} 
                                                        size="small" 
                                                        sx={{ fontWeight: 800, bgcolor: '#e3f2fd', color: '#1565c0' }} 
                                                    />
                                                ) : (
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <CircularProgress size={12} />
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled' }}>MATCHING...</Typography>
                                                    </Stack>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton 
                                                    disabled={!l.program}
                                                    onClick={() => { setActiveLeadForIntel(l); setIntelSidebarOpen(true); }}
                                                    sx={{ bgcolor: '#ede7f6', color: '#5e35b1', '&:hover': { bgcolor: '#5e35b1', color: '#fff' } }}
                                                >
                                                    <BrainIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            <LeadIntelligenceSidebar 
                open={intelSidebarOpen} 
                onClose={() => setIntelSidebarOpen(false)} 
                lead={activeLeadForIntel} 
            />
        </Box>
    );
};

export default DiscoveryHub;
