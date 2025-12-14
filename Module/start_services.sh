#!/bin/bash

# NaonoGrid Services Startup Script

set -e

PROJECT_DIR="$HOME/naonogrid"
LOG_DIR="$PROJECT_DIR/logs"
PID_DIR="$PROJECT_DIR/pids"

mkdir -p "$LOG_DIR"
mkdir -p "$PID_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to start a service
start_service() {
    local service_name=$1
    local service_dir=$2
    local service_file=$3
    local port=$4
    
    if [ -f "$PID_DIR/$service_name.pid" ]; then
        local pid=$(cat "$PID_DIR/$service_name.pid")
        if ps -p $pid > /dev/null 2>&1; then
            print_warning "$service_name is already running (PID: $pid)"
            return
        else
            rm -f "$PID_DIR/$service_name.pid"
        fi
    fi
    
    print_status "Starting $service_name on port $port..."
    cd "$PROJECT_DIR/$service_dir"
    
    # Activate virtual environment if it exists
    if [ -f "$PROJECT_DIR/venv/bin/activate" ]; then
        source "$PROJECT_DIR/venv/bin/activate"
        PYTHON_CMD="$PROJECT_DIR/venv/bin/python"
    else
        PYTHON_CMD="python3"
    fi
    
    nohup $PYTHON_CMD "$service_file" > "$LOG_DIR/$service_name.log" 2>&1 &
    local pid=$!
    echo $pid > "$PID_DIR/$service_name.pid"
    
    sleep 2
    if ps -p $pid > /dev/null 2>&1; then
        print_status "$service_name started successfully (PID: $pid)"
    else
        print_error "$service_name failed to start. Check logs: $LOG_DIR/$service_name.log"
        return 1
    fi
}

# Function to stop a service
stop_service() {
    local service_name=$1
    
    if [ -f "$PID_DIR/$service_name.pid" ]; then
        local pid=$(cat "$PID_DIR/$service_name.pid")
        if ps -p $pid > /dev/null 2>&1; then
            print_status "Stopping $service_name (PID: $pid)..."
            kill $pid
            rm -f "$PID_DIR/$service_name.pid"
            print_status "$service_name stopped"
        else
            print_warning "$service_name is not running"
            rm -f "$PID_DIR/$service_name.pid"
        fi
    else
        print_warning "$service_name is not running"
    fi
}

# Main execution
case "$1" in
    start)
        print_status "Starting all NaonoGrid services..."
        
        start_service "demand_analysis" "demand_analysis" "app.py" "5002"
        start_service "supply_analysis" "supply_analysis" "app.py" "5001"
        start_service "matching_service" "digitaltwin_matching" "matching_service.py" "5003"
        start_service "scenario_service" "digitaltwin_matching" "scenario_service.py" "5004"
        
        print_status "All services started!"
        echo ""
        print_status "Service URLs:"
        echo "  - Demand Analysis: http://34.47.89.217:5002"
        echo "  - Supply Analysis: http://34.47.89.217:5001"
        echo "  - Matching Service: http://34.47.89.217:5003"
        echo "  - Scenario Service: http://34.47.89.217:5004"
        echo ""
        print_status "Check logs in: $LOG_DIR"
        ;;
    
    stop)
        print_status "Stopping all NaonoGrid services..."
        
        stop_service "scenario_service"
        stop_service "matching_service"
        stop_service "supply_analysis"
        stop_service "demand_analysis"
        
        print_status "All services stopped!"
        ;;
    
    restart)
        $0 stop
        sleep 2
        $0 start
        ;;
    
    status)
        print_status "Service Status:"
        echo ""
        
        for service in demand_analysis supply_analysis matching_service scenario_service; do
            if [ -f "$PID_DIR/$service.pid" ]; then
                local pid=$(cat "$PID_DIR/$service.pid")
                if ps -p $pid > /dev/null 2>&1; then
                    echo -e "${GREEN}✓${NC} $service is running (PID: $pid)"
                else
                    echo -e "${RED}✗${NC} $service is not running (stale PID file)"
                fi
            else
                echo -e "${RED}✗${NC} $service is not running"
            fi
        done
        ;;
    
    logs)
        if [ -z "$2" ]; then
            print_status "Available log files:"
            ls -lh "$LOG_DIR"
            echo ""
            print_status "To view a log: $0 logs <service_name>"
        else
            if [ -f "$LOG_DIR/$2.log" ]; then
                tail -f "$LOG_DIR/$2.log"
            else
                print_error "Log file not found: $LOG_DIR/$2.log"
            fi
        fi
        ;;
    
    *)
        echo "Usage: $0 {start|stop|restart|status|logs [service_name]}"
        echo ""
        echo "Services:"
        echo "  - demand_analysis"
        echo "  - supply_analysis"
        echo "  - matching_service"
        echo "  - scenario_service"
        exit 1
        ;;
esac

