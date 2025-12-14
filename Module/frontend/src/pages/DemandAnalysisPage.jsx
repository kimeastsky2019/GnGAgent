import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { demandService } from '../services/api'
import DataSourceCard from '../components/DataSourceCard'
import AddDataSourceModal from '../components/AddDataSourceModal'

function DemandAnalysisPage() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState(null)
  const [forecastingModel, setForecastingModel] = useState('RandomForest')
  const [anomalyModel, setAnomalyModel] = useState('IsolationForest')
  const [models, setModels] = useState({ forecasting: [], anomaly_detection: [] })
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState(null)

  useEffect(() => {
    loadDataSources()
    loadModels()
  }, [])

  const loadDataSources = async () => {
    try {
      setLoading(true)
      const response = await demandService.getDataSources()
      if (response.data.success) {
        setSources(response.data.sources)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadModels = async () => {
    try {
      const response = await demandService.getModels()
      if (response.data.success) {
        setModels(response.data.models)
      }
    } catch (err) {
      console.error('Error loading models:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this data source?')) return
    
    try {
      await demandService.deleteDataSource(id)
      loadDataSources()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleAnalyze = (id) => {
    setSelectedSource(id)
    setAnalysisModalOpen(true)
  }

  const handleViewMetadata = async (id) => {
    try {
      const response = await demandService.extractMetadata(id)
      if (response.data.success) {
        alert(`Metadata extracted successfully!\n\n${JSON.stringify(response.data.metadata, null, 2)}`)
      }
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const runAnalysis = async () => {
    if (!selectedSource) return
    
    try {
      setAnalyzing(true)
      const response = await demandService.analyze(selectedSource, {
        forecasting_model: forecastingModel,
        anomaly_model: anomalyModel,
      })
      
      if (response.data.success) {
        setAnalysisResults(response.data.results)
        setAnalysisModalOpen(false)
      }
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Energy Demand Analysis
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
        >
          Add Data Source
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : sources.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No data sources found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Click "Add Data Source" to get started
          </Typography>
          <Button variant="contained" onClick={() => setModalOpen(true)}>
            Add Data Source
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {sources.map((source) => (
              <Grid item xs={12} sm={6} md={4} key={source.id}>
                <DataSourceCard
                  source={source}
                  onAnalyze={handleAnalyze}
                  onViewMetadata={handleViewMetadata}
                  onDelete={handleDelete}
                />
              </Grid>
            ))}
          </Grid>

          {analysisResults && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Analysis Results
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Total Records
                  </Typography>
                  <Typography variant="h5">
                    {analysisResults.statistics?.total_records || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Anomalies Detected
                  </Typography>
                  <Typography variant="h5" color="error">
                    {analysisResults.anomalies_count || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Predictions Generated
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {analysisResults.predictions_count || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Quality Score
                  </Typography>
                  <Typography variant="h5">
                    {analysisResults.quality_report?.quality_score || 0}/100
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
        </>
      )}

      <AddDataSourceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadDataSources}
        type="demand"
      />

      <Dialog open={analysisModalOpen} onClose={() => setAnalysisModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Run Analysis</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <FormLabel component="legend">Forecasting Model</FormLabel>
            <RadioGroup
              value={forecastingModel}
              onChange={(e) => setForecastingModel(e.target.value)}
            >
              {models.forecasting.map((model) => (
                <FormControlLabel
                  key={model.id}
                  value={model.id}
                  control={<Radio />}
                  label={`${model.name} - ${model.description}`}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <FormLabel component="legend">Anomaly Detection Model</FormLabel>
            <RadioGroup
              value={anomalyModel}
              onChange={(e) => setAnomalyModel(e.target.value)}
            >
              {models.anomaly_detection.map((model) => (
                <FormControlLabel
                  key={model.id}
                  value={model.id}
                  control={<Radio />}
                  label={`${model.name} - ${model.description}`}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalysisModalOpen(false)}>Cancel</Button>
          <Button
            onClick={runAnalysis}
            variant="contained"
            disabled={analyzing}
          >
            {analyzing ? <CircularProgress size={20} /> : 'Run Analysis'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DemandAnalysisPage

