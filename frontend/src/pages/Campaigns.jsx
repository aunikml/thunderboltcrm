import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Chip, Stack, Tooltip,
    Divider
} from '@mui/material';
import { 
    Add as AddIcon, 
    Edit as EditIcon, 
    Delete as DeleteIcon, 
    RocketLaunch as RocketIcon,
    OpenInNew as OpenIcon,
    CalendarMonth as DateIcon,
    School as SchoolIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import CreateCampaignModal from '../components/CreateCampaignModal';

const Campaigns = () => {
    // --- 1. STATE ---
    const [campaigns, setCampaigns] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null); // Used to pass data to the modal for editing
    const navigate = useNavigate();

    // --- 2. DATA FETCHING ---
    useEffect(() => { 
        fetchCampaigns(); 
    }, []);

    const fetchCampaigns = async () => {
        try {
            const res = await api.get('/campaigns/list/');
            setCampaigns(res.data);
        } catch (err) { 
            console.error("Error fetching campaigns:", err); 
        }
    };

    // --- 3. HANDLERS ---
    const handleOpenCreate = () => {
        setSelectedCampaign(null); // Clear selection for "New" mode
        setOpenModal(true);
    };

    const handleOpenEdit = (campaign) => {
        setSelectedCampaign(campaign); // Set selected campaign for "Edit" mode
        setOpenModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this campaign? All tracked leads and ratings for this specific campaign will be permanently removed.")) {
            try {
                await api.delete(`/campaigns/list/${id}/`);
                fetchCampaigns(); // Refresh list
            } catch (err) { 
                alert("Failed to delete the campaign."); 
            }
        }
    };

    return (
        <Box sx={{ p: 1 }}>
            {/* --- HEADER SECTION --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a237e' }}>
                        Campaigner
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Execute enrollment drives and track promotion performance
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    sx={{ 
                        borderRadius: 3, 
                        px: 4, 
                        fontWeight: 800, 
                        bgcolor: '#1a237e',
                        boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)'
                    }} 
                    onClick={handleOpenCreate}
                >
                    Create Campaign
                </Button>
            </Box>

            {/* --- CAMPAIGN LIST TABLE --- */}
            <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #eee' }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#fafafa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800, color: '#555' }}>Campaign Name</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#555' }}>Target Program</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#555' }}>Batch</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#555' }}>Start Date</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#555' }}>Leads</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#555' }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: '#555' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {campaigns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                    <Typography color="text.disabled" variant="h6">No active campaigns. Start by creating one.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            campaigns.map((camp) => (
                                <TableRow key={camp.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell sx={{ fontWeight: 800, color: '#1a237e' }}>
                                        {camp.name}
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <SchoolIcon sx={{ fontSize: 16, color: '#90a4ae' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{camp.program_name}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={camp.batch} size="small" sx={{ fontWeight: 800, borderRadius: 1.5, bgcolor: '#e8eaf6' }} />
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <DateIcon sx={{ fontSize: 16, color: '#90a4ae' }} />
                                            <Typography variant="body2">{camp.start_date}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {camp.lead_count || 0}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={camp.is_active ? "Active" : "Closed"} 
                                            color={camp.is_active ? "success" : "default"} 
                                            size="small" 
                                            sx={{ fontWeight: 900, fontSize: '0.65rem', borderRadius: 1 }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Tooltip title="Open Workspace">
                                                <IconButton 
                                                    onClick={() => navigate(`/campaigns/${camp.id}`)} 
                                                    sx={{ bgcolor: '#e8eaf6', color: '#1a237e', '&:hover': { bgcolor: '#1a237e', color: '#fff' } }}
                                                >
                                                    <OpenIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit Settings">
                                                <IconButton 
                                                    onClick={() => handleOpenEdit(camp)} 
                                                    sx={{ bgcolor: '#f0f7ff', color: '#007bff', '&:hover': { bgcolor: '#007bff', color: '#fff' } }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Campaign">
                                                <IconButton 
                                                    onClick={() => handleDelete(camp.id)} 
                                                    sx={{ bgcolor: '#fff5f5', color: '#e74c3c', '&:hover': { bgcolor: '#e74c3c', color: '#fff' } }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- MODAL DIALOG --- */}
            <CreateCampaignModal 
                open={openModal} 
                campaign={selectedCampaign} // Pass the campaign to enable Edit mode
                onClose={() => { setOpenModal(false); fetchCampaigns(); }} 
            />
        </Box>
    );
};

export default Campaigns;