'use client';

import { LabResult } from '@/lib/types';
import { AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface CriticalAlertsProps {
  labs: LabResult[];
  loading: boolean;
}

export default function CriticalAlerts({ labs, loading }: CriticalAlertsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const criticalLabs = labs.filter(lab => lab.status === 'critical');
  const abnormalLabs = labs.filter(lab => lab.status === 'abnormal');

  if (criticalLabs.length === 0 && abnormalLabs.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900">All Clear</h3>
            <p className="text-green-700 text-sm">All recent lab values are within normal limits</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {criticalLabs.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-3">
                Critical Values Requiring Immediate Attention
              </h3>
              <div className="space-y-2">
                {criticalLabs.slice(0, 3).map((lab) => (
                  <div key={lab.id} className="bg-white rounded-md p-3 border border-red-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{lab.name}</p>
                        <p className="text-lg font-bold text-red-600">
                          {lab.value} {lab.unit}
                        </p>
                        {lab.referenceRange?.text && (
                          <p className="text-xs text-gray-600">
                            Normal: {lab.referenceRange.text}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock className="w-3 h-3" />
                          {format(parseISO(lab.effectiveDateTime), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {abnormalLabs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2">
                Abnormal Values for Review
              </h3>
              <p className="text-sm text-amber-700">
                {abnormalLabs.length} lab value{abnormalLabs.length !== 1 ? 's are' : ' is'} outside normal range
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}