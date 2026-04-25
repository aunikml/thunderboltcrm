import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
    DialogActions, Stack, MenuItem, TextField, Alert, 
    CircularProgress, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Paper, Divider, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { 
    CloudUpload as UploadIcon, 
    CheckCircle as CheckIcon,
    ArrowBack as ArrowBackIcon,
    AutoAwesome as MagicIcon,
    History as LegacyIcon
} from '@mui/icons-material';
import api from '../api/axios';
import Papa from 'papaparse';

const LeadImportModal = ({ open, onClose, campaignId = null }) => {
    // --- 1. STATE ---
    const [importMode, setImportMode] = useState('discovery'); // Default to AI Matchmaker for master import
    const [programs, setPrograms] = useState([]);
    const [importStep, setImportStep] = useState(1); 
    const [loading, setLoading] = useState(false);
    const [csvData, setCsvData] = useState([]);
    
    const [meta, setMeta] = useState({
        category: 'PARTICIPANT', 
        platform: 'NA',
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
            setImportMode(campaignId ? 'legacy' : 'discovery');
            
            if (campaignId) {
                setMeta(prev => ({ ...prev, category: 'CAMPAIGN', platform: 'NA' }));
            } else {
                setMeta(prev => ({ ...prev, category: 'PARTICIPANT', platform: 'NA' }));
            }
        }
    }, [open, campaignId]);

    const fetchPrograms = async () => {
        try {
            const res = await api.get('/courses/programs/');
            setPrograms(res.data);
        } catch (err) { console.error("Uploader failed to fetch programs"); }
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
        if (importMode === 'legacy' && !meta.program_id) {
            return alert("Please select a specific Course for Legacy Mode.");
        }
        
        setLoading(true);
        try {
            await api.post('/leads/manage/bulk-import/', {
                leads: csvData,
                meta: {
                    ...meta,
                    program_id: importMode === 'discovery' ? null : meta.program_id,
                    campaign_id: campaignId 
                }
            });
            alert(`Successfully imported ${csvData.length} leads. AI processing started.`);
            onClose(); 
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
                {importStep === 1 ? "Import New Prospects" : "Verify Data Preview"}
            </DialogTitle>
            
            <DialogContent sx={{ overflowY: 'visible' }}>
                {importStep === 1 ? (
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        
                        {/* MODE SELECTOR */}
                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', mb: 1, display: 'block' }}>
                                CHOOSE IMPORT STRATEGY
                            </Typography>
                            <ToggleButtonGroup
                                value={importMode}
                                exclusive
                                onChange={(e, val) => val && setImportMode(val)}
                                fullWidth
                                color="primary"
                            >
                                <ToggleButton value="discovery" sx={{ py: 1.5, borderRadius: 3, fontWeight: 800 }}>
                                    <MagicIcon sx={{ mr: 1, fontSize: 18 }} /> AI Matchmaker
                                </ToggleButton>
                                <ToggleButton value="legacy" sx={{ py: 1.5, borderRadius: 3, fontWeight: 800 }}>
                                    <LegacyIcon sx={{ mr: 1, fontSize: 18 }} /> Legacy Course-Wise
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {/* SOURCE SELECTION - ALWAYS VISIBLE */}
                        <TextField 
                            select fullWidth label="Lead Source / Platform" 
                            value={meta.platform} 
                            onChange={(e) => setMeta({...meta, platform: e.target.value})}
                            helperText="Where did these leads originate from?"
                        >
                            <MenuItem value="FB">Facebook</MenuItem>
                            <MenuItem value="IG">Instagram</MenuItem>
                            <MenuItem value="LI">LinkedIn</MenuItem>
                            <MenuItem value="TT">TikTok</MenuItem>
                            <MenuItem value="EXT_REF">External Referral</MenuItem>
                            <MenuItem value="INT_REF">Internal Referral</MenuItem>
                            <MenuItem value="ORG_REF">Organizational Referral</MenuItem>
                            <MenuItem value="NA">N/A / Other</MenuItem>
                        </TextField>

                        {importMode === 'discovery' ? (
                            <Alert severity="info" sx={{ borderRadius: 3, fontWeight: 600 }}>
                                AI will automatically match these leads to the best courses based on their profession and background.
                            </Alert>
                        ) : (
                            <Stack spacing={2}>
                                <TextField 
                                    select fullWidth label="Category Filter" 
                                    value={meta.category} 
                                    onChange={(e) => setMeta({...meta, category: e.target.value})}
                                >
                                    <MenuItem value="PARTICIPANT">Course Participant</MenuItem>
                                    <MenuItem value="SOCIAL">Social Media Lead</MenuItem>
                                    <MenuItem value="WEBINAR">Webinar Lead</MenuItem>
                                    <MenuItem value="CAMPAIGN">Campaign Lead</MenuItem>
                                </TextField>

                                <Box sx={{ p: 2.5, bgcolor: '#f8faff', borderRadius: 4, border: '1px solid #d1d9ff' }}>
                                    <Stack spacing={2}>
                                        <TextField 
                                            select fullWidth label="1. Course Type" 
                                            variant="standard"
                                            value={meta.courseType} 
                                            onChange={(e) => setMeta({...meta, courseType: e.target.value, program_id: ''})}
                                        >
                                            <MenuItem value="SHORT">Short / Certificate</MenuItem>
                                            <MenuItem value="POSTGRAD">Academic Program</MenuItem>
                                        </TextField>

                                        <TextField 
                                            select fullWidth label="2. Select Course Name" 
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
                            </Stack>
                        )}

                        {/* UPLOAD BOX */}
                        <Box sx={{ 
                            p: 4, border: '2px dashed #d1d9ff', borderRadius: 4, 
                            textAlign: 'center', bgcolor: '#fbfcfe', cursor: 'pointer',
                            '&:hover': { bgcolor: '#f0f4ff', borderColor: '#1a237e' }
                        }} component="label">
                            <input type="file" accept=".csv" hidden onChange={handleFileSelect} />
                            <UploadIcon sx={{ fontSize: 40, color: '#1a237e', mb: 1 }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a237e' }}>Click to Upload CSV</Typography>
                            <Typography variant="caption" color="text.secondary">Required headers: email, name, profession, organization</Typography>
                        </Box>
                    </Stack>
                ) : (
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="success" sx={{ mb: 3, borderRadius: 3, fontWeight: 700 }}>
                            {csvData.length} records ready for processing.
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