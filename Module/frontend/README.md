# NaonoGrid Frontend - React Application

Modern React frontend for the NaonoGrid Energy Management System.

## Features

- ✅ **Demand Analysis**: Data source management, analysis, forecasting, and anomaly detection
- ✅ **Supply Analysis**: Energy resource management with weather data integration
- ✅ **Demand-Supply Matching**: Real-time matching visualization and control recommendations
- ✅ **Scenario Simulation**: Digital twin scenario simulation and optimal matching discovery
- ✅ **Modern UI**: Material-UI components with responsive design
- ✅ **Real-time Updates**: Live data updates and interactive visualizations

## Technology Stack

- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Material-UI (MUI)**: Component library
- **Axios**: HTTP client
- **Plotly.js**: Interactive charts
- **Vite**: Fast build tool

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Build

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Layout.jsx
│   │   ├── DataSourceCard.jsx
│   │   └── AddDataSourceModal.jsx
│   ├── pages/            # Page components
│   │   ├── HomePage.jsx
│   │   ├── DemandAnalysisPage.jsx
│   │   ├── SupplyAnalysisPage.jsx
│   │   ├── MatchingPage.jsx
│   │   └── ScenarioPage.jsx
│   ├── services/         # API services
│   │   └── api.js
│   ├── styles/           # Global styles
│   │   └── index.css
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## API Integration

The frontend connects to backend services via proxy configuration:

- **Demand Analysis**: `http://localhost:5002`
- **Supply Analysis**: `http://localhost:5001`
- **Matching Service**: `http://localhost:5003`
- **Scenario Service**: `http://localhost:5004`

## Features by Page

### Home Page
- Overview of all system features
- Quick navigation to each module

### Demand Analysis
- Add data sources (CSV or IoT API)
- View data sources as cards
- Run analysis with model selection
- View analysis results
- Extract metadata

### Supply Analysis
- Add energy resources (CSV or IoT API)
- Weather data integration
- Run analysis with weather data
- View analysis results

### Demand-Supply Matching
- Real-time matching status
- Time series visualization
- Control recommendations
- Ontology chatbot

### Scenario Simulation
- Scenario templates
- Custom scenario configuration
- Simulation execution
- Optimal scenario discovery
- Results visualization

## Development Notes

- All components use functional components with hooks
- Material-UI theme is configured in `main.jsx`
- API services are centralized in `services/api.js`
- Responsive design for mobile, tablet, and desktop
- Error handling and loading states throughout

## Next Steps

- [ ] Add authentication
- [ ] Implement WebSocket for real-time updates
- [ ] Add more chart types
- [ ] Enhance error handling
- [ ] Add unit tests
- [ ] Add E2E tests

