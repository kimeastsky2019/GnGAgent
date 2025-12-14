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
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { matchingService } from '../services/api'
// Plotly will be loaded dynamically

function MatchingPage() {
  const [matching, setMatching] = useState(null)
  const [timeseries, setTimeseries] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [chatbotOpen, setChatbotOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [ontology, setOntology] = useState(null)

  useEffect(() => {
    loadMatching()
    loadRecommendations()
    loadOntology()
    const interval = setInterval(() => {
      loadMatching()
      loadRecommendations()
    }, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (timeseries.length > 0 && window.Plotly) {
      const chartElement = document.getElementById('timeseries-chart')
      if (chartElement) {
        const demandData = {
          x: timeseries.map((t) => new Date(t.timestamp)),
          y: timeseries.map((t) => t.demand?.total || 0),
          name: 'Demand',
          type: 'scatter',
          mode: 'lines',
        }
        const supplyData = {
          x: timeseries.map((t) => new Date(t.timestamp)),
          y: timeseries.map((t) => t.supply?.total || 0),
          name: 'Supply',
          type: 'scatter',
          mode: 'lines',
        }
        window.Plotly.newPlot(
          chartElement,
          [demandData, supplyData],
          {
            title: 'Demand vs Supply Over Time',
            xaxis: { title: 'Time' },
            yaxis: { title: 'Power (kW)' },
            height: 400,
          }
        )
      }
    }
  }, [timeseries])

  const loadMatching = async () => {
    try {
      const response = await matchingService.getCurrentMatching()
      if (response.data.success) {
        setMatching(response.data.matching)
      }
    } catch (err) {
      console.error('Error loading matching:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadTimeseries = async () => {
    try {
      const response = await matchingService.getTimeseries(24)
      if (response.data.success) {
        setTimeseries(response.data.timeseries)
      }
    } catch (err) {
      console.error('Error loading timeseries:', err)
    }
  }

  const loadRecommendations = async () => {
    try {
      const response = await matchingService.getRecommendations()
      if (response.data.success) {
        setRecommendations(response.data.recommendations)
      }
    } catch (err) {
      console.error('Error loading recommendations:', err)
    }
  }

  const loadOntology = async () => {
    try {
      const response = await matchingService.getOntology()
      if (response.data.success) {
        setOntology(response.data.ontology)
      }
    } catch (err) {
      console.error('Error loading ontology:', err)
    }
  }

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return

    const userMessage = chatMessage
    setChatMessage('')
    setChatHistory([...chatHistory, { role: 'user', message: userMessage }])

    try {
      const response = await matchingService.sendChatbotMessage(userMessage)
      if (response.data.success) {
        setChatHistory([
          ...chatHistory,
          { role: 'user', message: userMessage },
          { role: 'assistant', message: response.data.response.message },
        ])
        loadOntology()
      }
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  useEffect(() => {
    if (matching) {
      loadTimeseries()
    }
  }, [matching])

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Demand-Supply Matching
        </Typography>
        <Button variant="contained" onClick={() => setChatbotOpen(true)}>
          Ontology Chatbot
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : matching ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Real-time Matching Status
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Total Demand
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {matching.demand?.total?.toFixed(2) || 0} kW
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Total Supply
                      </Typography>
                      <Typography variant="h5" color="secondary">
                        {matching.supply?.total?.toFixed(2) || 0} kW
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Balance
                      </Typography>
                      <Typography
                        variant="h5"
                        color={matching.balance >= 0 ? 'success.main' : 'error.main'}
                      >
                        {matching.balance?.toFixed(2) || 0} kW
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Matching Ratio
                      </Typography>
                      <Typography variant="h5">
                        {(matching.matching_ratio * 100).toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>

            {timeseries.length > 0 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Time Series Matching
                </Typography>
                <Box
                  id="timeseries-chart"
                  sx={{ width: '100%', height: 400 }}
                />
                {!window.Plotly && (
                  <Alert severity="info">
                    Loading chart library...
                  </Alert>
                )}
              </Paper>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Control Recommendations
              </Typography>
              {recommendations.length > 0 ? (
                <List>
                  {recommendations.map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={rec.message}
                        secondary={rec.action}
                        primaryTypographyProps={{
                          color: rec.type === 'warning' ? 'error' : rec.type === 'success' ? 'success' : 'info',
                        }}
                      />
                      <Chip
                        label={rec.priority}
                        size="small"
                        color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'default'}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recommendations available
                </Typography>
              )}
            </Paper>

            {ontology && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Ontology Summary
                </Typography>
                <Typography variant="body2">
                  Demand Assets: {ontology.demand_assets?.length || 0}
                </Typography>
                <Typography variant="body2">
                  Supply Assets: {ontology.supply_assets?.length || 0}
                </Typography>
                <Typography variant="body2">
                  Rules: {ontology.rules?.length || 0}
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info">No matching data available</Alert>
      )}

      <Dialog open={chatbotOpen} onClose={() => setChatbotOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ontology Chatbot</DialogTitle>
        <DialogContent>
          <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 2 }}>
            {chatHistory.map((chat, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: chat.role === 'user' ? 'primary.light' : 'grey.100',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {chat.role === 'user' ? 'You' : 'Bot'}
                </Typography>
                <Typography variant="body1">{chat.message}</Typography>
              </Box>
            ))}
          </Box>
          <TextField
            fullWidth
            label="Message"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendChatMessage()
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChatbotOpen(false)}>Close</Button>
          <Button onClick={sendChatMessage} variant="contained">
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MatchingPage

