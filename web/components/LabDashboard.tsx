'use client';

import { useState, useEffect } from 'react';
import { FHIRClient } from '@/lib/fhir-client';
import { LabProcessor } from '@/lib/lab-processor';
import { Patient, LabResult, LabTrend, DiagnosticReport } from '@/lib/types';
import PatientHeader from './PatientHeader';
import CriticalAlerts from './CriticalAlerts';
import LabTrendChart from './LabTrendChart';
import LabCard from './LabCard';
import { Activity, FileText, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

interface LabDashboardProps {
  initialPatientId?: string;
}

export default function LabDashboard({ initialPatientId }: LabDashboardProps = {}) {
  const [currentPatientId, setCurrentPatientId] = useState<string>(
    initialPatientId || process.env.NEXT_PUBLIC_DEFAULT_PATIENT_ID || '77e10fd0-6a1c-5547-a130-fae1341acf36'
  );
  const [patient, setPatient] = useState<Patient | null>(null);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [labTrends, setLabTrends] = useState<LabTrend[]>([]);
  const [diagnosticReports, setDiagnosticReports] = useState<DiagnosticReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'trends' | 'recent' | 'reports'>('trends');

  const fhirClient = new FHIRClient();

  const fetchData = async (patientId: string = currentPatientId, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch patient data
      const patientData = await fhirClient.getPatient(patientId);
      setPatient(patientData);

      // Fetch lab results
      const labs = await fhirClient.getLabResults(patientId);
      setLabResults(labs);

      // Process trends
      const trends = LabProcessor.processLabTrends(labs);
      setLabTrends(trends);

      // Fetch diagnostic reports
      const reports = await fhirClient.getDiagnosticReports(patientId);
      setDiagnosticReports(reports);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePatientChange = (newPatientId: string) => {
    setCurrentPatientId(newPatientId);
    fetchData(newPatientId);
  };

  useEffect(() => {
    fetchData(currentPatientId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recentLabs = labResults.slice(0, 12);
  const summary = LabProcessor.getRecentLabsSummary(labResults);

  return (
    <div className={!initialPatientId ? "min-h-screen bg-gray-50" : ""}>
      {/* Header - Only show if not in single patient mode */}
      {!initialPatientId && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Activity className="w-8 h-8 text-blue-600" />
                  PathPilot Lab Dashboard
                </h1>
                <p className="text-gray-600 mt-1">Pathology & Lab Intelligence Companion</p>
              </div>
              <button
                onClick={() => fetchData(currentPatientId, true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6">
          {/* Main Dashboard Content */}
          <div>
            {/* Patient Header */}
            <PatientHeader patient={patient} loading={loading} />

        {/* Summary */}
        {!loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-900">{summary}</p>
          </div>
        )}

        {/* Critical Alerts */}
        <CriticalAlerts labs={labResults} loading={loading} />

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('trends')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'trends'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-400'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Lab Trends
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'recent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-400'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              Recent Labs
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-400'
              }`}
            >
              <FileText className="w-4 h-4" />
              Reports
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'trends' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {labTrends.length > 0 ? (
                  labTrends.map((trend) => (
                    <LabTrendChart key={trend.labName} trend={trend} />
                  ))
                ) : (
                  <div className="col-span-2 bg-white rounded-lg shadow-sm p-12 text-center">
                    <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600">No trend data available</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'recent' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentLabs.length > 0 ? (
                  recentLabs.map((lab) => (
                    <LabCard key={lab.id} lab={lab} />
                  ))
                ) : (
                  <div className="col-span-3 bg-white rounded-lg shadow-sm p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600">No recent lab results</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Diagnostic Reports</h3>
                {diagnosticReports.length > 0 ? (
                  <div className="space-y-3">
                    {diagnosticReports.map((report) => (
                      <div key={report.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <p className="font-medium">{report.name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(report.effectiveDateTime).toLocaleDateString()}
                        </p>
                        {report.presentedForm && report.presentedForm.length > 0 && (
                          <div className="mt-2">
                            {report.presentedForm.map((form, idx) => (
                              <a
                                key={idx}
                                href={form.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline mr-3"
                              >
                                View {form.contentType.includes('pdf') ? 'PDF' : 'Report'}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600">No diagnostic reports available</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}