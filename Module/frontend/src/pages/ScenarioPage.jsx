import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ScienceIcon from '@mui/icons-material/Science'
import { scenariosService } from '../services/api'

function ScenarioPage() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [results, setResults] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [customConfig, setCustomConfig] = useState({
    name: '',
    duration_hours: 24,
    time_step_minutes: 30,
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await scenariosService.getTemplates()
      if (response.data.success) {
        setTemplates(response.data.templates)
      }
    } catch (err) {
      console.error('Error loading templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSimulate = async (template) => {
    setSelectedTemplate(template)
    setCustomConfig({
      name: template.name,
      duration_hours: template.duration_hours || 24,
      time_step_minutes: template.time_step_minutes || 30,
    })
    setDialogOpen(true)
  }

  const runSimulation = async () => {
    try {
      setSimulating(true)
      const config = {
        ...selectedTemplate,
        ...customConfig,
      }
      const response = await scenariosService.simulateScenario(config)
      if (response.data.success) {
        setResults(response.data.result)
        setDialogOpen(false)
      }
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSimulating(false)
    }
  }

  const findOptimal = async () => {
    try {
      setSimulating(true)
      const scenarios = templates.slice(0, 3).map((t) => ({
        ...t,
        name: t.name,
        duration_hours: 24,
        time_step_minutes: 30,
      }))
      const response = await scenariosService.findOptimal(scenarios)
      if (response.data.success) {
        setResults(response.data.result)
      }
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSimulating(false)
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Scenario Simulation
        </Typography>
        <Button variant="contained" color="secondary" onClick={findOptimal} disabled={simulating}>
          {simulating ? <CircularProgress size={20} /> : 'Find Optimal Scenario'}
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <ScienceIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">{template.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {template.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Duration: {template.duration_hours || 24} hours
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => handleSimulate(template)}
                    >
                      Simulate
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {results && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Simulation Results: {results.scenario_name}
              </Typography>
              {results.metrics && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Matching Efficiency
                        </Typography>
                        <Typography variant="h5">
                          {results.metrics.matching_efficiency?.toFixed(1) || 0}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Renewable Ratio
                        </Typography>
                        <Typography variant="h5">
                          {results.metrics.renewable_ratio?.toFixed(1) || 0}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Stability Score
                        </Typography>
                        <Typography variant="h5">
                          {results.metrics.stability_score?.toFixed(1) || 0}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Optimal Matching Score
                        </Typography>
                        <Typography variant="h5" color="primary">
                          {results.metrics.optimal_matching_score?.toFixed(1) || 0}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Paper>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure Scenario</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Scenario Name"
            value={customConfig.name}
            onChange={(e) => setCustomConfig({ ...customConfig, name: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Duration (hours)</InputLabel>
            <Select
              value={customConfig.duration_hours}
              onChange={(e) => setCustomConfig({ ...customConfig, duration_hours: e.target.value })}
            >
              <MenuItem value={6}>6 hours</MenuItem>
              <MenuItem value={12}>12 hours</MenuItem>
              <MenuItem value={24}>24 hours</MenuItem>
              <MenuItem value={48}>48 hours</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Time Step (minutes)</InputLabel>
            <Select
              value={customConfig.time_step_minutes}
              onChange={(e) => setCustomConfig({ ...customConfig, time_step_minutes: e.target.value })}
            >
              <MenuItem value={15}>15 minutes</MenuItem>
              <MenuItem value={30}>30 minutes</MenuItem>
              <MenuItem value={60}>60 minutes</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={runSimulation} variant="contained" disabled={simulating}>
            {simulating ? <CircularProgress size={20} /> : 'Run Simulation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ScenarioPage

