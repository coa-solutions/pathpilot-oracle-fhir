# FHIR API Separation Plan

## Repository Name
`mimic-fhir-api` - Clear attribution to MIMIC-IV dataset

## Phase 1: Immediate Separation (Day 1)

### New Repository Structure
```
mimic-fhir-api/
├── main.py
├── cache.py
├── requirements.txt
├── data/
│   └── mimic-iv-clinical-database-demo-on-fhir-2.1.0/
├── render.yaml
├── .gitignore
├── LICENSE (ODbL from MIMIC)
└── README.md
```

### Steps
1. Create new repo `mimic-fhir-api`
2. Copy these files from current repo:
   - `/api/main.py`
   - `/api/cache.py`
   - `/api/requirements.txt`
   - `/api/data/` (entire directory)
3. Create `render.yaml`:
```yaml
services:
  - type: web
    name: mimic-fhir-api
    runtime: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: CORS_ORIGINS
        value: "*"
```

4. Update `main.py` header with attribution:
```python
"""
MIMIC-IV FHIR API Server
Serves MIMIC-IV Clinical Database Demo on FHIR (v2.1.0)

Dataset Citation:
Bennett, A., et al. (2025). MIMIC-IV Clinical Database Demo on FHIR (version 2.1.0).
PhysioNet. https://doi.org/10.13026/c2f9-3y63

Licensed under Open Database License (ODbL)
"""
```

5. Deploy to Render
6. Update web app's `.env`:
```
NEXT_PUBLIC_FHIR_BASE_URL=https://mimic-fhir-api.onrender.com
```

## Phase 2: Fix FHIR Compliance (Week 2)

### Current Non-FHIR Endpoints to Move
- `/api/patient-intelligence` → `/$patient-intelligence` (custom operation)
- `/patients-summary` → `/Patient/$summary` (FHIR operation format)

### Make Search Parameters FHIR-Compliant
```python
# Current (wrong)
GET /Observation?patient=123

# FHIR-compliant
GET /Observation?subject=Patient/123
```

### Fix Bundle Structure
```python
def create_bundle(resources, resource_type, total=None, offset=0, count=100):
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": total or len(resources),
        "link": [
            {"relation": "self", "url": f"/{resource_type}?_offset={offset}&_count={count}"}
        ],
        "entry": [
            {
                "fullUrl": f"{BASE_URL}/{resource_type}/{r['id']}",  # Must be absolute URL
                "resource": r,
                "search": {"mode": "match"}
            }
            for r in resources
        ]
    }
```

### Return OperationOutcome for Errors
```python
@app.exception_handler(HTTPException)
async def fhir_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "resourceType": "OperationOutcome",
            "issue": [{
                "severity": "error",
                "code": "not-found" if exc.status_code == 404 else "exception",
                "diagnostics": exc.detail
            }]
        }
    )
```

## Phase 3: Organize Endpoints (Week 3)

### Restructure URLs
```
/                           # API info
/metadata                   # FHIR CapabilityStatement

# Standard FHIR endpoints
/Patient
/Patient/{id}
/Observation
/Observation/{id}
/Condition
/Encounter
/MedicationRequest

# FHIR Operations (custom but FHIR-compliant format)
/Patient/$summary           # Moved from /patients-summary
/$patient-intelligence      # Moved from /api/patient-intelligence

# Admin
/admin/cache/stats
/admin/cache/clear
```

### Update main.py Structure
```python
from fastapi import FastAPI, APIRouter

# Standard FHIR routes
fhir_router = APIRouter()

@fhir_router.get("/Patient")
async def search_patients(...):
    # FHIR-compliant search
    pass

@fhir_router.get("/Patient/{id}")
async def read_patient(id: str):
    # Standard FHIR read
    pass

# FHIR Operations
operations_router = APIRouter()

@operations_router.post("/Patient/$summary")
@operations_router.get("/Patient/$summary")  # Support both GET and POST
async def patient_summary_operation():
    # Custom operation in FHIR format
    pass

# Admin routes
admin_router = APIRouter(prefix="/admin")

@admin_router.get("/cache/stats")
async def cache_stats():
    pass

app.include_router(fhir_router)
app.include_router(operations_router)
app.include_router(admin_router)
```

## Phase 4: Update Web Application (Week 3-4)

### Update API Calls
```typescript
// Old
const response = await fetch('/api/patient-intelligence');

// New
const response = await fetch(`${FHIR_BASE_URL}/$patient-intelligence`);
```

### Update fhir-client.ts
```typescript
// Fix search parameters
async getLabResults(patientId: string) {
  // Old: ?patient=${patientId}
  // New: ?subject=Patient/${patientId}
  const response = await fetch(
    `/api/fhir/Observation?subject=Patient/${patientId}&_count=100`
  );
}
```

## What We're NOT Doing
- No Docker needed (Render handles deployment)
- No complex monitoring/metrics
- No database (keeping NDJSON files)
- No write operations (read-only dataset)
- No authentication (public demo data)

## Timeline
- **Day 1**: Create repo, copy files, deploy
- **Week 1**: Update web app to use new API
- **Week 2**: Fix FHIR compliance issues
- **Week 3**: Reorganize endpoints properly
- **Week 4**: Final testing and cleanup

## Files to Create Immediately

### README.md for new repo
```markdown
# MIMIC-IV FHIR API

FHIR R4 API serving MIMIC-IV Clinical Database Demo on FHIR (v2.1.0)

## Dataset
This API serves the MIMIC-IV Clinical Database Demo on FHIR dataset from PhysioNet.

**Citation Required:**
Bennett, A., et al. (2025). MIMIC-IV Clinical Database Demo on FHIR (version 2.1.0).
PhysioNet. https://doi.org/10.13026/c2f9-3y63

## Endpoints
- `GET /metadata` - FHIR CapabilityStatement
- `GET /Patient` - Search patients
- `GET /Observation` - Search observations
- `GET /$patient-intelligence` - Patient risk analysis

## License
Dataset: Open Database License (ODbL)
API Code: MIT
```

### .gitignore
```
__pycache__/
*.pyc
.env
.venv/
venv/
.DS_Store
```