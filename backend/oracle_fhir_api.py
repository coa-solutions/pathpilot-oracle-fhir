#!/usr/bin/env python3
"""
Oracle Health Millennium FHIR R4 API Simulator
Uses MIMIC-IV demo data to simulate Oracle's FHIR endpoints
"""

import json
import os
from typing import Dict, List, Optional, Any
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="Oracle Health Millennium FHIR R4 API Simulator",
    description="POC simulator using MIMIC-IV demo data",
    version="1.0.0"
)

# Enable CORS for browser testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data storage
data_store: Dict[str, List[Dict]] = {}
data_dir = "data/mimic-iv-clinical-database-demo-on-fhir-2.1.0/fhir"

def load_ndjson_file(filepath: str, resource_type: str):
    """Load NDJSON file into memory"""
    resources = []
    try:
        with open(filepath, 'r') as f:
            for line in f:
                if line.strip():
                    resource = json.loads(line)
                    resources.append(resource)
        print(f"Loaded {len(resources)} {resource_type} resources")
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
    return resources

def initialize_data():
    """Load all MIMIC data into memory"""
    print("Loading MIMIC-IV FHIR data...")

    # Map MIMIC files to FHIR resource types
    file_mappings = {
        'Patient': ['MimicPatient.ndjson'],
        'Organization': ['MimicOrganization.ndjson'],
        'Location': ['MimicLocation.ndjson'],
        'Encounter': ['MimicEncounter.ndjson', 'MimicEncounterED.ndjson', 'MimicEncounterICU.ndjson'],
        'Condition': ['MimicCondition.ndjson', 'MimicConditionED.ndjson'],
        'Observation': [
            'MimicObservationLabevents.ndjson',
            'MimicObservationChartevents.ndjson',
            'MimicObservationDatetimeevents.ndjson',
            'MimicObservationOutputevents.ndjson',
            'MimicObservationED.ndjson',
            'MimicObservationVitalSignsED.ndjson',
            'MimicObservationMicroTest.ndjson',
            'MimicObservationMicroOrg.ndjson',
            'MimicObservationMicroSusc.ndjson'
        ],
        'Procedure': ['MimicProcedure.ndjson', 'MimicProcedureED.ndjson', 'MimicProcedureICU.ndjson'],
        'Medication': ['MimicMedication.ndjson', 'MimicMedicationMix.ndjson'],
        'MedicationRequest': ['MimicMedicationRequest.ndjson'],
        'MedicationAdministration': ['MimicMedicationAdministration.ndjson', 'MimicMedicationAdministrationICU.ndjson'],
        'MedicationDispense': ['MimicMedicationDispense.ndjson', 'MimicMedicationDispenseED.ndjson'],
        'MedicationStatement': ['MimicMedicationStatementED.ndjson'],
        'Specimen': ['MimicSpecimen.ndjson', 'MimicSpecimenLab.ndjson']
    }

    for resource_type, files in file_mappings.items():
        data_store[resource_type] = []
        for filename in files:
            filepath = os.path.join(data_dir, filename)
            if os.path.exists(filepath):
                resources = load_ndjson_file(filepath, resource_type)
                data_store[resource_type].extend(resources)

    print(f"\nData loaded successfully!")
    for resource_type, resources in data_store.items():
        if resources:
            print(f"  {resource_type}: {len(resources)} resources")

def create_bundle(resources: List[Dict], resource_type: str, total: Optional[int] = None) -> Dict:
    """Create a FHIR Bundle response"""
    bundle = {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": total or len(resources),
        "link": [{
            "relation": "self",
            "url": f"/{resource_type}"
        }],
        "entry": [
            {
                "fullUrl": f"/{resource_type}/{r['id']}",
                "resource": r,
                "search": {"mode": "match"}
            }
            for r in resources
        ]
    }
    return bundle

@app.on_event("startup")
async def startup_event():
    """Initialize data on server start"""
    initialize_data()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Oracle Health Millennium FHIR R4 API Simulator",
        "version": "1.0.0",
        "fhirVersion": "4.0.1",
        "implementation": "MIMIC-IV Demo Data",
        "availableResources": list(data_store.keys())
    }

@app.get("/metadata")
async def capability_statement():
    """FHIR Capability Statement"""
    return {
        "resourceType": "CapabilityStatement",
        "status": "active",
        "date": datetime.now().isoformat(),
        "kind": "instance",
        "fhirVersion": "4.0.1",
        "format": ["json"],
        "rest": [{
            "mode": "server",
            "resource": [
                {
                    "type": resource_type,
                    "interaction": [
                        {"code": "read"},
                        {"code": "search-type"}
                    ]
                }
                for resource_type in data_store.keys()
            ]
        }]
    }

# Generic resource endpoints
@app.get("/{resource_type}")
async def get_resources(
    resource_type: str,
    patient: Optional[str] = Query(None),
    _count: Optional[int] = Query(100)
):
    """Get all resources of a type with optional filtering"""
    if resource_type not in data_store:
        raise HTTPException(status_code=404, detail=f"Resource type {resource_type} not found")

    resources = data_store[resource_type]

    # Filter by patient if specified
    if patient:
        filtered = []
        for r in resources:
            # Check various patient reference fields
            if 'patient' in r and r['patient'].get('reference', '').endswith(f"/{patient}"):
                filtered.append(r)
            elif 'subject' in r and r['subject'].get('reference', '').endswith(f"/{patient}"):
                filtered.append(r)
        resources = filtered

    # Limit results
    resources = resources[:_count]

    return create_bundle(resources, resource_type)

@app.get("/{resource_type}/{resource_id}")
async def get_resource_by_id(resource_type: str, resource_id: str):
    """Get a specific resource by ID"""
    if resource_type not in data_store:
        raise HTTPException(status_code=404, detail=f"Resource type {resource_type} not found")

    for resource in data_store[resource_type]:
        if resource.get('id') == resource_id:
            return resource

    raise HTTPException(status_code=404, detail=f"{resource_type}/{resource_id} not found")

# Specific Oracle-compatible endpoints with better search support
@app.get("/Patient")
async def get_patients(_count: Optional[int] = Query(100)):
    """Get all patients"""
    patients = data_store.get('Patient', [])[:_count]
    return create_bundle(patients, 'Patient')

@app.get("/Patient/{patient_id}")
async def get_patient(patient_id: str):
    """Get specific patient"""
    for patient in data_store.get('Patient', []):
        if patient.get('id') == patient_id:
            return patient
    raise HTTPException(status_code=404, detail=f"Patient/{patient_id} not found")

@app.get("/Encounter")
async def get_encounters(
    patient: Optional[str] = Query(None),
    _count: Optional[int] = Query(100)
):
    """Get encounters with optional patient filter"""
    encounters = data_store.get('Encounter', [])

    if patient:
        encounters = [e for e in encounters
                     if e.get('subject', {}).get('reference', '').endswith(f"/{patient}")]

    return create_bundle(encounters[:_count], 'Encounter')

@app.get("/Observation")
async def get_observations(
    patient: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    _count: Optional[int] = Query(100)
):
    """Get observations with optional filters"""
    observations = data_store.get('Observation', [])

    if patient:
        observations = [o for o in observations
                       if o.get('subject', {}).get('reference', '').endswith(f"/{patient}")]

    if category:
        observations = [o for o in observations
                       if any(cat.get('coding', [{}])[0].get('code') == category
                              for cat in o.get('category', []))]

    return create_bundle(observations[:_count], 'Observation')

@app.get("/Condition")
async def get_conditions(
    patient: Optional[str] = Query(None),
    _count: Optional[int] = Query(100)
):
    """Get conditions with optional patient filter"""
    conditions = data_store.get('Condition', [])

    if patient:
        conditions = [c for c in conditions
                     if c.get('subject', {}).get('reference', '').endswith(f"/{patient}")]

    return create_bundle(conditions[:_count], 'Condition')

@app.get("/MedicationRequest")
async def get_medication_requests(
    patient: Optional[str] = Query(None),
    _count: Optional[int] = Query(100)
):
    """Get medication requests with optional patient filter"""
    requests = data_store.get('MedicationRequest', [])

    if patient:
        requests = [m for m in requests
                   if m.get('subject', {}).get('reference', '').endswith(f"/{patient}")]

    return create_bundle(requests[:_count], 'MedicationRequest')

@app.get("/patients-summary")
async def get_patients_summary(_count: Optional[int] = Query(100)):
    """Get enriched patient list with metadata for selection"""
    patients = data_store.get('Patient', [])[:_count]

    patient_summaries = []

    # Pre-computed top patients with high observation counts
    high_volume_patients = {
        '77e10fd0-6a1c-5547-a130-fae1341acf36': {'obs_count': 48114, 'label': 'ICU - Multi-organ failure'},
        '73fb53d8-f1fa-53cd-a25c-2314caccbb99': {'obs_count': 40615, 'label': 'ICU - Cardiac surgery'},
        '8e77dd0b-932d-5790-9ba6-5c6df8434457': {'obs_count': 36772, 'label': 'ICU - Respiratory failure'},
        'e1de99bc-3bc5-565e-9ee6-69675b9cc267': {'obs_count': 34489, 'label': 'Chronic - Diabetes'},
        '4365e125-c049-525a-9459-16d5e6947ad2': {'obs_count': 33309, 'label': 'Chronic - CKD'},
        '4f773083-7f4d-5378-b839-c24ca1e15434': {'obs_count': 30924, 'label': 'Chronic - Heart failure'},
        'a2605b15-4f1b-5839-b4ce-fb7a6bc1005f': {'obs_count': 28169, 'label': 'ED - Trauma'},
        'e2beb281-c44f-579b-8211-a3749c549e92': {'obs_count': 28122, 'label': 'ED - Acute MI'},
        '8adbf3e4-47ff-561e-b1b6-746ee32e056d': {'obs_count': 27883, 'label': 'ED - Stroke'},
        'dd2bf984-33c3-5874-8f68-84113327877e': {'obs_count': 25511, 'label': 'Complex - Multiple comorbidities'},
    }

    for patient in patients:
        patient_id = patient.get('id')

        # Get observation count (use pre-computed for known patients)
        if patient_id in high_volume_patients:
            obs_count = high_volume_patients[patient_id]['obs_count']
            clinical_label = high_volume_patients[patient_id]['label']
            data_quality = 'excellent' if obs_count > 30000 else 'good'
        else:
            # For other patients, get actual counts (limited for performance)
            observations = [o for o in data_store.get('Observation', [])
                          if o.get('subject', {}).get('reference', '').endswith(f"/{patient_id}")][:100]
            obs_count = len(observations)
            clinical_label = 'Standard patient'
            data_quality = 'moderate' if obs_count < 1000 else 'good'

        # Get encounter count
        encounters = [e for e in data_store.get('Encounter', [])
                     if e.get('subject', {}).get('reference', '').endswith(f"/{patient_id}")]

        # Get conditions (top 3)
        conditions = [c for c in data_store.get('Condition', [])
                     if c.get('subject', {}).get('reference', '').endswith(f"/{patient_id}")][:3]

        # Calculate age from birthDate
        birth_date = patient.get('birthDate', '')
        age = 2024 - int(birth_date[:4]) if birth_date else 'Unknown'

        summary = {
            'id': patient_id,
            'name': patient.get('name', [{}])[0].get('family', f'Patient_{patient_id[:8]}'),
            'gender': patient.get('gender', 'unknown'),
            'age': age,
            'birthDate': birth_date,
            'observationCount': obs_count,
            'encounterCount': len(encounters),
            'conditionCount': len(conditions),
            'conditions': [c.get('code', {}).get('text', 'Unknown')[:50] for c in conditions],
            'dataQuality': data_quality,
            'clinicalLabel': clinical_label
        }

        patient_summaries.append(summary)

    # Sort by observation count
    patient_summaries.sort(key=lambda x: x['observationCount'], reverse=True)

    return {
        'total': len(patient_summaries),
        'patients': patient_summaries
    }

if __name__ == "__main__":
    print("\n" + "="*60)
    print("Oracle Health Millennium FHIR R4 API Simulator")
    print("="*60)
    print("\nStarting server...")
    print("\nAPI will be available at: http://localhost:8000")
    print("Interactive docs at: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop the server")
    print("="*60 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8000)