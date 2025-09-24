'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Activity } from 'lucide-react';
import LabDashboard from './LabDashboard';

interface PatientLabCommandCenterProps {
  patientId: string;
}

export default function PatientLabCommandCenter({ patientId }: PatientLabCommandCenterProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Intelligence Grid</span>
            </button>
            <div className="flex items-center gap-2 text-gray-400">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Patient ID: {patientId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Use existing LabDashboard but with single patient focus */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LabDashboard initialPatientId={patientId} />
      </div>
    </div>
  );
}