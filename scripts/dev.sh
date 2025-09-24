#!/bin/bash

# PathPilot Platform Development Server
# Starts both API and Web UI concurrently

echo "=================================================="
echo "🚀 Starting PathPilot Platform"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    kill $API_PID $UI_PID 2>/dev/null
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Set trap for cleanup on Ctrl+C
trap cleanup INT TERM

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Start PathPilot API Server
echo -e "${BLUE}Starting PathPilot API Server...${NC}"
cd api && python3 main.py &
API_PID=$!
cd ..
echo -e "${GREEN}✅ API started (PID: $API_PID)${NC}"

# Wait for API server to be ready
echo -e "${YELLOW}Waiting for API server to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API server is ready!${NC}"
        break
    fi
    sleep 1
done

# Start PathPilot Web UI
echo -e "${BLUE}Starting PathPilot Web UI...${NC}"
cd web
npm run dev &
UI_PID=$!
cd ..
echo -e "${GREEN}✅ Web UI started (PID: $UI_PID)${NC}"

# Wait for Web UI to be ready
echo -e "${YELLOW}Waiting for Web UI to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Web UI is ready!${NC}"
        break
    fi
    sleep 1
done

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 PathPilot is running!${NC}"
echo "=================================================="
echo ""
echo "📊 PathPilot API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - FHIR-compliant endpoints with MIMIC-IV data"
echo ""
echo "🏥 PathPilot Dashboard: http://localhost:3000"
echo "   - Real-time lab visualization"
echo "   - Critical value alerts"
echo "   - Trend analysis"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Wait for processes
wait $API_PID $UI_PID