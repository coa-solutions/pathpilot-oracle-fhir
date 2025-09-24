'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  ChevronRight,
  Users,
  AlertCircle,
  Brain,
  Zap,
  BarChart3,
  Target
} from 'lucide-react';

interface OrganTrend {
  renal?: string;
  hepatic?: string;
  cardiac?: string;
  respiratory?: string;
  neurologic?: string;
  metabolic?: string;
  hematologic?: string;
  infectious?: string;
}

interface PatientIntelligence {
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'moderate' | 'low';
  criticalLabs: number;
  abnormalLabs: number;
  deteriorating: boolean;
  primaryConcern: string;
  alerts: string[];
  trends: OrganTrend;
  lastUpdate: string;
  predictedDisposition: string;
  aiInsights: string[];
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  location: string;
  los: number;
  intelligence: PatientIntelligence;
  recentLabCount: number;
  labVelocity: 'high' | 'moderate' | 'low';
}

interface IntelligenceResponse {
  timestamp: string;
  totalPatients: number;
  criticalCount: number;
  highRiskCount: number;
  moderateRiskCount: number;
  deterioratingCount: number;
  patients: Patient[];
}

export default function PatientIntelligenceGrid() {
  const [data, setData] = useState<IntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'deteriorating'>('all');
  const router = useRouter();

  useEffect(() => {
    fetchIntelligenceData();
    const interval = setInterval(fetchIntelligenceData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchIntelligenceData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/patient-intelligence');
      const data = await response.json();
      setData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patient intelligence:', error);
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'moderate': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'moderate': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-green-50 border-green-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'worsening': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getFilteredPatients = () => {
    if (!data) return [];
    switch (selectedFilter) {
      case 'critical':
        return data.patients.filter(p => p.intelligence.riskLevel === 'critical');
      case 'deteriorating':
        return data.patients.filter(p => p.intelligence.deteriorating);
      default:
        return data.patients;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredPatients = getFilteredPatients();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Brain className="w-8 h-8 text-indigo-600" />
                PathPilot Intelligence Command Center
              </h1>
              <p className="text-gray-600 mt-1">AI-Powered Lab Intelligence & Clinical Decision Support</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              Last updated: {new Date(data?.timestamp || '').toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{data?.totalPatients || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Risk</p>
                <p className="text-2xl font-bold text-red-600">{data?.criticalCount || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-orange-600">{data?.highRiskCount || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Deteriorating</p>
                <p className="text-2xl font-bold text-purple-600">{data?.deterioratingCount || 0}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stable</p>
                <p className="text-2xl font-bold text-green-600">
                  {(data?.totalPatients || 0) - (data?.criticalCount || 0) - (data?.highRiskCount || 0)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Patients ({data?.totalPatients || 0})
          </button>
          <button
            onClick={() => setSelectedFilter('critical')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedFilter === 'critical'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Critical Only ({data?.criticalCount || 0})
          </button>
          <button
            onClick={() => setSelectedFilter('deteriorating')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedFilter === 'deteriorating'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Deteriorating ({data?.deterioratingCount || 0})
          </button>
        </div>

        {/* Patient Grid */}
        <div className="space-y-4">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => router.push(`/patient/${patient.id}`)}
              className={`bg-white rounded-lg shadow-sm border-2 p-6 cursor-pointer hover:shadow-lg transition-all ${getRiskBgColor(patient.intelligence.riskLevel)}`}
            >
              <div className="grid grid-cols-12 gap-6">
                {/* Patient Info & Risk Score */}
                <div className="col-span-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{patient.name}</h3>
                      <p className="text-sm text-gray-600">
                        {patient.age}y {patient.gender} | MRN: {patient.mrn}
                      </p>
                      <p className="text-sm text-gray-700 font-medium mt-1">
                        {patient.location} | LOS: {patient.los}d
                      </p>
                    </div>
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${getRiskColor(patient.intelligence.riskLevel)}`}>
                        {patient.intelligence.riskScore}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Risk Score</p>
                    </div>
                  </div>
                </div>

                {/* Primary Concern & AI Insights */}
                <div className="col-span-4">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Primary Concern</p>
                    <p className="text-base font-bold text-gray-900">{patient.intelligence.primaryConcern}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Zap className="w-4 h-4 text-indigo-500" />
                      AI Insight
                    </p>
                    <p className="text-sm text-gray-800">{patient.intelligence.aiInsights[0]}</p>
                  </div>
                </div>

                {/* Alerts & Lab Stats */}
                <div className="col-span-3">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Active Alerts</p>
                    <div className="space-y-1">
                      {patient.intelligence.alerts.slice(0, 2).map((alert, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <p className="text-sm text-gray-800">{alert}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Critical:</span>
                      <span className="font-bold text-red-600 ml-1">{patient.intelligence.criticalLabs}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Abnormal:</span>
                      <span className="font-bold text-orange-600 ml-1">{patient.intelligence.abnormalLabs}</span>
                    </div>
                  </div>
                </div>

                {/* Organ Trends & Actions */}
                <div className="col-span-2">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Organ Trends</p>
                    <div className="space-y-1">
                      {Object.entries(patient.intelligence.trends).slice(0, 3).map(([organ, trend]) => (
                        <div key={organ} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 capitalize">{organ}</span>
                          {getTrendIcon(trend)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600">{patient.intelligence.lastUpdate}</div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Deteriorating Badge */}
              {patient.intelligence.deteriorating && (
                <div className="mt-4 pt-4 border-t border-red-200">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-500 animate-pulse" />
                    <span className="text-sm font-bold text-red-600">DETERIORATING</span>
                    <span className="text-sm text-gray-700">- {patient.intelligence.predictedDisposition}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}