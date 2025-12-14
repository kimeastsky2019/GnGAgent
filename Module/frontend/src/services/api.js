import axios from 'axios'

const API_BASE_URLS = {
  demand: '/api/demand',
  supply: '/api/supply',
  matching: '/api/matching',
  scenarios: '/api/scenarios',
}

// Create axios instances for each service
const demandAPI = axios.create({
  baseURL: API_BASE_URLS.demand,
  headers: {
    'Content-Type': 'application/json',
  },
})

const supplyAPI = axios.create({
  baseURL: API_BASE_URLS.supply,
  headers: {
    'Content-Type': 'application/json',
  },
})

const matchingAPI = axios.create({
  baseURL: API_BASE_URLS.matching,
  headers: {
    'Content-Type': 'application/json',
  },
})

const scenariosAPI = axios.create({
  baseURL: API_BASE_URLS.scenarios,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Demand Analysis API
export const demandService = {
  getDataSources: () => demandAPI.get('/data-sources'),
  addDataSource: (data) => {
    if (data.type === 'csv') {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('name', data.name)
      formData.append('description', data.description || '')
      formData.append('type', 'csv')
      return demandAPI.post('/data-sources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    } else {
      return demandAPI.post('/data-sources', data)
    }
  },
  getDataSource: (id) => demandAPI.get(`/data-sources/${id}`),
  deleteDataSource: (id) => demandAPI.delete(`/data-sources/${id}`),
  fetchData: (id) => demandAPI.post(`/data-sources/${id}/fetch`),
  extractMetadata: (id) => demandAPI.post(`/data-sources/${id}/metadata`),
  analyze: (id, config) => demandAPI.post(`/data-sources/${id}/analyze`, config),
  forecast: (id, config) => demandAPI.post(`/data-sources/${id}/forecast`, config),
  detectAnomalies: (id, config) => demandAPI.post(`/data-sources/${id}/anomalies`, config),
  generateEDA: (id) => demandAPI.post(`/data-sources/${id}/eda`),
  getModels: () => demandAPI.get('/models'),
}

// Supply Analysis API
export const supplyService = {
  getResources: () => supplyAPI.get('/resources'),
  addResource: (data) => {
    if (data.type === 'csv') {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('name', data.name)
      formData.append('description', data.description || '')
      formData.append('type', 'csv')
      if (data.weather_api_url) {
        formData.append('weather_api_url', data.weather_api_url)
        formData.append('weather_api_config', JSON.stringify(data.weather_api_config || {}))
      }
      return supplyAPI.post('/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    } else {
      return supplyAPI.post('/resources', data)
    }
  },
  getResource: (id) => supplyAPI.get(`/resources/${id}`),
  deleteResource: (id) => supplyAPI.delete(`/resources/${id}`),
  fetchData: (id, includeWeather = false) => 
    supplyAPI.post(`/resources/${id}/fetch`, { include_weather: includeWeather }),
  getWeatherData: (id) => supplyAPI.get(`/resources/${id}/weather`),
  extractMetadata: (id, includeWeather = true) => 
    supplyAPI.post(`/resources/${id}/metadata`, { include_weather: includeWeather }),
  analyze: (id, config) => supplyAPI.post(`/resources/${id}/analyze`, config),
  forecast: (id, config) => supplyAPI.post(`/resources/${id}/forecast`, config),
  detectAnomalies: (id, config) => supplyAPI.post(`/resources/${id}/anomalies`, config),
  generateEDA: (id, includeWeather = true) => 
    supplyAPI.post(`/resources/${id}/eda`, { include_weather: includeWeather }),
  getModels: () => supplyAPI.get('/models'),
}

// Matching API
export const matchingService = {
  getCurrentMatching: () => matchingAPI.get('/matching/current'),
  getTimeseries: (hours = 24) => matchingAPI.get(`/matching/timeseries?hours=${hours}`),
  getRecommendations: () => matchingAPI.get('/matching/recommendations'),
  sendChatbotMessage: (message, context = {}) => 
    matchingAPI.post('/chatbot/message', { message, context }),
  getOntology: () => matchingAPI.get('/chatbot/ontology'),
}

// Scenarios API
export const scenariosService = {
  getTemplates: () => scenariosAPI.get('/scenarios/templates'),
  simulateScenario: (config) => scenariosAPI.post('/scenarios/simulate', config),
  findOptimal: (scenarios) => scenariosAPI.post('/scenarios/optimal', { scenarios }),
  getResults: (scenarioId) => scenariosAPI.get(`/scenarios/results/${scenarioId}`),
}

export default {
  demand: demandService,
  supply: supplyService,
  matching: matchingService,
  scenarios: scenariosService,
}

