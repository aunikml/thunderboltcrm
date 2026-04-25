import React from 'react';
import { Grid, Card, Stack, Box, Typography } from '@mui/material';
import { Groups, Campaign, CheckCircle, Psychology } from '@mui/icons-material';

const StatCard = ({ title, value, type }) => {
    const getIcon = () => {
        switch(type) {
            case 'leads': return <Groups color="primary" />;
            case 'campaigns': return <Campaign color="secondary" />;
            case 'converted': return <CheckCircle sx={{ color: '#2e7d32' }} />;
            case 'ai': return <Psychology sx={{ color: '#5e35b1' }} />;
            default: return <Groups />;
        }
    };

    return (
        <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, borderRadius: 5, border: '1px solid #eef0f2', boxShadow: 'none' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 1.5, bgcolor: '#f8f9fa', borderRadius: 3, display: 'flex' }}>
                        {getIcon()}
                    </Box>
                    <Box>
                        <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                            {title}
                        </Typography>
                        <Typography variant="h5" fontWeight={900}>
                            {value}
                        </Typography>
                    </Box>
                </Stack>
            </Card>
        </Grid>
    );
};

export default StatCard;