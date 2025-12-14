#!/bin/bash

# NaonoGrid Deployment Script for GCP Compute Engine

set -e

echo "⚡ NaonoGrid Deployment Script"
echo "=============================="
echo ""

PROJECT_DIR="$HOME/naonogrid"
SERVICES_DIR="$PROJECT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

print_status "Installing Python dependencies..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
print_status "Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies for each service
if [ -f "demand_analysis/requirements.txt" ]; then
    print_status "Installing demand_analysis dependencies..."
    pip install -r demand_analysis/requirements.txt
fi

if [ -f "supply_analysis/requirements.txt" ]; then
    print_status "Installing supply_analysis dependencies..."
    pip install -r supply_analysis/requirements.txt
fi

if [ -f "multi_mcp_system/requirements.txt" ]; then
    print_status "Installing multi_mcp_system dependencies..."
    pip install -r multi_mcp_system/requirements.txt
fi

# Install common dependencies
print_status "Installing common Python packages..."
pip install flask flask-cors pandas numpy scikit-learn requests || true

# Frontend setup
if [ -d "frontend" ]; then
    print_status "Setting up frontend..."
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing Node.js dependencies..."
        npm install
    fi
    
    print_status "Building frontend..."
    npm run build
    
    cd ..
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p "$PROJECT_DIR/demand_analysis/uploads"
mkdir -p "$PROJECT_DIR/demand_analysis/results"
mkdir -p "$PROJECT_DIR/supply_analysis/uploads"
mkdir -p "$PROJECT_DIR/supply_analysis/results"
mkdir -p "$PROJECT_DIR/digitaltwin_matching/results"

print_status "Deployment preparation completed!"
echo ""
print_status "To start services, run:"
echo "  ./start_services.sh"
echo ""

