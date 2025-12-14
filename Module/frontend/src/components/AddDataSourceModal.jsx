import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tabs,
  Tab,
  Box,
  Typography,
} from '@mui/material'
import { demandService, supplyService } from '../services/api'

function AddDataSourceModal({ open, onClose, onSuccess, type = 'demand' }) {
  const [activeTab, setActiveTab] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'csv',
    file: null,
    api_url: '',
    api_method: 'GET',
    api_headers: '',
    api_params: '',
    weather_api_url: '',
    weather_api_headers: '',
    weather_api_params: '',
  })
  const [loading, setLoading] = useState(false)

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    setFormData({ ...formData, type: newValue === 0 ? 'csv' : 'api' })
  }

  const handleChange = (field) => (event) => {
    if (field === 'file') {
      setFormData({ ...formData, file: event.target.files[0] })
    } else {
      setFormData({ ...formData, [field]: event.target.value })
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const service = type === 'demand' ? demandService : supplyService
      
      if (formData.type === 'csv') {
        const data = {
          type: 'csv',
          name: formData.name,
          description: formData.description,
          file: formData.file,
        }
        
        if (type === 'supply' && formData.weather_api_url) {
          let weatherHeaders = {}
          let weatherParams = {}
          try {
            if (formData.weather_api_headers) {
              weatherHeaders = JSON.parse(formData.weather_api_headers)
            }
            if (formData.weather_api_params) {
              weatherParams = JSON.parse(formData.weather_api_params)
            }
          } catch (e) {
            alert('Invalid JSON in weather API configuration')
            setLoading(false)
            return
          }
          
          data.weather_api_url = formData.weather_api_url
          data.weather_api_config = {
            headers: weatherHeaders,
            params: weatherParams,
          }
        }
        
        await service.addDataSource(data)
      } else {
        let apiHeaders = {}
        let apiParams = {}
        try {
          if (formData.api_headers) {
            apiHeaders = JSON.parse(formData.api_headers)
          }
          if (formData.api_params) {
            apiParams = JSON.parse(formData.api_params)
          }
        } catch (e) {
          alert('Invalid JSON in API configuration')
          setLoading(false)
          return
        }
        
        const data = {
          type: 'api',
          name: formData.name,
          description: formData.description,
          api_url: formData.api_url,
          api_config: {
            method: formData.api_method,
            headers: apiHeaders,
            params: apiParams,
          },
        }
        
        if (type === 'supply' && formData.weather_api_url) {
          let weatherHeaders = {}
          let weatherParams = {}
          try {
            if (formData.weather_api_headers) {
              weatherHeaders = JSON.parse(formData.weather_api_headers)
            }
            if (formData.weather_api_params) {
              weatherParams = JSON.parse(formData.weather_api_params)
            }
          } catch (e) {
            alert('Invalid JSON in weather API configuration')
            setLoading(false)
            return
          }
          
          data.weather_api_url = formData.weather_api_url
          data.weather_api_config = {
            headers: weatherHeaders,
            params: weatherParams,
          }
        }
        
        await service.addDataSource(data)
      }
      
      onSuccess()
      onClose()
      setFormData({
        name: '',
        description: '',
        type: 'csv',
        file: null,
        api_url: '',
        api_method: 'GET',
        api_headers: '',
        api_params: '',
        weather_api_url: '',
        weather_api_headers: '',
        weather_api_params: '',
      })
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add {type === 'demand' ? 'Data Source' : 'Energy Resource'}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Name"
          required
          value={formData.name}
          onChange={handleChange('name')}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Description"
          multiline
          rows={2}
          value={formData.description}
          onChange={handleChange('description')}
          margin="normal"
        />
        
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mt: 2 }}>
          <Tab label="CSV File" />
          <Tab label="IoT API" />
        </Tabs>
        
        <Box sx={{ mt: 2 }}>
          {activeTab === 0 ? (
            <>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleChange('file')}
                style={{ marginTop: 16 }}
              />
              {type === 'supply' && (
                <>
                  <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'primary.main' }}>
                    Weather Data Integration (Optional)
                  </Typography>
                  <TextField
                    fullWidth
                    label="Weather API URL"
                    value={formData.weather_api_url}
                    onChange={handleChange('weather_api_url')}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Weather API Headers (JSON)"
                    multiline
                    rows={2}
                    value={formData.weather_api_headers}
                    onChange={handleChange('weather_api_headers')}
                    margin="normal"
                    placeholder='{"Authorization": "Bearer token"}'
                  />
                  <TextField
                    fullWidth
                    label="Weather API Parameters (JSON)"
                    multiline
                    rows={2}
                    value={formData.weather_api_params}
                    onChange={handleChange('weather_api_params')}
                    margin="normal"
                    placeholder='{"lat": 37.5, "lon": 127.0}'
                  />
                </>
              )}
            </>
          ) : (
            <>
              <TextField
                fullWidth
                label="API URL"
                required
                value={formData.api_url}
                onChange={handleChange('api_url')}
                margin="normal"
              />
              <TextField
                fullWidth
                select
                label="HTTP Method"
                value={formData.api_method}
                onChange={handleChange('api_method')}
                margin="normal"
                SelectProps={{ native: true }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </TextField>
              <TextField
                fullWidth
                label="Headers (JSON)"
                multiline
                rows={2}
                value={formData.api_headers}
                onChange={handleChange('api_headers')}
                margin="normal"
                placeholder='{"Authorization": "Bearer token"}'
              />
              <TextField
                fullWidth
                label="Parameters (JSON)"
                multiline
                rows={2}
                value={formData.api_params}
                onChange={handleChange('api_params')}
                margin="normal"
                placeholder='{"param1": "value1"}'
              />
              {type === 'supply' && (
                <>
                  <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'primary.main' }}>
                    Weather Data Integration (Optional)
                  </Typography>
                  <TextField
                    fullWidth
                    label="Weather API URL"
                    value={formData.weather_api_url}
                    onChange={handleChange('weather_api_url')}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Weather API Headers (JSON)"
                    multiline
                    rows={2}
                    value={formData.weather_api_headers}
                    onChange={handleChange('weather_api_headers')}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Weather API Parameters (JSON)"
                    multiline
                    rows={2}
                    value={formData.weather_api_params}
                    onChange={handleChange('weather_api_params')}
                    margin="normal"
                  />
                </>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Adding...' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddDataSourceModal

