'use client';

import { LabTrend } from '@/lib/types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LabTrendChartProps {
  trend: LabTrend;
}

export default function LabTrendChart({ trend }: LabTrendChartProps) {
  const trendIcon = trend.trend === 'rising' ? (
    <TrendingUp className="w-4 h-4 text-orange-500" />
  ) : trend.trend === 'falling' ? (
    <TrendingDown className="w-4 h-4 text-blue-500" />
  ) : (
    <Minus className="w-4 h-4 text-gray-600" />
  );

  const chartData = {
    labels: trend.data.map(d => format(parseISO(d.date), 'MMM dd')),
    datasets: [
      {
        label: trend.labName,
        data: trend.data.map(d => d.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        pointBackgroundColor: trend.data.map(d => {
          switch (d.status) {
            case 'critical': return 'rgb(239, 68, 68)';
            case 'abnormal': return 'rgb(245, 158, 11)';
            default: return 'rgb(34, 197, 94)';
          }
        }),
        pointBorderColor: trend.data.map(d => {
          switch (d.status) {
            case 'critical': return 'rgb(239, 68, 68)';
            case 'abnormal': return 'rgb(245, 158, 11)';
            default: return 'rgb(34, 197, 94)';
          }
        }),
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.parsed.y} ${trend.unit}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: trend.unit
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{trend.labName}</h3>
          <div className="flex items-center gap-2">
            {trendIcon}
            <span className="text-sm text-gray-600">{trend.trend}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Current:</span>
            <p className="font-bold text-lg">
              {trend.currentValue} {trend.unit}
            </p>
          </div>

          {trend.previousValue !== undefined && (
            <div>
              <span className="text-gray-600">Previous:</span>
              <p className="font-medium">
                {trend.previousValue} {trend.unit}
              </p>
            </div>
          )}

          {trend.delta !== undefined && (
            <div>
              <span className="text-gray-600">Change:</span>
              <p className={`font-medium ${trend.delta > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                {trend.delta > 0 ? '+' : ''}{trend.delta.toFixed(2)} {trend.unit}
              </p>
            </div>
          )}

          {trend.deltaPercent !== undefined && (
            <div>
              <span className="text-gray-600">% Change:</span>
              <p className={`font-medium ${trend.deltaPercent > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                {trend.deltaPercent > 0 ? '+' : ''}{trend.deltaPercent.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>

      <div className="mt-4 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-600">Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
          <span className="text-gray-600">Abnormal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-600">Critical</span>
        </div>
      </div>
    </div>
  );
}