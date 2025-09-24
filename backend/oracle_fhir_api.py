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

@app.get("/api/patient-intelligence")
async def get_patient_intelligence():
    """Get patient intelligence data with risk scores and AI insights"""
    import random
    from datetime import timedelta

    # Pre-computed intelligence data for high-value patients
    patient_intelligence = {
        '77e10fd0-6a1c-5547-a130-fae1341acf36': {
            'riskScore': 95,
            'riskLevel': 'critical',
            'criticalLabs': 12,
            'abnormalLabs': 47,
            'deteriorating': True,
            'primaryConcern': 'Multi-organ failure progression',
            'alerts': ['AKI Stage 3', 'Septic shock', 'Liver failure'],
            'trends': {'renal': 'worsening', 'hepatic': 'worsening', 'cardiac': 'stable'},
            'lastUpdate': '2 min ago',
            'predictedDisposition': 'ICU - Extended stay',
            'aiInsights': [
                'Creatinine rising 0.5 mg/dL/day - dialysis likely within 24h',
                'Lactate trend suggests worsening tissue perfusion',
                'Consider hepatology consult for rising bilirubin'
            ]
        },
        '73fb53d8-f1fa-53cd-a25c-2314caccbb99': {
            'riskScore': 72,
            'riskLevel': 'high',
            'criticalLabs': 3,
            'abnormalLabs': 28,
            'deteriorating': False,
            'primaryConcern': 'Post-operative arrhythmia',
            'alerts': ['AFib with RVR', 'Elevated troponin'],
            'trends': {'cardiac': 'improving', 'renal': 'stable', 'respiratory': 'stable'},
            'lastUpdate': '15 min ago',
            'predictedDisposition': 'Step-down unit tomorrow',
            'aiInsights': [
                'Troponin trending down - post-op peak likely passed',
                'Consider amiodarone if rate control inadequate',
                'Hemoglobin stable - no active bleeding'
            ]
        },
        '8e77dd0b-932d-5790-9ba6-5c6df8434457': {
            'riskScore': 88,
            'riskLevel': 'critical',
            'criticalLabs': 8,
            'abnormalLabs': 35,
            'deteriorating': True,
            'primaryConcern': 'Worsening respiratory failure',
            'alerts': ['P/F ratio < 100', 'Rising lactate', 'Possible VAP'],
            'trends': {'respiratory': 'worsening', 'infectious': 'worsening', 'renal': 'stable'},
            'lastUpdate': '5 min ago',
            'predictedDisposition': 'Prone positioning likely',
            'aiInsights': [
                'WBC trend and fever curve suggest ventilator-associated pneumonia',
                'Consider bronchoscopy for culture',
                'ECMO team awareness recommended'
            ]
        },
        'e1de99bc-3bc5-565e-9ee6-69675b9cc267': {
            'riskScore': 65,
            'riskLevel': 'high',
            'criticalLabs': 4,
            'abnormalLabs': 22,
            'deteriorating': False,
            'primaryConcern': 'DKA partially resolved',
            'alerts': ['Anion gap closing', 'K+ needs repletion'],
            'trends': {'metabolic': 'improving', 'renal': 'stable', 'electrolytes': 'improving'},
            'lastUpdate': '30 min ago',
            'predictedDisposition': 'Floor transfer today',
            'aiInsights': [
                'Anion gap normalizing - transition to SubQ insulin appropriate',
                'Potassium 3.2 - increase repletion rate',
                'No signs of cerebral edema'
            ]
        },
        '4365e125-c049-525a-9459-16d5e6947ad2': {
            'riskScore': 78,
            'riskLevel': 'high',
            'criticalLabs': 5,
            'abnormalLabs': 31,
            'deteriorating': True,
            'primaryConcern': 'CKD progression to Stage 5',
            'alerts': ['eGFR < 15', 'Hyperkalemia', 'Metabolic acidosis'],
            'trends': {'renal': 'worsening', 'electrolytes': 'unstable', 'acid-base': 'worsening'},
            'lastUpdate': '10 min ago',
            'predictedDisposition': 'Dialysis initiation',
            'aiInsights': [
                'Urgent nephrology consult for dialysis planning',
                'K+ 5.8 - consider kayexalate or emergent dialysis',
                'Volume overload developing - diuretics ineffective'
            ]
        },
        '4f773083-7f4d-5378-b839-c24ca1e15434': {
            'riskScore': 70,
            'riskLevel': 'high',
            'criticalLabs': 2,
            'abnormalLabs': 18,
            'deteriorating': False,
            'primaryConcern': 'CHF exacerbation improving',
            'alerts': ['BNP trending down', 'Diuresis effective'],
            'trends': {'cardiac': 'improving', 'renal': 'stable', 'electrolytes': 'stable'},
            'lastUpdate': '45 min ago',
            'predictedDisposition': 'Continue diuresis',
            'aiInsights': [
                'Net negative 2L - target additional 1-2L',
                'Creatinine stable despite diuresis',
                'Consider GDMT optimization before discharge'
            ]
        },
        'a2605b15-4f1b-5839-b4ce-fb7a6bc1005f': {
            'riskScore': 82,
            'riskLevel': 'critical',
            'criticalLabs': 9,
            'abnormalLabs': 26,
            'deteriorating': True,
            'primaryConcern': 'Hemorrhagic shock',
            'alerts': ['Hgb dropping', 'Coagulopathy', 'MTP activated'],
            'trends': {'hematologic': 'worsening', 'coagulation': 'worsening', 'vitals': 'unstable'},
            'lastUpdate': '1 min ago',
            'predictedDisposition': 'OR likely',
            'aiInsights': [
                'Hgb dropped 2g/dL in 2 hours - active bleeding',
                'INR 2.5 - give FFP and vitamin K',
                'Surgical consultation urgent'
            ]
        },
        'e2beb281-c44f-579b-8211-a3749c549e92': {
            'riskScore': 75,
            'riskLevel': 'high',
            'criticalLabs': 4,
            'abnormalLabs': 20,
            'deteriorating': False,
            'primaryConcern': 'Post-MI monitoring',
            'alerts': ['Troponin peaked', 'No new ECG changes'],
            'trends': {'cardiac': 'stable', 'renal': 'stable', 'electrolytes': 'normal'},
            'lastUpdate': '20 min ago',
            'predictedDisposition': 'Cath lab tomorrow',
            'aiInsights': [
                'Troponin peak at 12 hours post-presentation',
                'Dual antiplatelet therapy initiated',
                'Echo shows EF 40% - consider ACE/ARB'
            ]
        },
        '8adbf3e4-47ff-561e-b1b6-746ee32e056d': {
            'riskScore': 68,
            'riskLevel': 'high',
            'criticalLabs': 3,
            'abnormalLabs': 15,
            'deteriorating': False,
            'primaryConcern': 'Stroke recovery stable',
            'alerts': ['PT/INR therapeutic', 'No hemorrhagic conversion'],
            'trends': {'neurologic': 'stable', 'coagulation': 'therapeutic', 'metabolic': 'normal'},
            'lastUpdate': '1 hour ago',
            'predictedDisposition': 'Rehab evaluation',
            'aiInsights': [
                'INR 2.3 - therapeutic on warfarin',
                'No signs of hemorrhagic transformation on repeat CT',
                'Swallow evaluation pending'
            ]
        },
        'dd2bf984-33c3-5874-8f68-84113327877e': {
            'riskScore': 55,
            'riskLevel': 'moderate',
            'criticalLabs': 1,
            'abnormalLabs': 12,
            'deteriorating': False,
            'primaryConcern': 'Multiple comorbidities stable',
            'alerts': ['Diabetes controlled', 'HTN managed'],
            'trends': {'metabolic': 'stable', 'cardiac': 'stable', 'renal': 'stable'},
            'lastUpdate': '2 hours ago',
            'predictedDisposition': 'Discharge planning',
            'aiInsights': [
                'A1c 7.2% - diabetes well controlled',
                'Blood pressure at goal on current regimen',
                'No acute issues - focus on discharge planning'
            ]
        }
    }

    # Build response with patient data
    patients = []
    patient_list = data_store.get("Patient", [])

    for patient_id, intelligence in patient_intelligence.items():
        # Find patient in the list
        patient = None
        for p in patient_list:
            if p.get('id') == patient_id:
                patient = p
                break

        if not patient:
            continue

        # Extract patient demographics
        name = patient.get("name", [{}])[0]
        given_name = name.get('given', [''])[0] if name.get('given') else ''
        family_name = name.get('family', '')
        display_name = f"{given_name} {family_name}".strip()
        if not display_name:
            display_name = f"Patient {patient_id[:8]}"

        # Get age and gender
        birth_date = patient.get("birthDate", "")
        age = 2024 - int(birth_date[:4]) if birth_date and birth_date[:4].isdigit() else 65
        gender = patient.get("gender", "unknown")

        # Calculate recent lab velocity (simulated)
        recent_labs = random.randint(5, 25)

        # Get actual observation count for this patient
        obs_count = len([o for o in data_store.get('Observation', [])
                       if o.get('subject', {}).get('reference', '').endswith(f"/{patient_id}")][:100])

        patients.append({
            'id': patient_id,
            'name': display_name,
            'age': age,
            'gender': gender,
            'mrn': patient_id[:8].upper(),
            'location': 'ICU-' + str(random.randint(1, 20)) if intelligence['riskLevel'] == 'critical' else 'Floor-' + str(random.randint(1, 50)),
            'los': random.randint(1, 15),  # Length of stay in days
            'intelligence': intelligence,
            'recentLabCount': recent_labs,
            'labVelocity': 'high' if recent_labs > 15 else 'moderate' if recent_labs > 8 else 'low'
        })

    # Sort by risk score
    patients.sort(key=lambda x: x['intelligence']['riskScore'], reverse=True)

    return {
        'timestamp': datetime.utcnow().isoformat(),
        'totalPatients': len(patients),
        'criticalCount': len([p for p in patients if p['intelligence']['riskLevel'] == 'critical']),
        'highRiskCount': len([p for p in patients if p['intelligence']['riskLevel'] == 'high']),
        'moderateRiskCount': len([p for p in patients if p['intelligence']['riskLevel'] == 'moderate']),
        'deterioratingCount': len([p for p in patients if p['intelligence']['deteriorating']]),
        'patients': patients
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