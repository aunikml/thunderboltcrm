import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, 
    FormGroup, FormControlLabel, Checkbox, Chip
} from '@mui/material';
import { 
    Edit as EditIcon, 
    Delete as DeleteIcon, 
    Add as AddIcon,
    Person as PersonIcon 
} from '@mui/icons-material';
import api from '../api/axios';

const AdminEnrollment = () => {
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', phone_number: '', roles: []
    });

    const rolesList = ['Admin', 'Lead manager', 'Campaign manager', 'Sales Representative', 'Manager', 'Skills admin'];

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/accounts/manage/');
            setUsers(res.data);
        } catch (err) { console.error("Failed to fetch users"); }
    };

    const handleOpen = (user = null) => {
        if (user) {
            setEditMode(true);
            setSelectedId(user.id);
            setFormData({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone_number: user.phone_number || '',
                roles: user.roles || []
            });
        } else {
            setEditMode(false);
            setFormData({ first_name: '', last_name: '', email: '', phone_number: '', roles: [] });
        }
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleRoleChange = (role) => {
        const updatedRoles = formData.roles.includes(role)
            ? formData.roles.filter(r => r !== role)
            : [...formData.roles, role];
        setFormData({ ...formData, roles: updatedRoles });
    };

    const handleSubmit = async () => {
        try {
            if (editMode) {
                await api.put(`/accounts/manage/${selectedId}/`, formData);
            } else {
                await api.post('/accounts/manage/', formData);
            }
            fetchUsers();
            handleClose();
        } catch (err) { alert("Action failed. Check if email is unique."); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await api.delete(`/accounts/manage/${id}/`);
                fetchUsers();
            } catch (err) { alert("Delete failed"); }
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900 }}>Staff Management</Typography>
                    <Typography color="text.secondary">Manage system access and roles</Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={() => handleOpen()}
                    sx={{ borderRadius: 2, fontWeight: 'bold', px: 3 }}
                >
                    Enroll New Staff
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Staff Member</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Roles</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <PersonIcon color="action" />
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {user.first_name} {user.last_name}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    {user.roles?.map(role => (
                                        <Chip key={role} label={role} size="small" sx={{ mr: 0.5, bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 'bold' }} />
                                    ))}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleOpen(user)} color="primary"><EditIcon /></IconButton>
                                    <IconButton onClick={() => handleDelete(user.id)} color="error"><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* ENROLLMENT / EDIT MODAL */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    {editMode ? "Edit Staff Member" : "Enroll New Staff Member"}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField fullWidth label="First Name" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
                            <TextField fullWidth label="Last Name" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
                        </Box>
                        <TextField fullWidth label="Email" disabled={editMode} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                        <TextField fullWidth label="Phone Number" value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
                        
                        <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold' }}>Assign Permissions</Typography>
                        <FormGroup row>
                            {rolesList.map(role => (
                                <FormControlLabel
                                    key={role}
                                    control={<Checkbox checked={formData.roles.includes(role)} onChange={() => handleRoleChange(role)} />}
                                    label={role}
                                    sx={{ minWidth: '45%' }}
                                />
                            ))}
                        </FormGroup>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleClose} color="inherit" sx={{ fontWeight: 'bold' }}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{ fontWeight: 'bold', px: 4 }}>
                        {editMode ? "Update Access" : "Create Account"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminEnrollment;