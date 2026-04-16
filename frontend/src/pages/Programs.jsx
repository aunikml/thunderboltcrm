import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Chip, IconButton,
    Dialog, AppBar, Toolbar, Slide, Container, Stack, Tooltip
} from '@mui/material';
import { 
    Add as AddIcon, 
    Edit as EditIcon, 
    Delete as DeleteIcon, 
    Close as CloseIcon, 
    School as SchoolIcon, 
    WorkspacePremium as CertIcon,
    Language as LanguageIcon
} from '@mui/icons-material';
import api from '../api/axios';
import ProgramEditor from './ProgramEditor';

// Smooth transition for the full-screen modal
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const Programs = () => {
    const [programs, setPrograms] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [activeType, setActiveType] = useState('SHORT');

    // Fetch programs on load
    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        try {
            const res = await api.get('/courses/programs/');
            setPrograms(res.data);
        } catch (err) {
            console.error("Error fetching programs:", err);
        }
    };

    const handleOpen = (type, program = null) => {
        setActiveType(type);
        setSelectedProgram(program);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedProgram(null);
        fetchPrograms(); // Refresh the list after closing
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this program? This action cannot be undone.")) {
            try {
                await api.delete(`/courses/programs/${id}/`);
                fetchPrograms();
            } catch (err) {
                alert("Failed to delete the program.");
            }
        }
    };

    return (
        <Box sx={{ p: 1 }}>
            {/* 1. HEADER SECTION */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 5,
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a237e' }}>
                        Academic Inventory
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Manage Master's degrees and certificate courses
                    </Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                    <Button 
                        variant="outlined" 
                        color="secondary"
                        startIcon={<CertIcon />} 
                        onClick={() => handleOpen('SHORT')}
                        sx={{ borderRadius: 3, px: 3, fontWeight: 'bold', borderSize: 2 }}
                    >
                        Add Short Course
                    </Button>
                    <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<SchoolIcon />} 
                        onClick={() => handleOpen('POSTGRAD')}
                        sx={{ borderRadius: 3, px: 3, fontWeight: 'bold', boxShadow: '0 4px 14px 0 rgba(25,118,210,0.39)' }}
                    >
                        Add Academic Program
                    </Button>
                </Stack>
            </Box>

            {/* 2. PROGRAM LIST TABLE */}
            <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #eee' }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#fcfcfc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800, color: '#555' }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#555' }}>Program Name</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#555' }}>Degree / Level</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#555' }}>Language</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: '#555' }}>Management</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {programs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                    <Typography color="text.disabled" variant="h6">No programs enrolled yet.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            programs.map((p) => (
                                <TableRow key={p.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>
                                        {p.program_type === 'POSTGRAD' ? (
                                            <Chip 
                                                icon={<SchoolIcon style={{ color: '#1a237e' }} />} 
                                                label="Academic" 
                                                sx={{ bgcolor: '#e8eaf6', color: '#1a237e', fontWeight: 'bold', borderRadius: 2 }}
                                            />
                                        ) : (
                                            <Chip 
                                                icon={<CertIcon style={{ color: '#004d40' }} />} 
                                                label="Short/Cert" 
                                                sx={{ bgcolor: '#e0f2f1', color: '#004d40', fontWeight: 'bold', borderRadius: 2 }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#2c3e50' }}>
                                            {p.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#7f8c8d' }}>
                                            {p.degree_type !== 'NONE' ? p.degree_type : 'Certificate'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LanguageIcon sx={{ fontSize: 16, color: '#bdc3c7' }} />
                                            <Typography variant="body2">{p.language}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Tooltip title="Edit Details">
                                                <IconButton 
                                                    onClick={() => handleOpen(p.program_type, p)} 
                                                    sx={{ bgcolor: '#f0f7ff', color: '#007bff', '&:hover': { bgcolor: '#007bff', color: '#fff' } }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Program">
                                                <IconButton 
                                                    onClick={() => handleDelete(p.id)} 
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

            {/* 3. FULL SCREEN EDITOR DIALOG */}
            <Dialog 
                fullScreen 
                open={open} 
                onClose={handleClose} 
                TransitionComponent={Transition}
            >
                <AppBar sx={{ 
                    position: 'relative', 
                    bgcolor: activeType === 'POSTGRAD' ? '#1a237e' : '#004d40',
                    boxShadow: 'none'
                }}>
                    <Toolbar>
                        <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
                            <CloseIcon />
                        </IconButton>
                        <Typography sx={{ ml: 2, flex: 1, fontWeight: 700 }} variant="h6" component="div">
                            {selectedProgram ? `Modify: ${selectedProgram.name}` : `Create New ${activeType === 'POSTGRAD' ? 'Academic Program' : 'Short Course'}`}
                        </Typography>
                        <Button 
                            autoFocus 
                            color="inherit" 
                            variant="outlined"
                            sx={{ fontWeight: 'bold', px: 4, borderRadius: 2 }}
                            onClick={() => document.getElementById('submit-btn').click()}
                        >
                            Confirm & Save
                        </Button>
                    </Toolbar>
                </AppBar>
                
                {/* Scrollable Container for the Editor */}
                <Box sx={{ bgcolor: '#f4f7f9', minHeight: '100vh', py: 6 }}>
                    <Container maxWidth="lg">
                        <ProgramEditor 
                            type={activeType} 
                            program={selectedProgram} 
                            onSave={handleClose} 
                        />
                    </Container>
                </Box>
            </Dialog>
        </Box>
    );
};

export default Programs;