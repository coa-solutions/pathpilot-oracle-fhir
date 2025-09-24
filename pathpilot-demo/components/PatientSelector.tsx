'use client';

import React, { useState, useEffect } from 'react';
import { Search, User, Activity, Calendar, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface PatientSummary {
  id: string;
  name: string;
  gender: string;
  age: number | string;
  birthDate: string;
  observationCount: number;
  encounterCount: number;
  conditionCount: number;
  conditions: string[];
  dataQuality: 'excellent' | 'good' | 'moderate';
  clinicalLabel: string;
}

interface PatientSelectorProps {
  currentPatientId: string;
  onPatientSelect: (patientId: string) => void;
}

export default function PatientSelector({ currentPatientId, onPatientSelect }: PatientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'icu' | 'chronic' | 'ed'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen]);

  useEffect(() => {
    filterPatients();
  }, [searchQuery, selectedCategory, patients]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fhir/patients-summary?_count=100');
      const data = await response.json();
      setPatients(data.patients || []);
      setFilteredPatients(data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = [...patients];

    // Category filter
    if (selectedCategory !== 'all') {
      const categoryMap = {
        'icu': 'ICU',
        'chronic': 'Chronic',
        'ed': 'ED'
      };
      filtered = filtered.filter(p =>
        p.clinicalLabel.includes(categoryMap[selectedCategory])
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.clinicalLabel.toLowerCase().includes(query) ||
        p.conditions.some(c => c.toLowerCase().includes(query))
      );
    }

    setFilteredPatients(filtered);
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'good':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getQualityBadge = (quality: string) => {
    const badges = {
      'excellent': 'bg-green-100 text-green-800',
      'good': 'bg-blue-100 text-blue-800',
      'moderate': 'bg-yellow-100 text-yellow-800'
    };
    return badges[quality] || badges.moderate;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const selectPatient = (patient: PatientSummary) => {
    onPatientSelect(patient.id);
    setIsOpen(false);
    // Save to localStorage for recent patients
    const recent = JSON.parse(localStorage.getItem('recentPatients') || '[]');
    const updated = [patient.id, ...recent.filter(id => id !== patient.id)].slice(0, 5);
    localStorage.setItem('recentPatients', JSON.stringify(updated));
  };

  const currentPatient = patients.find(p => p.id === currentPatientId);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
      >
        <User className="w-4 h-4" />
        <div className="text-left">
          <div className="text-sm font-medium">
            {currentPatient ? currentPatient.name : 'Select Patient'}
          </div>
          {currentPatient && (
            <div className="text-xs text-gray-500">
              {currentPatient.clinicalLabel} • {formatNumber(currentPatient.observationCount)} labs
            </div>
          )}
        </div>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold mb-4">Select Patient</h2>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID, condition..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filters */}
              <div className="flex gap-2">
                {(['all', 'icu', 'chronic', 'ed'] as const).map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="text-center py-8">Loading patients...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPatients.map(patient => (
                    <div
                      key={patient.id}
                      onClick={() => selectPatient(patient)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        patient.id === currentPatientId ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      {/* Patient Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{patient.name}</h3>
                          <p className="text-sm text-gray-500">
                            {patient.gender === 'male' ? '♂' : '♀'} {patient.age} years • ID: ...{patient.id.slice(-8)}
                          </p>
                        </div>
                        {getQualityIcon(patient.dataQuality)}
                      </div>

                      {/* Clinical Label */}
                      <div className="mb-2">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getQualityBadge(patient.dataQuality)}`}>
                          {patient.clinicalLabel}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {formatNumber(patient.observationCount)} labs
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {patient.encounterCount} visits
                        </div>
                      </div>

                      {/* Conditions */}
                      {patient.conditions.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {patient.conditions.slice(0, 2).join(' • ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {filteredPatients.length} patients found
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}