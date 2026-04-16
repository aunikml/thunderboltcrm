import React, { useState, useEffect } from 'react';
import { 
    Box, Grid, TextField, MenuItem, Button, Typography, 
    Paper, IconButton, Stack, Card, CardContent, Divider, Alert 
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Save as SaveIcon } from '@mui/icons-material';
import api from '../api/axios';

const ProgramEditor = ({ type, program, onSave }) => {
    // 1. Initial State covering both Short Course (10 fields) and Postgrad (14 fields)
    const initialState = {
        program_type: type,
        name: '',
        language: 'English',
        // Short Course Specific
        overview: '',
        objectives: [''],
        knowledge: [''],
        skills_competencies: [''],
        target_audience: [''],
        topics: [''],
        duration_tuition_fee: '', 
        number_of_sessions: '',
        // Postgrad Specific
        degree_type: 'MSC',
        about_programme: '',
        program_structure: '',
        assessment_details: '',
        modules: [{ name: '', description: '' }],
        unique_features: [''],
        admission_requirements: [''],
        teaching_learning: '',
        admission_test_details: '',
        career_prospects: ''
    };

    const [data, setData] = useState(initialState);
    const [error, setError] = useState(null);

    // Sync state when editing or switching types
    useEffect(() => {
        if (program) {
            setData(program);
        } else {
            setData({ ...initialState, program_type: type });
        }
    }, [program, type]);

    // --- Data Handlers ---
    const handleListChange = (field, index, value) => {
        const newList = [...data[field]];
        newList[index] = value;
        setData({ ...data, [field]: newList });
    };

    const addListItem = (field) => setData({ ...data, [field]: [...data[field], ""] });
    
    const removeListItem = (field, index) => {
        const newList = data[field].filter((_, i) => i !== index);
        setData({ ...data, [field]: newList.length > 0 ? newList : [''] });
    };

    const handleModuleChange = (index, field, value) => {
        const newModules = [...data.modules];
        newModules[index][field] = value;
        setData({ ...data, modules: newModules });
    };

    // --- Submission Logic ---
    const submit = async (e) => {
        if (e) e.preventDefault();
        setError(null);

        // Data Cleaning: Remove empty strings from lists and handle nulls for numbers
        const cleanedData = { ...data };
        const listFields = ['objectives', 'knowledge', 'skills_competencies', 'target_audience', 'topics', 'unique_features', 'admission_requirements'];
        
        listFields.forEach(field => {
            if (Array.isArray(cleanedData[field])) {
                cleanedData[field] = cleanedData[field].filter(item => item && item.trim() !== "");
            }
        });

        if (cleanedData.number_of_sessions === "") cleanedData.number_of_sessions = null;

        try {
            if (data.id) await api.put(`/courses/programs/${data.id}/`, cleanedData);
            else await api.post('/courses/programs/', cleanedData);
            onSave(); // Close modal and refresh list
        } catch (err) {
            const serverError = err.response?.data ? JSON.stringify(err.response.data) : "Network Error";
            setError("Validation failed: " + serverError);
        }
    };

    // --- SHORT COURSE FORM LAYOUT ---
    const ShortCourseForm = () => (
        <Stack spacing={4}>
            <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '6px solid #004d40' }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>1. Basic Info & Narrative</Typography>
                    <Stack spacing={3}>
                        <TextField fullWidth label="Name of the course" value={data.name} onChange={(e) => setData({...data, name: e.target.value})} />
                        <TextField fullWidth multiline rows={4} label="Overview" value={data.overview} onChange={(e) => setData({...data, overview: e.target.value})} />
                    </Stack>
                </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>2. Objectives, Knowledge & Skills</Typography>
                    <Stack spacing={3}>
                        <ListManager label="Objectives of the course" list={data.objectives} onAdd={() => addListItem('objectives')} onChange={(i,v) => handleListChange('objectives',i,v)} onRemove={(i)=>removeListItem('objectives',i)} />
                        <ListManager label="Knowledge gained" list={data.knowledge} onAdd={() => addListItem('knowledge')} onChange={(i,v) => handleListChange('knowledge',i,v)} onRemove={(i)=>removeListItem('knowledge',i)} />
                        <ListManager label="Skills and Competencies" list={data.skills_competencies} onAdd={() => addListItem('skills_competencies')} onChange={(i,v) => handleListChange('skills_competencies',i,v)} onRemove={(i)=>removeListItem('skills_competencies',i)} />
                    </Stack>
                </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>3. Target Audience & Topics</Typography>
                    <Stack spacing={3}>
                        <ListManager label="Who is this course for?" list={data.target_audience} onAdd={() => addListItem('target_audience')} onChange={(i,v) => handleListChange('target_audience',i,v)} onRemove={(i)=>removeListItem('target_audience',i)} />
                        <ListManager label="Topics covered" list={data.topics} onAdd={() => addListItem('topics')} onChange={(i,v) => handleListChange('topics',i,v)} onRemove={(i)=>removeListItem('topics',i)} />
                    </Stack>
                </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>4. Logistics</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}><TextField fullWidth label="Duration" placeholder="e.g. 8 Weeks" value={data.duration_tuition_fee} onChange={(e) => setData({...data, duration_tuition_fee: e.target.value})} /></Grid>
                        <Grid item xs={12} md={4}><TextField fullWidth label="Number of Sessions" type="number" value={data.number_of_sessions} onChange={(e) => setData({...data, number_of_sessions: e.target.value})} /></Grid>
                        <Grid item xs={12} md={4}><TextField fullWidth label="Language" value={data.language} onChange={(e) => setData({...data, language: e.target.value})} /></Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Stack>
    );

    // --- ACADEMIC PROGRAM FORM LAYOUT ---
    const AcademicProgramForm = () => (
        <Stack spacing={4}>
            <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '6px solid #1a237e' }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>1. Programme Identity</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <TextField select fullWidth label="Type of Degree" value={data.degree_type} onChange={(e) => setData({...data, degree_type: e.target.value})}>
                                <MenuItem value="MSC">M.Sc</MenuItem>
                                <MenuItem value="MED">M.Ed</MenuItem>
                                <MenuItem value="MBA">MBA</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={8}><TextField fullWidth label="Name" value={data.name} onChange={(e) => setData({...data, name: e.target.value})} /></Grid>
                        <Grid item xs={12}><TextField fullWidth multiline rows={3} label="About The Programme" value={data.about_programme} onChange={(e) => setData({...data, about_programme: e.target.value})} /></Grid>
                        <Grid item xs={12}><ListManager label="Objectives of the programme" list={data.objectives} onAdd={() => addListItem('objectives')} onChange={(i,v) => handleListChange('objectives',i,v)} onRemove={(i)=>removeListItem('objectives',i)} /></Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Card variant="outlined">
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>2. Structure & Assessment</Typography>
                    <Stack spacing={3}>
                        <TextField fullWidth multiline rows={5} label="Program Structure (Markdown)" value={data.program_structure} onChange={(e) => setData({...data, program_structure: e.target.value})} />
                        <TextField fullWidth multiline rows={2} label="Assessment" value={data.assessment_details} onChange={(e) => setData({...data, assessment_details: e.target.value})} />
                    </Stack>
                </CardContent>
            </Card>

            <Card variant="outlined" sx={{ bgcolor: '#f8f9fa' }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>3. Individual Course Modules</Typography>
                    {data.modules?.map((mod, idx) => (
                        <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#fff' }}>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField fullWidth label="Course Name" size="small" value={mod.name} onChange={(e) => handleModuleChange(idx, 'name', e.target.value)} />
                                    <IconButton color="error" onClick={() => setData({...data, modules: data.modules.filter((_, i) => i !== idx)})}><DeleteIcon /></IconButton>
                                </Box>
                                <TextField fullWidth multiline rows={2} label="Description" size="small" value={mod.description} onChange={(e) => handleModuleChange(idx, 'description', e.target.value)} />
                            </Stack>
                        </Paper>
                    ))}
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setData({...data, modules: [...data.modules, {name: '', description: ''}]})}>Add Module</Button>
                </CardContent>
            </Card>

            <Card variant="outlined">
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>4. Requirements & Career</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}><ListManager label="Unique features" list={data.unique_features} onAdd={() => addListItem('unique_features')} onChange={(i,v) => handleListChange('unique_features',i,v)} onRemove={(i)=>removeListItem('unique_features',i)} /></Grid>
                        <Grid item xs={12} md={6}><ListManager label="Admission Requirements" list={data.admission_requirements} onAdd={() => addListItem('admission_requirements')} onChange={(i,v) => handleListChange('admission_requirements',i,v)} onRemove={(i)=>removeListItem('admission_requirements',i)} /></Grid>
                        <Grid item xs={12} md={6}><TextField fullWidth label="Teaching and Learning" value={data.teaching_learning} onChange={(e) => setData({...data, teaching_learning: e.target.value})} /></Grid>
                        <Grid item xs={12} md={6}><TextField fullWidth label="Who can take this programme?" value={data.target_audience} onChange={(e) => setData({...data, target_audience: e.target.value})} /></Grid>
                        <Grid item xs={12} md={6}><TextField fullWidth label="Admission Test" value={data.admission_test_details} onChange={(e) => setData({...data, admission_test_details: e.target.value})} /></Grid>
                        <Grid item xs={12} md={6}><TextField fullWidth label="Duration & Tuition Fee" value={data.duration_tuition_fee} onChange={(e) => setData({...data, duration_tuition_fee: e.target.value})} /></Grid>
                        <Grid item xs={12}><TextField fullWidth label="Career Prospects" value={data.career_prospects} onChange={(e) => setData({...data, career_prospects: e.target.value})} /></Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Stack>
    );

    return (
        <Box sx={{ pb: 10 }}>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            <form onSubmit={submit}>
                {data.program_type === 'POSTGRAD' ? <AcademicProgramForm /> : <ShortCourseForm />}
                <button type="submit" id="submit-btn" style={{ display: 'none' }} />
            </form>
        </Box>
    );
};

// --- Reusable List Manager ---
const ListManager = ({ label, list, onAdd, onChange, onRemove }) => (
    <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#666' }}>{label}</Typography>
        {list?.map((item, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField fullWidth size="small" placeholder="Enter item..." value={item} onChange={(e) => onChange(i, e.target.value)} />
                <IconButton color="error" size="small" onClick={() => onRemove(i)}><DeleteIcon /></IconButton>
            </Box>
        ))}
        <Button size="small" startIcon={<AddIcon />} onClick={onAdd} sx={{ textTransform: 'none' }}>Add to {label}</Button>
    </Box>
);

export default ProgramEditor;