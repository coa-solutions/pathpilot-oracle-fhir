# PathPilot Platform

Clinical Lab Intelligence Platform with FHIR-compliant API and real-time monitoring dashboard.

## Architecture

- **API**: FastAPI server with FHIR R4 endpoints (Oracle Health compatible)
- **Web**: Next.js dashboard for real-time lab visualization and patient intelligence
- **Data**: MIMIC-IV clinical demo dataset (100 patients, 813K observations)

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+

### Installation

```bash
# Install dependencies
npm run install:deps

# Or manually:
pip install -r api/requirements.txt
cd web && npm install
```

### Development

```bash
# Start both servers
npm run dev

# Or use the shell script
./scripts/dev.sh
```

- API Server: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Dashboard: http://localhost:3000

## Deployment

### Render (Recommended)

Both services deploy together using the `render.yaml` configuration:
1. Push to GitHub
2. Connect repository in Render Dashboard
3. Render auto-detects configuration and deploys both services

### Environment Variables

Configure in Render Dashboard after deployment:

#### API Service
```
CORS_ORIGINS=["https://pathpilot-web.onrender.com"]
```

#### Web Service
```
NEXT_PUBLIC_API_URL=https://pathpilot-api.onrender.com
```

## API Endpoints

- `GET /Patient` - List patients
- `GET /Patient/{id}` - Get patient details
- `GET /Observation` - List lab observations
- `GET /DiagnosticReport` - List diagnostic reports
- `GET /Encounter` - List patient encounters

## Features

- Real-time lab result monitoring
- Critical value alerts
- Trend analysis and visualization
- Patient timeline views
- FHIR R4 compliant API