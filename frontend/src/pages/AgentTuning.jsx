import React, { useState, useEffect } from 'react';
import { 
    Box, Grid, Paper, Typography, List, ListItem, ListItemButton, 
    ListItemIcon, ListItemText, Divider, Button, Stack, Chip,
    CircularProgress, Alert, Card, CardContent, TextField,
    Avatar, IconButton, Tooltip
} from '@mui/material';
import { 
    Psychology as AgentIcon, 
    History as HistoryIcon, 
    Save as SaveIcon,
    Bolt as BoltIcon,
    ArrowForward as ArrowIcon,
    Refresh as RefreshIcon,
    AutoAwesome as MagicIcon,
    Terminal as CodeIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const AgentTuning = () => {
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [newInstructions, setNewInstructions] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            setLoading(true);
            const res = await api.get('/brain/agents/');
            setAgents(res.data);
            if (res.data.length > 0) {
                if (selectedAgent) {
                    const refreshed = res.data.find(a => a.slug === selectedAgent.slug);
                    if (refreshed) setSelectedAgent(refreshed);
                } else {
                    setSelectedAgent(res.data[0]);
                }
            }
        } catch (err) {
            setError("Failed to load AI agents.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTune = async () => {
        if (!newInstructions.trim()) return;
        setSaving(true);
        try {
            await api.post(`/brain/agents/${selectedAgent.slug}/tune/`, {
                instructions: newInstructions
            });
            setNewInstructions('');
            await fetchAgents(); 
        } catch (err) {
            alert("Error saving instructions.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress thickness={5} size={60} sx={{ color: '#1a237e' }} />
        </Box>
    );

    return (
        <Box sx={{ p: 0, height: 'calc(100vh - 64px)', display: 'flex', bgcolor: '#fff' }}>
            
            {/* 1. AGENT SIDEBAR (Fixed Left) */}
            <Box sx={{ 
                width: 280, borderRight: '1px solid #eee', 
                display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' 
            }}>
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid #eee' }}>
                    <BoltIcon sx={{ color: '#1a237e' }} />
                    <Typography variant="h6" fontWeight={900} color="#1a237e">Agent Console</Typography>
                </Box>
                
                <List sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
                    {agents.map((agent) => (
                        <ListItem key={agent.slug} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton 
                                selected={selectedAgent?.slug === agent.slug}
                                onClick={() => {
                                    setSelectedAgent(agent);
                                    setNewInstructions('');
                                }}
                                sx={{ 
                                    borderRadius: 3, py: 1.5,
                                    '&.Mui-selected': { 
                                        bgcolor: '#1a237e', color: '#fff',
                                        '& .MuiListItemIcon-root': { color: '#fff' },
                                        '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.7)' }
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <AgentIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={agent.name} 
                                    primaryTypographyProps={{ fontWeight: 800, fontSize: '0.85rem' }}
                                    secondary={agent.slug}
                                    secondaryTypographyProps={{ fontSize: '0.7rem' }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ p: 2, borderTop: '1px solid #eee' }}>
                    <Button fullWidth startIcon={<RefreshIcon />} onClick={fetchAgents} sx={{ fontWeight: 800 }}>Sync Registry</Button>
                </Box>
            </Box>

            {/* 2. CORE LOGIC PANEL (Center) */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #eee' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="overline" color="text.secondary" fontWeight={900}>FOUNDATIONS</Typography>
                        <Typography variant="h6" fontWeight={900}>{selectedAgent?.name}</Typography>
                    </Box>
                    <Tooltip title="View Tuning History">
                        <IconButton onClick={() => setShowHistory(!showHistory)} color={showHistory ? 'primary' : 'default'}>
                            <HistoryIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                
                <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto', bgcolor: '#1e293b' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                        <CodeIcon sx={{ color: '#64748b' }} fontSize="small" />
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 900, letterSpacing: 1 }}>SYSTEM_PROMPT.MD</Typography>
                    </Stack>
                    <Typography sx={{ 
                        fontFamily: 'monospace', color: '#cbd5e1', 
                        whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.9rem' 
                    }}>
                        {selectedAgent?.base_instruction}
                    </Typography>
                </Box>
            </Box>

            {/* 3. TUNING EDITOR (Exactly on the Right) */}
            <Box sx={{ width: 450, display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="overline" color="primary" fontWeight={900}>ACTIVE TUNING</Typography>
                    <Button 
                        variant="contained" 
                        size="small"
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        onClick={handleSaveTune}
                        disabled={saving || !newInstructions.trim()}
                        sx={{ borderRadius: 2, fontWeight: 800, textTransform: 'none', bgcolor: '#1a237e' }}
                    >
                        Apply
                    </Button>
                </Box>

                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
                    <TextField
                        multiline
                        fullWidth
                        placeholder="Add incremental instructions here..."
                        value={newInstructions}
                        onChange={(e) => setNewInstructions(e.target.value)}
                        sx={{ 
                            flexGrow: 1,
                            '& .MuiOutlinedInput-root': { 
                                height: '100%',
                                '& fieldset': { border: 'none' },
                                alignItems: 'flex-start',
                                p: 3,
                                fontSize: '0.95rem',
                                lineHeight: 1.6
                            } 
                        }}
                    />
                </Box>

                {/* SLIDING HISTORY DRAWER (Within Right Panel) */}
                <AnimatePresence>
                    {showHistory && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: '40%' }}
                            exit={{ height: 0 }}
                            style={{ 
                                borderTop: '2px solid #eee', 
                                overflowY: 'auto', 
                                bgcolor: '#f8fafc',
                                position: 'relative'
                            }}
                        >
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, bgcolor: '#f8fafc', zIndex: 1 }}>
                                <Typography variant="caption" fontWeight={900}>TUNING LOGS</Typography>
                                <IconButton size="small" onClick={() => setShowHistory(false)}><CloseIcon fontSize="inherit" /></IconButton>
                            </Box>
                            <Box sx={{ px: 2, pb: 2 }}>
                                {selectedAgent?.tuning_history?.slice().reverse().map((tune, idx) => (
                                    <Box key={tune.id} sx={{ mb: 2, p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #eee' }}>
                                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                            v{selectedAgent.tuning_history.length - idx} • {new Date(tune.created_at).toLocaleDateString()}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{tune.additional_instructions}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>

        </Box>
    );
};

export default AgentTuning;
