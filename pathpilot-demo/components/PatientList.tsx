'use client';

import React from 'react';
import { User, Activity, TrendingUp, Heart, Brain, Droplet } from 'lucide-react';

interface PatientOption {
  id: string;
  name: string;
  description: string;
  observationCount: number;
  icon: React.ReactNode;
  category: string;
}

interface PatientListProps {
  currentPatientId: string;
  onPatientSelect: (patientId: string) => void;
}

// Pre-configured patients with rich data
const FEATURED_PATIENTS: PatientOption[] = [
  {
    id: '77e10fd0-6a1c-5547-a130-fae1341acf36',
    name: 'ICU Patient #1',
    description: 'Multi-organ failure, sepsis',
    observationCount: 48114,
    icon: <Activity className="w-5 h-5 text-red-500" />,
    category: 'Critical Care'
  },
  {
    id: '73fb53d8-f1fa-53cd-a25c-2314caccbb99',
    name: 'Cardiac Surgery',
    description: 'Post-CABG recovery, arrhythmia',
    observationCount: 40615,
    icon: <Heart className="w-5 h-5 text-red-500" />,
    category: 'Cardiac ICU'
  },
  {
    id: '8e77dd0b-932d-5790-9ba6-5c6df8434457',
    name: 'Respiratory Failure',
    description: 'ARDS, ventilator management',
    observationCount: 36772,
    icon: <Activity className="w-5 h-5 text-blue-500" />,
    category: 'Medical ICU'
  },
  {
    id: 'e1de99bc-3bc5-565e-9ee6-69675b9cc267',
    name: 'Diabetes Complex',
    description: 'DKA, renal complications',
    observationCount: 34489,
    icon: <Droplet className="w-5 h-5 text-yellow-500" />,
    category: 'Endocrine'
  },
  {
    id: '4365e125-c049-525a-9459-16d5e6947ad2',
    name: 'CKD Stage 4',
    description: 'Pre-dialysis, electrolyte mgmt',
    observationCount: 33309,
    icon: <Droplet className="w-5 h-5 text-purple-500" />,
    category: 'Nephrology'
  },
  {
    id: '4f773083-7f4d-5378-b839-c24ca1e15434',
    name: 'Heart Failure',
    description: 'CHF exacerbation, diuresis',
    observationCount: 30924,
    icon: <Heart className="w-5 h-5 text-pink-500" />,
    category: 'Cardiology'
  },
  {
    id: 'a2605b15-4f1b-5839-b4ce-fb7a6bc1005f',
    name: 'Trauma Patient',
    description: 'MVA, multiple injuries',
    observationCount: 28169,
    icon: <Activity className="w-5 h-5 text-orange-500" />,
    category: 'Emergency'
  },
  {
    id: 'e2beb281-c44f-579b-8211-a3749c549e92',
    name: 'Acute MI',
    description: 'STEMI, PCI, cardiac enzymes',
    observationCount: 28122,
    icon: <Heart className="w-5 h-5 text-red-600" />,
    category: 'Emergency'
  },
  {
    id: '8adbf3e4-47ff-561e-b1b6-746ee32e056d',
    name: 'Stroke Patient',
    description: 'Ischemic CVA, tPA candidate',
    observationCount: 27883,
    icon: <Brain className="w-5 h-5 text-indigo-500" />,
    category: 'Neurology'
  },
  {
    id: 'dd2bf984-33c3-5874-8f68-84113327877e',
    name: 'Complex Medical',
    description: 'Multiple comorbidities',
    observationCount: 25511,
    icon: <Activity className="w-5 h-5 text-gray-600" />,
    category: 'General'
  }
];

export default function PatientList({ currentPatientId, onPatientSelect }: PatientListProps) {
  const formatNumber = (num: number) => {
    return `${(num / 1000).toFixed(1)}K`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-4">Select Patient Scenario</h3>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {FEATURED_PATIENTS.map((patient) => (
          <button
            key={patient.id}
            onClick={() => onPatientSelect(patient.id)}
            className={`w-full text-left p-3 rounded-lg transition-all hover:shadow-md ${
              patient.id === currentPatientId
                ? 'bg-blue-50 border-2 border-blue-500'
                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">{patient.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{patient.name}</h4>
                  <span className="text-xs bg-gray-100 text-gray-800 font-medium px-2 py-1 rounded-full">
                    {formatNumber(patient.observationCount)} labs
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{patient.description}</p>
                <span className="inline-block text-xs text-gray-600 mt-1">
                  {patient.category}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}