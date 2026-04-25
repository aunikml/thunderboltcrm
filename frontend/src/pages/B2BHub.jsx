import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Stack, 
    Chip, Grid, Card, CardContent, CircularProgress, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, MenuItem
} from '@mui/material';
import { 
    Add as AddIcon, 
    Business as BusinessIcon, 
    ChevronRight as ViewIcon,
    Psychology as BrainIcon,
    LocationOn as MapIcon,
    Public as WebIcon,
    Group as PeopleIcon,
    Bolt as MagicIcon
} from '@mui/icons-material';
import api from '../api/axios';
import OrgProfile from './OrgProfile'; // We'll create this next

const B2BHub = () => {
    // --- 1. STATE ---
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrgId, setSelectedOrgId] = useState(null);
    
    // Create Modal State
    const [openModal, setOpenModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', org_type: 'CORP', country: '', hq_location: '',
        website: '', year_established: '', size_range: '50-200',
        thematic_areas: '', academic_levels: []
    });

    // --- 2. DATA FETCHING ---
    useEffect(() => {
        fetchOrgs();
    }, []);

    const fetchOrgs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/b2b/organizations/');
            setOrganizations(res.data);
        } catch (err) { console.error("Error fetching organizations", err); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        try {
            await api.post('/b2b/organizations/', formData);
            setOpenModal(false);
            fetchOrgs();
        } catch (err) { alert("Failed to create organization profile."); }
    };

    if (selectedOrgId) {
        return <OrgProfile orgId={selectedOrgId} onBack={() => { setSelectedOrgId(null); fetchOrgs(); }} />;
    }

    return (
        <Box sx={{ p: 1 }}>
            {/* HEADER */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a237e' }}>B2B Hub</Typography>
                    <Typography variant="body1" color="text.secondary">Institutional Partnership & Strategy Workspace</Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={() => setOpenModal(true)}
                    sx={{ borderRadius: 3, bgcolor: '#1a237e', fontWeight: 800, px: 3 }}
                >
                    Add Organization
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress /></Box>
            ) : (
                <Grid container spacing={3}>
                    {organizations.length === 0 ? (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 6, border: '2px dashed #eee' }}>
                                <BusinessIcon sx={{ fontSize: 80, color: '#d1d9ff', mb: 2 }} />
                                <Typography variant="h6" fontWeight={700} color="text.secondary">No Organizations Profiles Found</Typography>
                                <Typography variant="body2" color="text.disabled">Start by adding an NGO, Corporate, or Academic partner.</Typography>
                            </Paper>
                        </Grid>
                    ) : (
                        organizations.map((org) => (
                            <Grid item xs={12} md={6} lg={4} key={org.id}>
                                <Card 
                                    sx={{ 
                                        borderRadius: 5, 
                                        transition: '0.3s', 
                                        cursor: 'pointer',
                                        '&:hover': { boxShadow: '0 12px 30px rgba(26, 35, 126, 0.1)', borderColor: '#1a237e' },
                                        border: '1px solid #eef0f2'
                                    }}
                                    onClick={() => setSelectedOrgId(org.id)}
                                >
                                    <CardContent>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 900, color: '#1a237e' }}>{org.name}</Typography>
                                                <Chip label={org.org_type} size="small" sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem' }} />
                                            </Box>
                                            <IconButton size="small"><ViewIcon /></IconButton>
                                        </Stack>
                                        
                                        <Stack spacing={1}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <MapIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                                                <Typography variant="caption" fontWeight={700}>{org.hq_location}, {org.country}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PeopleIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                                                <Typography variant="caption" fontWeight={700}>{org.size_range} Employees</Typography>
                                            </Box>
                                        </Stack>

                                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: org.matches?.length > 0 ? '#2e7d32' : 'text.disabled' }}>
                                                {org.matches?.length > 0 ? `${org.matches.length} AI Matches` : 'No Analysis Yet'}
                                            </Typography>
                                            {org.matches?.length > 0 && <BrainIcon sx={{ fontSize: 18, color: '#7b1fa2' }} />}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            )}

            {/* CREATE MODAL */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 5 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: '#1a237e' }}>New Organization Profile</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField fullWidth label="Organization Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        <Stack direction="row" spacing={2}>
                            <TextField select fullWidth label="Type" value={formData.org_type} onChange={(e) => setFormData({...formData, org_type: e.target.value})}>
                                <MenuItem value="NGO">NGO</MenuItem>
                                <MenuItem value="CORP">Corporate</MenuItem>
                                <MenuItem value="GOV">Government</MenuItem>
                                <MenuItem value="ACAD">Academic</MenuItem>
                                <MenuItem value="DEV">Development Partner</MenuItem>
                            </TextField>
                            <TextField fullWidth label="Country" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} />
                        </Stack>
                        <TextField fullWidth label="HQ Location" value={formData.hq_location} onChange={(e) => setFormData({...formData, hq_location: e.target.value})} />
                        <TextField fullWidth multiline rows={2} label="Key Thematic Areas (e.g. Education, ECD)" value={formData.thematic_areas} onChange={(e) => setFormData({...formData, thematic_areas: e.target.value})} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenModal(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreate} sx={{ borderRadius: 3, fontWeight: 800, bgcolor: '#1a237e' }}>Create Profile</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default B2BHub;
