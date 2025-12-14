import React from 'react'
import { Box, Typography, Grid, Card, CardContent, CardActions, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import ScienceIcon from '@mui/icons-material/Science'

function HomePage() {
  const navigate = useNavigate()

  const features = [
    {
      title: 'Demand Analysis',
      description: 'Analyze energy demand patterns, detect anomalies, and generate forecasts',
      icon: <TrendingUpIcon sx={{ fontSize: 48, color: '#667eea' }} />,
      path: '/demand',
      color: '#667eea',
    },
    {
      title: 'Supply Analysis',
      description: 'Monitor energy supply, integrate weather data, and optimize resources',
      icon: <TrendingDownIcon sx={{ fontSize: 48, color: '#764ba2' }} />,
      path: '/supply',
      color: '#764ba2',
    },
    {
      title: 'Demand-Supply Matching',
      description: 'Real-time matching visualization and intelligent control recommendations',
      icon: <CompareArrowsIcon sx={{ fontSize: 48, color: '#f59e0b' }} />,
      path: '/matching',
      color: '#f59e0b',
    },
    {
      title: 'Scenario Simulation',
      description: 'Simulate various scenarios and find optimal matching configurations',
      icon: <ScienceIcon sx={{ fontSize: 48, color: '#10b981' }} />,
      path: '/scenarios',
      color: '#10b981',
    },
  ]

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
        Welcome to NaonoGrid
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Comprehensive Energy Management System with AI-Powered Analysis
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {features.map((feature) => (
          <Grid item xs={12} sm={6} md={3} key={feature.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                },
              }}
              onClick={() => navigate(feature.path)}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                {feature.icon}
                <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 2 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate(feature.path)}
                  sx={{ backgroundColor: feature.color }}
                >
                  Explore
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default HomePage

