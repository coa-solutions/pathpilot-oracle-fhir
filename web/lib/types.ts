export interface Patient {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  mrn: string;
}

export interface LabResult {
  id: string;
  code: string;
  name: string;
  value: number | string;
  unit: string;
  referenceRange?: {
    low?: number;
    high?: number;
    text?: string;
  };
  status: 'normal' | 'critical' | 'abnormal';
  effectiveDateTime: string;
  category: string;
  interpretation?: string;
}

export interface LabTrend {
  labName: string;
  code: string;
  unit: string;
  data: {
    date: string;
    value: number;
    status: string;
  }[];
  currentValue: number;
  previousValue?: number;
  delta?: number;
  deltaPercent?: number;
  trend: 'rising' | 'falling' | 'stable';
}

export interface DiagnosticReport {
  id: string;
  status: string;
  code: string;
  name: string;
  effectiveDateTime: string;
  conclusion?: string;
  presentedForm?: {
    contentType: string;
    url: string;
    title: string;
  }[];
}

export interface FHIRObservation {
  resourceType: 'Observation';
  id: string;
  status: string;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  subject: {
    reference: string;
  };
  effectiveDateTime: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  referenceRange?: Array<{
    low?: {
      value: number;
      unit: string;
    };
    high?: {
      value: number;
      unit: string;
    };
    text?: string;
  }>;
  interpretation?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  type: string;
  total?: number;
  entry?: Array<{
    fullUrl: string;
    resource: FHIRObservation;
  }>;
}