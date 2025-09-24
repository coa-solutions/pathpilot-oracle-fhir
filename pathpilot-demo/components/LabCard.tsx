'use client';

import { LabResult } from '@/lib/types';
import { Clock, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface LabCardProps {
  lab: LabResult;
}

export default function LabCard({ lab }: LabCardProps) {
  const statusColors = {
    normal: 'bg-green-100 text-green-800 border-green-200',
    abnormal: 'bg-amber-100 text-amber-800 border-amber-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusBadgeColors = {
    normal: 'bg-green-500',
    abnormal: 'bg-amber-500',
    critical: 'bg-red-500'
  };

  return (
    <div className={`rounded-lg border p-4 ${statusColors[lab.status]}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{lab.name}</h4>
          <p className="text-xs text-gray-600 mt-1">Code: {lab.code}</p>
        </div>
        <div className={`w-2 h-2 rounded-full ${statusBadgeColors[lab.status]}`}></div>
      </div>

      <div className="mb-3">
        <p className="text-2xl font-bold text-gray-900">
          {lab.value}
          {lab.unit && <span className="text-lg font-normal ml-1">{lab.unit}</span>}
        </p>
        {lab.referenceRange && (
          <p className="text-xs text-gray-600 mt-1">
            Normal: {lab.referenceRange.low && `${lab.referenceRange.low} -`}
            {lab.referenceRange.high && ` ${lab.referenceRange.high}`}
            {lab.referenceRange.text && ` (${lab.referenceRange.text})`}
            {lab.unit && ` ${lab.unit}`}
          </p>
        )}
      </div>

      {lab.interpretation && (
        <div className="flex items-start gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-xs">{lab.interpretation}</p>
        </div>
      )}

      <div className="flex items-center gap-1 text-xs text-gray-600">
        <Clock className="w-3 h-3" />
        <span>{format(parseISO(lab.effectiveDateTime), 'MMM dd, yyyy HH:mm')}</span>
      </div>
    </div>
  );
}