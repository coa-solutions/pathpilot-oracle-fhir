import { FHIRBundle, FHIRObservation, LabResult, Patient } from './types';

// Use MIMIC FHIR server configuration
const FHIR_BASE_URL = process.env.NEXT_PUBLIC_FHIR_BASE_URL || 'http://localhost:8000';
// MIMIC patient ID with rich lab data (8000+ observations)
const DEFAULT_PATIENT_ID = process.env.NEXT_PUBLIC_DEFAULT_PATIENT_ID || '28dcf33b-0c52-587f-83ad-2a3270976719';

export class FHIRClient {
  private baseUrl: string;

  constructor(baseUrl: string = FHIR_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getPatient(patientId: string = DEFAULT_PATIENT_ID): Promise<Patient> {
    try {
      const response = await fetch(`/api/fhir/Patient/${patientId}`);
      const data = await response.json();

      return {
        id: data.id,
        name: data.name?.[0]?.given?.[0] + ' ' + data.name?.[0]?.family || 'Unknown Patient',
        birthDate: data.birthDate,
        gender: data.gender,
        mrn: data.identifier?.find((id: { type?: { coding?: Array<{ code?: string }> } }) => id.type?.coding?.[0]?.code === 'MR')?.value || 'Unknown'
      };
    } catch (error) {
      console.error('Error fetching patient:', error);
      // Return MIMIC patient for demo
      return {
        id: DEFAULT_PATIENT_ID,
        name: 'Patient 10007795', // MIMIC uses anonymized names
        birthDate: '2083-04-10',
        gender: 'female',
        mrn: '10007795'
      };
    }
  }

  async getLabResults(
    patientId: string = DEFAULT_PATIENT_ID,
    count: number = 100
  ): Promise<LabResult[]> {
    try {
      // MIMIC data doesn't use category filter - get all observations
      const response = await fetch(
        `/api/fhir/Observation?patient=${patientId}&_count=${count}`
      );
      const bundle: FHIRBundle = await response.json();

      if (!bundle.entry) return [];

      return bundle.entry.map(entry => this.transformObservation(entry.resource));
    } catch (error) {
      console.error('Error fetching lab results:', error);
      return [];
    }
  }

  private transformObservation(obs: FHIRObservation): LabResult {
    const value = obs.valueQuantity?.value;
    const unit = obs.valueQuantity?.unit || '';
    const refRange = obs.referenceRange?.[0];

    let status: 'normal' | 'critical' | 'abnormal' = 'normal';

    if (value !== undefined && refRange) {
      if (refRange.high && value > refRange.high.value) {
        status = value > refRange.high.value * 1.5 ? 'critical' : 'abnormal';
      } else if (refRange.low && value < refRange.low.value) {
        status = value < refRange.low.value * 0.5 ? 'critical' : 'abnormal';
      }
    }

    // Check for critical values based on common lab thresholds
    const criticalRanges: { [key: string]: { low?: number; high?: number } } = {
      'Potassium': { low: 2.5, high: 6.5 },
      'Sodium': { low: 120, high: 160 },
      'Glucose': { low: 40, high: 500 },
      'Hemoglobin': { low: 5, high: 20 },
      'Platelet': { low: 20, high: 1000 },
      'Creatinine': { high: 10 }
    };

    // MIMIC data uses coding[0].display instead of text
    const labName = obs.code.text || obs.code.coding?.[0]?.display || 'Unknown';
    const critical = Object.entries(criticalRanges).find(([key]) =>
      labName.toLowerCase().includes(key.toLowerCase())
    );

    if (critical && value !== undefined) {
      const [, range] = critical;
      if ((range.high && value > range.high) || (range.low && value < range.low)) {
        status = 'critical';
      }
    }

    return {
      id: obs.id,
      code: obs.code.coding?.[0]?.code || '',
      name: labName, // Use the same labName we computed above
      value: value ?? 'N/A',
      unit,
      referenceRange: refRange ? {
        low: refRange.low?.value,
        high: refRange.high?.value,
        text: refRange.text
      } : undefined,
      status,
      effectiveDateTime: obs.effectiveDateTime,
      category: 'laboratory',
      interpretation: obs.interpretation?.[0]?.coding?.[0]?.display
    };
  }

  async getDiagnosticReports(patientId: string = DEFAULT_PATIENT_ID) {
    try {
      const response = await fetch(
        `/api/fhir/DiagnosticReport?patient=${patientId}&_count=20&_sort=-date`
      );
      const bundle = await response.json();

      if (!bundle.entry) return [];

      return bundle.entry.map((entry: { resource: { id: string; status: string; code?: { coding?: Array<{ code?: string }>; text?: string }; effectivePeriod?: { start?: string }; effectiveDateTime?: string; conclusion?: string; presentedForm?: Array<unknown> } }) => ({
        id: entry.resource.id,
        status: entry.resource.status,
        code: entry.resource.code?.coding?.[0]?.code || '',
        name: entry.resource.code?.text || 'Unknown Report',
        effectiveDateTime: entry.resource.effectivePeriod?.start || entry.resource.effectiveDateTime,
        conclusion: entry.resource.conclusion,
        presentedForm: entry.resource.presentedForm
      }));
    } catch (error) {
      console.error('Error fetching diagnostic reports:', error);
      return [];
    }
  }
}