import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, MenuItem, Stack, Box, Typography, Divider 
} from '@mui/material';
import api from '../api/axios';

const CreateCampaignModal = ({ open, onClose, campaign = null }) => {
    // --- 1. STATE ---
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        courseType: 'SHORT', // Helper to filter the program list
        program: '',      // Stores the Program ID
        batch: '',
        start_date: ''
    });

    // --- 2. INITIALIZATION ---
    useEffect(() => {
        if (open) {
            fetchPrograms();
            
            // If we are in EDIT mode (campaign prop is provided)
            if (campaign) {
                setFormData({
                    name: campaign.name,
                    courseType: campaign.program_type || 'SHORT',
                    program: campaign.program,
                    batch: campaign.batch,
                    start_date: campaign.start_date
                });
            } else {
                // If we are in CREATE mode
                setFormData({ name: '', courseType: 'SHORT', program: '', batch: '', start_date: '' });
            }
        }
    }, [open, campaign]);

    const fetchPrograms = async () => {
        try {
            const res = await api.get('/courses/programs/');
            setPrograms(res.data);
        } catch (err) {
            console.error("Failed to fetch programs for campaign modal.");
        }
    };

    // --- 3. SUBMISSION ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.program) return alert("Please select a target academic program.");
        
        setLoading(true);
        try {
            if (campaign) {
                // UPDATE Existing
                await api.put(`/campaigns/list/${campaign.id}/`, {
                    name: formData.name,
                    program: formData.program,
                    batch: formData.batch,
                    start_date: formData.start_date
                });
            } else {
                // CREATE New
                await api.post('/campaigns/list/', {
                    name: formData.name,
                    program: formData.program,
                    batch: formData.batch,
                    start_date: formData.start_date
                });
            }
            onClose(); // Parent will refresh the table
        } catch (err) {
            alert("Error saving campaign. Ensure all fields are filled correctly.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth 
            PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
        >
            <DialogTitle sx={{ fontWeight: 900, fontSize: '1.6rem', color: '#1a237e' }}>
                {campaign ? "Edit Campaign Details" : "Launch New Campaign"}
            </DialogTitle>
            
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Stack spacing={3.5} sx={{ mt: 1 }}>
                        
                        {/* Campaign Name */}
                        <TextField 
                            label="Campaign Identifier" 
                            fullWidth 
                            placeholder="e.g. FB Ad Set - Spring 2024"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />

                        {/* Program Selection Area (Shaded Box for clarity) */}
                        <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 4, border: '1px solid #eee' }}>
                            <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ mb: 2.5, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                                Target Program Context
                            </Typography>
                            
                            <Stack spacing={2.5}>
                                <TextField 
                                    select 
                                    fullWidth 
                                    label="Course Type" 
                                    variant="outlined"
                                    value={formData.courseType}
                                    onChange={(e) => setFormData({...formData, courseType: e.target.value, program: ''})}
                                >
                                    <MenuItem value="SHORT">Short / Certificate Course</MenuItem>
                                    <MenuItem value="POSTGRAD">Academic Program (Postgrad)</MenuItem>
                                </TextField>

                                <TextField 
                                    select 
                                    fullWidth 
                                    label="Specific Program" 
                                    required
                                    value={formData.program}
                                    onChange={(e) => setFormData({...formData, program: e.target.value})}
                                    disabled={!formData.courseType}
                                >
                                    {programs
                                        .filter(p => p.program_type === formData.courseType)
                                        .map(p => (
                                            <MenuItem key={p.id} value={p.id}>
                                                {p.name}
                                            </MenuItem>
                                        ))
                                    }
                                </TextField>
                            </Stack>
                        </Box>

                        {/* Batch and Date Side-by-Side */}
                        <Box sx={{ display: 'flex', gap: 2.5 }}>
                            <TextField 
                                label="Batch Name" 
                                fullWidth 
                                required
                                placeholder="e.g. Batch 12"
                                value={formData.batch}
                                onChange={(e) => setFormData({...formData, batch: e.target.value})}
                            />
                            <TextField 
                                label="Start Date" 
                                fullWidth 
                                required
                                placeholder="MM/YY (e.g. 05/24)"
                                value={formData.start_date}
                                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                            />
                        </Box>
                    </Stack>
                </DialogContent>

                <Divider sx={{ mt: 2 }} />

                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button 
                        onClick={onClose} 
                        sx={{ fontWeight: 800, color: 'text.secondary', px: 3 }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={loading}
                        sx={{ 
                            fontWeight: 900, 
                            px: 5, 
                            bgcolor: '#1a237e', 
                            borderRadius: 2.5,
                            '&:hover': { bgcolor: '#0d47a1' }
                        }}
                    >
                        {loading ? "Processing..." : (campaign ? "Update Campaign" : "Launch Campaign")}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CreateCampaignModal;