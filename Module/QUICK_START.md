# NaonoGrid Quick Start Guide

## Frontend Setup (React)

### Step 1: Install Node.js

If you don't have Node.js installed:

**macOS:**
```bash
brew install node
```

**Or download from:**
https://nodejs.org/ (LTS version recommended)

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 3: Start Frontend Development Server

```bash
npm run dev
```

Or use the startup script:
```bash
./start.sh
```

The frontend will be available at: **http://localhost:3000**

## Backend Services Setup

### Start All Backend Services

You need to start the following services in separate terminals:

#### 1. Demand Analysis Service (Port 5002)
```bash
cd demand_analysis
python app.py
```

#### 2. Supply Analysis Service (Port 5001)
```bash
cd supply_analysis
python app.py
```

#### 3. Matching Service (Port 5003)
```bash
cd digitaltwin_matching
python matching_service.py
```

#### 4. Scenario Service (Port 5004)
```bash
cd digitaltwin_matching
python scenario_service.py
```

## Full System Startup

### Option 1: Manual (Recommended for Development)

1. **Terminal 1**: Start Demand Analysis
   ```bash
   cd demand_analysis && python app.py
   ```

2. **Terminal 2**: Start Supply Analysis
   ```bash
   cd supply_analysis && python app.py
   ```

3. **Terminal 3**: Start Matching Service
   ```bash
   cd digitaltwin_matching && python matching_service.py
   ```

4. **Terminal 4**: Start Scenario Service
   ```bash
   cd digitaltwin_matching && python scenario_service.py
   ```

5. **Terminal 5**: Start Frontend
   ```bash
   cd frontend && npm run dev
   ```

### Option 2: Using Docker (Future)

Docker Compose configuration will be added for easy startup.

## Access the Application

Once all services are running:

- **Frontend**: http://localhost:3000
- **Demand Analysis API**: http://localhost:5002/api
- **Supply Analysis API**: http://localhost:5001/api
- **Matching API**: http://localhost:5003/api
- **Scenario API**: http://localhost:5004/api

## Troubleshooting

### Frontend won't start
- Check if Node.js is installed: `node --version`
- Check if npm is installed: `npm --version`
- Install dependencies: `cd frontend && npm install`

### API connection errors
- Make sure all backend services are running
- Check if ports are not already in use
- Verify proxy configuration in `vite.config.js`

### Port conflicts
- Frontend: Change port in `vite.config.js`
- Backend: Change `PORT` environment variable or in `app.py`

## Next Steps

1. Open http://localhost:3000 in your browser
2. Navigate to "Demand Analysis" to add data sources
3. Navigate to "Supply Analysis" to add energy resources
4. Navigate to "Demand-Supply Matching" to see real-time matching
5. Navigate to "Scenario Simulation" to run simulations

Enjoy using NaonoGrid! ⚡

