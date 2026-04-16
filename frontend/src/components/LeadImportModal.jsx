import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
    DialogActions, Stack, MenuItem, TextField, Alert, 
    CircularProgress, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Paper, Divider
} from '@mui/material';
import { 
    CloudUpload as UploadIcon, 
    CheckCircle as CheckIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import api from '../api/axios';
import Papa from 'papaparse';

const LeadImportModal = ({ open, onClose, campaignId = null }) => {
    // --- 1. STATE ---
    const [programs, setPrograms] = useState([]);
    const [importStep, setImportStep] = useState(1); // 1: Setup, 2: Preview
    const [loading, setLoading] = useState(false);
    const [csvData, setCsvData] = useState([]);
    
    const [meta, setMeta] = useState({
        category: 'PARTICIPANT', // PARTICIPANT, SOCIAL, WEBINAR
        platform: 'FB',
        courseType: 'SHORT',
        program_id: '',
        batch: '',
        start_date: ''
    });

    // --- 2. INITIALIZATION ---
    useEffect(() => {
        if (open) {
            fetchPrograms();
            setImportStep(1);
            setCsvData([]);
            
            // If we are in a campaign, default to SOCIAL category as per common use case
            if (campaignId) {
                setMeta(prev => ({ ...prev, category: 'SOCIAL', platform: 'FB' }));
            } else {
                setMeta(prev => ({ ...prev, category: 'PARTICIPANT', platform: 'NA' }));
            }
        }
    }, [open, campaignId]);

    const fetchPrograms = async () => {
        try {
            const res = await api.get('/courses/programs/');
            setPrograms(res.data);
        } catch (err) {
            console.error("Uploader failed to fetch programs");
        }
    };

    // --- 3. HANDLERS ---
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const headers = results.meta.fields.map(f => f.toLowerCase());
                if (!headers.includes('email')) {
                    alert("Error: The CSV must contain an 'email' column.");
                    return;
                }
                setCsvData(results.data);
                setImportStep(2);
            }
        });
    };

    const handleImportSubmit = async () => {
        if (!meta.program_id) return alert("Please select a specific Course/Program.");
        
        setLoading(true);
        try {
            await api.post('/leads/manage/bulk-import/', {
                leads: csvData,
                meta: {
                    ...meta,
                    campaign_id: campaignId // Pass campaign context to backend
                }
            });
            alert(`Successfully imported ${csvData.length} leads.`);
            onClose(); // Parent will refresh data
        } catch (err) {
            alert("Import failed. Check CSV format.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={() => !loading && onClose()} 
            maxWidth="sm" 
            fullWidth 
            PaperProps={{ sx: { borderRadius: 5, p: 1 } }}
        >
            <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem', color: '#1a237e' }}>
                {importStep === 1 
                    ? (campaignId ? "Add Leads to Campaign" : "Master Lead Import") 
                    : "Verify Data Preview"}
            </DialogTitle>
            
            <DialogContent sx={{ overflowY: 'visible' }}>
                {importStep === 1 ? (
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            {campaignId 
                                ? "Choose the source and target program for this campaign batch." 
                                : "Define the context for the leads being added to the bank."}
                        </Typography>

                        {/* 1. Category Selection */}
                        <TextField 
                            select fullWidth label="Lead Source Category" 
                            variant="outlined"
                            value={meta.category} 
                            onChange={(e) => setMeta({...meta, category: e.target.value})}
                        >
                            <MenuItem value="PARTICIPANT">Course Participant</MenuItem>
                            <MenuItem value="SOCIAL">Social Media Lead</MenuItem>
                            <MenuItem value="WEBINAR">Webinar Lead</MenuItem>
                        </TextField>

                        {/* 2. Platform (Conditional for Social) */}
                        {meta.category === 'SOCIAL' && (
                            <TextField 
                                select fullWidth label="Social Media Platform" 
                                value={meta.platform} 
                                onChange={(e) => setMeta({...meta, platform: e.target.value})}
                            >
                                <MenuItem value="FB">Facebook</MenuItem>
                                <MenuItem value="IG">Instagram</MenuItem>
                                <MenuItem value="LI">LinkedIn</MenuItem>
                                <MenuItem value="TT">TikTok</MenuItem>
                            </TextField>
                        )}

                        {/* 3. Program Logic Box */}
                        <Box sx={{ p: 2.5, bgcolor: '#f8faff', borderRadius: 4, border: '1px solid #d1d9ff' }}>
                            <Stack spacing={2}>
                                <TextField 
                                    select fullWidth label="Step 1: Course Type" 
                                    variant="standard"
                                    value={meta.courseType} 
                                    onChange={(e) => setMeta({...meta, courseType: e.target.value, program_id: ''})}
                                >
                                    <MenuItem value="SHORT">Short / Certificate</MenuItem>
                                    <MenuItem value="POSTGRAD">Academic Program</MenuItem>
                                </TextField>

                                <TextField 
                                    select fullWidth label="Step 2: Select Name" 
                                    required
                                    value={meta.program_id} 
                                    onChange={(e) => setMeta({...meta, program_id: e.target.value})}
                                >
                                    {programs
                                        .filter(p => p.program_type === meta.courseType)
                                        .map(p => (
                                            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                        ))
                                    }
                                </TextField>
                            </Stack>
                        </Box>

                        {/* 4. Batch Info (Conditional for Participants) */}
                        {meta.category === 'PARTICIPANT' && (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField fullWidth label="Batch" placeholder="Batch 01" value={meta.batch} onChange={(e) => setMeta({...meta, batch: e.target.value})} />
                                <TextField fullWidth label="Start Date" placeholder="MM/YY" value={meta.start_date} onChange={(e) => setMeta({...meta, start_date: e.target.value})} />
                            </Box>
                        )}

                        {/* 5. Upload Box */}
                        <Box sx={{ 
                            p: 4, border: '2px dashed #d1d9ff', borderRadius: 4, 
                            textAlign: 'center', bgcolor: '#fbfcfe', cursor: 'pointer',
                            '&:hover': { bgcolor: '#f0f4ff', borderColor: '#1a237e' }
                        }} component="label">
                            <input type="file" accept=".csv" hidden onChange={handleFileSelect} />
                            <UploadIcon sx={{ fontSize: 40, color: '#1a237e', mb: 1 }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a237e' }}>Click to Upload CSV</Typography>
                            <Typography variant="caption" color="text.secondary">Mandatory columns: email, name</Typography>
                        </Box>
                    </Stack>
                ) : (
                    /* STEP 2: PREVIEW TABLE */
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="success" sx={{ mb: 3, borderRadius: 3, fontWeight: 700 }}>
                            {csvData.length} leads parsed successfully.
                        </Alert>
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300, borderRadius: 3 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        {Object.keys(csvData[0] || {}).map(key => (
                                            <TableCell key={key} sx={{ fontWeight: 'bold', bgcolor: '#f8f9fa', fontSize: '0.7rem' }}>{key}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {csvData.slice(0, 5).map((row, idx) => (
                                        <TableRow key={idx}>
                                            {Object.values(row).map((val, i) => <TableCell key={i} sx={{ fontSize: '0.7rem' }}>{val}</TableCell>)}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </DialogContent>

            <Divider sx={{ mt: 1 }} />

            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} disabled={loading} sx={{ fontWeight: 700, color: 'text.secondary' }}>Cancel</Button>
                <Box sx={{ flexGrow: 1 }} />
                {importStep === 2 && (
                    <Stack direction="row" spacing={2}>
                        <Button startIcon={<ArrowBackIcon />} onClick={() => setImportStep(1)} variant="outlined" sx={{ fontWeight: 700, borderRadius: 2 }}>Back</Button>
                        <Button 
                            variant="contained" 
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
                            onClick={handleImportSubmit} 
                            disabled={loading}
                            sx={{ borderRadius: 2.5, fontWeight: 900, px: 4, bgcolor: '#1a237e' }}
                        >
                            Confirm & Save
                        </Button>
                    </Stack>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default LeadImportModal;