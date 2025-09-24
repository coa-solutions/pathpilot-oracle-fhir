# PathPilot Lab Intelligence Platform

A modern lab intelligence platform integrating Oracle Health Millennium FHIR API with MIMIC-IV demo data.

## Architecture

- **Backend**: FastAPI server simulating Oracle FHIR R4 endpoints
- **Frontend**: Next.js dashboard for real-time lab visualization
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
pip install -r backend/requirements.txt
cd pathpilot-demo && npm install
```

### Development

```bash
# Start both servers
npm run dev

# Or use the shell script
./run_pathpilot.sh
```

- API Server: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Dashboard: http://localhost:3000

## Deployment

### Vercel (Frontend)

The Next.js frontend can be deployed directly to Vercel:

```bash
cd pathpilot-demo
vercel
```

### Render (Backend)

Deploy the FastAPI backend to Render using the `deploy/render.yaml` configuration.

### Environment Variables

Create `.env` files for each environment:

#### Backend (.env)
```
PORT=8000
CORS_ORIGINS=["https://your-frontend-domain.vercel.app"]
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
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