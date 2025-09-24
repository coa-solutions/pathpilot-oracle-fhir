#!/bin/bash

# PathPilot Development Server Runner
# Starts both Oracle FHIR API and PathPilot UI concurrently

echo "=================================================="
echo "🚀 Starting PathPilot with MIMIC FHIR Data"
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
    kill $FHIR_PID $UI_PID 2>/dev/null
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

# Start Oracle FHIR API Server
echo -e "${BLUE}Starting Oracle FHIR API Server...${NC}"
cd backend && python3 oracle_fhir_api.py &
FHIR_PID=$!
cd ..
echo -e "${GREEN}✅ FHIR API started (PID: $FHIR_PID)${NC}"

# Wait for FHIR server to be ready
echo -e "${YELLOW}Waiting for FHIR server to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ FHIR server is ready!${NC}"
        break
    fi
    sleep 1
done

# Start PathPilot UI
echo -e "${BLUE}Starting PathPilot UI...${NC}"
cd pathpilot-demo
npm run dev &
UI_PID=$!
cd ..
echo -e "${GREEN}✅ PathPilot UI started (PID: $UI_PID)${NC}"

# Wait for UI to be ready
echo -e "${YELLOW}Waiting for PathPilot UI to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PathPilot UI is ready!${NC}"
        break
    fi
    sleep 1
done

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 PathPilot is running!${NC}"
echo "=================================================="
echo ""
echo "📊 Oracle FHIR API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - 813K observations from 100 patients"
echo ""
echo "🏥 PathPilot Dashboard: http://localhost:3000"
echo "   - Real-time lab visualization"
echo "   - Critical value alerts"
echo "   - Trend analysis"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Wait for processes
wait $FHIR_PID $UI_PID