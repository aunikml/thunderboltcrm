import React, { useState, useEffect, useRef } from 'react';
import { 
    Drawer, Box, Typography, IconButton, Divider, 
    Stack, Chip, LinearProgress, Paper, Button, CircularProgress, Alert
} from '@mui/material';
import { 
    Close as CloseIcon, 
    Psychology as BrainIcon, 
    AutoAwesome as MagicIcon,
    Chat as ScriptIcon,
    Speed as SpeedIcon,
    ErrorOutline as ErrorIcon,
    ContentCopy as CopyIcon
} from '@mui/icons-material';
import api from '../api/axios';

const LeadIntelligenceSidebar = ({ open, onClose, lead }) => {
    // --- 1. STATE ---
    const [intel, setIntel] = useState(null);
    const [loading, setLoading] = useState(false);
    const [polling, setPolling] = useState(false);
    const [error, setError] = useState(null);
    
    // Safety ref to prevent duplicate triggers
    const hasTriggeredRef = useRef(null);

    // --- 2. EFFECT: HANDLE OPEN/CLOSE ---
    useEffect(() => {
        if (open && lead) {
            setError(null);
            setIntel(null);
            
            // Check if we already processed this lead in this session
            const alreadyProcessed = hasTriggeredRef.current === lead.id;
            fetchIntelligence(!alreadyProcessed); // Pass true to allow trigger if new
        } else {
            setPolling(false);
        }
    }, [open, lead]);

    // --- 3. FETCH & POLL LOGIC ---
    const fetchIntelligence = async (canTrigger = false) => {
        if (!lead) return;
        
        try {
            const res = await api.get(`/brain/intelligence/${lead.id}/`);
            
            if (res.data.status === 'processing') {
                setPolling(true);
                
                // AUTO-TRIGGER: If backend says "processing" but no thread has started
                if (canTrigger && hasTriggeredRef.current !== lead.id) {
                    await triggerAnalysis();
                }

                // HIGH-SPEED POLLING: Check every 1 second (matching Lightning Engine speed)
                setTimeout(() => {
                    if (open) fetchIntelligence(false);
                }, 1000);

            } else if (res.data.status === 'failed') {
                setError(res.data.message);
                setPolling(false);
            } else {
                // SUCCESS: Lead intelligence fully processed
                setIntel(res.data);
                setPolling(false);
                setLoading(false);
            }
        } catch (err) {
            console.error("Sidebar Fetch Error:", err);
            setPolling(false);
        }
    };

    const triggerAnalysis = async () => {
        hasTriggeredRef.current = lead.id;
        try {
            await api.post(`/brain/analyze/${lead.id}/`);
            console.log("🚀 Lightning AI Dispatch Successful");
        } catch (err) {
            setError(err.response?.data?.error || "AI Engine failed to start.");
            hasTriggeredRef.current = null; 
        }
    };

    // --- 4. UTILS ---
    const handleCopyScript = () => {
        if (intel?.generated_script) {
            navigator.clipboard.writeText(intel.generated_script);
            alert("Script copied!");
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'success';
        if (score >= 50) return 'warning';
        return 'error';
    };

    return (
        <Drawer 
            anchor="right" 
            open={open} 
            onClose={onClose} 
            PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, borderLeft: 'none' } }}
        >
            {/* --- HEADER --- */}
            <Box sx={{ p: 3, bgcolor: '#1a237e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <BrainIcon />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1 }}>Lead Intelligence</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 700 }}>Gemini 3 Turbo Logic</Typography>
                    </Box>
                </Stack>
                <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
            </Box>

            <Box sx={{ p: 4 }}>
                {error && (
                    <Alert severity="error" icon={<ErrorIcon />} sx={{ borderRadius: 3, mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* --- POLLING STATE --- */}
                {polling && !intel && !error && (
                    <Box sx={{ textAlign: 'center', py: 15 }}>
                        <CircularProgress size={60} sx={{ mb: 4, color: '#1a237e' }} />
                        <Typography variant="h6" fontWeight={800} color="#1a237e">Analyzing Prospect...</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, px: 5 }}>
                            The AI is synthesizing background research and drafting a custom script.
                        </Typography>
                        <LinearProgress sx={{ mt: 5, borderRadius: 5, height: 6, mx: 5 }} />
                    </Box>
                )}

                {/* --- RESULTS VIEW --- */}
                {intel && (
                    <Stack spacing={4} className="animate-in fade-in duration-300">
                        {/* Prospect Title */}
                        <Box>
                            <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.disabled', letterSpacing: 2 }}>PROSPECT DATA</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a237e', mt: 0.5 }}>
                                {lead?.first_name} {lead?.last_name}
                            </Typography>
                            <Chip 
                                label={intel.persona_tag || "General Prospect"} 
                                color="primary" 
                                sx={{ mt: 1.5, fontWeight: 900, borderRadius: 1.5, px: 1, fontSize: '0.75rem' }} 
                            />
                        </Box>

                        {/* Conversion Score */}
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 5, bgcolor: '#f8faff', border: '1px solid #e3f2fd' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#455a64' }}>Conversion Propensity</Typography>
                                    <Typography variant="caption" color="text.secondary">Skill & Goal Alignment</Typography>
                                </Box>
                                <Typography variant="h3" sx={{ fontWeight: 1000, color: `${getScoreColor(intel.score)}.main`, lineHeight: 1 }}>
                                    {intel.score}%
                                </Typography>
                            </Stack>
                            <LinearProgress 
                                variant="determinate" 
                                value={intel.score} 
                                color={getScoreColor(intel.score)}
                                sx={{ height: 12, borderRadius: 6, bgcolor: '#eee' }} 
                            />
                        </Paper>

                        {/* AI Approach / Reasoning */}
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                <SpeedIcon sx={{ color: '#1a237e' }} fontSize="small" />
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>AI Strategic Reasoning</Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ color: '#546e7a', lineHeight: 1.8, bgcolor: '#f5f5f5', p: 2, borderRadius: 3, border: '1px solid #eceff1' }}>
                                {intel.suggested_approach || "No reasoning available."}
                            </Typography>
                        </Box>

                        <Divider />

                        {/* Tailored Sales Script */}
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <ScriptIcon sx={{ color: '#1a237e' }} fontSize="small" />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Personalized Script</Typography>
                                </Stack>
                                {intel.generated_script && (
                                    <IconButton size="small" onClick={handleCopyScript}>
                                        <CopyIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Stack>
                            <Paper sx={{ 
                                p: 3, 
                                bgcolor: '#ffffff', 
                                borderRadius: 4, 
                                border: '2px solid #e8eaf6',
                                minHeight: '200px'
                            }}>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontStyle: 'italic', color: '#37474f', lineHeight: 1.8 }}>
                                    {intel.generated_script || "Script generation failed or was skipped."}
                                </Typography>
                            </Paper>
                        </Box>
                    </Stack>
                )}

                {/* Placeholder if no intel and no polling */}
                {!intel && !polling && !error && (
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                        <MagicIcon sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
                        <Typography variant="h6" fontWeight={800}>Analysis Ready</Typography>
                        <Button 
                            variant="contained" 
                            onClick={() => fetchIntelligence(true)} 
                            sx={{ mt: 3, bgcolor: '#1a237e', borderRadius: 3, px: 4, fontWeight: 800 }}
                        >
                            Trigger Intelligence
                        </Button>
                    </Box>
                )}
            </Box>
        </Drawer>
    );
};

export default LeadIntelligenceSidebar;