import React from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import InfoIcon from '@mui/icons-material/Info'

function DataSourceCard({ source, onAnalyze, onViewMetadata, onDelete }) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2" color="primary" fontWeight={600}>
            {source.name}
          </Typography>
          <Chip
            label={source.type.toUpperCase()}
            size="small"
            color={source.type === 'csv' ? 'primary' : 'secondary'}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {source.description || 'No description'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Created: {new Date(source.created_at).toLocaleDateString()}
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          variant="contained"
          startIcon={<AnalyticsIcon />}
          onClick={() => onAnalyze(source.id)}
        >
          Analyze
        </Button>
        <Button
          size="small"
          startIcon={<InfoIcon />}
          onClick={() => onViewMetadata(source.id)}
        >
          Metadata
        </Button>
        <IconButton
          size="small"
          color="error"
          onClick={() => onDelete(source.id)}
          sx={{ ml: 'auto' }}
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  )
}

export default DataSourceCard

