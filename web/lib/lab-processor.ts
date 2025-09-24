import { LabResult, LabTrend } from './types';

export class LabProcessor {
  static processLabTrends(labResults: LabResult[]): LabTrend[] {
    const groupedLabs = this.groupLabsByType(labResults);
    const trends: LabTrend[] = [];

    for (const [labName, results] of Object.entries(groupedLabs)) {
      const sortedResults = results.sort((a, b) =>
        new Date(b.effectiveDateTime).getTime() - new Date(a.effectiveDateTime).getTime()
      );

      const numericResults = sortedResults.filter(r => typeof r.value === 'number');

      if (numericResults.length === 0) continue;

      const currentValue = numericResults[0].value as number;
      const previousValue = numericResults[1]?.value as number | undefined;

      let delta: number | undefined;
      let deltaPercent: number | undefined;
      let trend: 'rising' | 'falling' | 'stable' = 'stable';

      if (previousValue !== undefined) {
        delta = currentValue - previousValue;
        deltaPercent = ((delta / previousValue) * 100);

        if (Math.abs(deltaPercent) < 5) {
          trend = 'stable';
        } else if (delta > 0) {
          trend = 'rising';
        } else {
          trend = 'falling';
        }
      }

      trends.push({
        labName,
        code: results[0].code,
        unit: results[0].unit,
        data: numericResults.slice(0, 10).map(r => ({
          date: r.effectiveDateTime,
          value: r.value as number,
          status: r.status
        })).reverse(),
        currentValue,
        previousValue,
        delta,
        deltaPercent,
        trend
      });
    }

    return trends;
  }

  private static groupLabsByType(labResults: LabResult[]): { [key: string]: LabResult[] } {
    const grouped: { [key: string]: LabResult[] } = {};

    for (const result of labResults) {
      const key = result.name;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(result);
    }

    return grouped;
  }

  static getCriticalLabs(labResults: LabResult[]): LabResult[] {
    return labResults.filter(lab => lab.status === 'critical');
  }

  static getAbnormalLabs(labResults: LabResult[]): LabResult[] {
    return labResults.filter(lab => lab.status === 'abnormal' || lab.status === 'critical');
  }

  static calculateEGFR(creatinine: number, age: number, isFemale: boolean, isBlack: boolean = false): number {
    // CKD-EPI equation
    const k = isFemale ? 0.7 : 0.9;
    const a = isFemale ? -0.329 : -0.411;
    const min = Math.min(creatinine / k, 1);
    const max = Math.max(creatinine / k, 1);

    let eGFR = 141 * Math.pow(min, a) * Math.pow(max, -1.209) * Math.pow(0.993, age);

    if (isFemale) {
      eGFR *= 1.018;
    }

    if (isBlack) {
      eGFR *= 1.159;
    }

    return Math.round(eGFR);
  }

  static getLabNarrative(lab: LabResult, trend?: LabTrend): string {
    const trendText = trend ? this.getTrendNarrative(trend) : '';
    const statusText = this.getStatusNarrative(lab);
    const contextText = this.getContextNarrative(lab);

    return `${lab.name}: ${lab.value} ${lab.unit}. ${statusText} ${trendText} ${contextText}`.trim();
  }

  private static getTrendNarrative(trend: LabTrend): string {
    if (!trend.delta || !trend.deltaPercent) return '';

    const direction = trend.trend === 'rising' ? 'increased' : trend.trend === 'falling' ? 'decreased' : 'remained stable';
    const amount = Math.abs(trend.deltaPercent).toFixed(1);

    if (trend.trend === 'stable') {
      return 'The value has remained relatively stable.';
    }

    return `The value has ${direction} by ${amount}% since the last test.`;
  }

  private static getStatusNarrative(lab: LabResult): string {
    switch (lab.status) {
      case 'critical':
        return 'This is a CRITICAL value requiring immediate attention.';
      case 'abnormal':
        return 'This value is outside the normal range.';
      case 'normal':
        return 'This value is within normal limits.';
      default:
        return '';
    }
  }

  private static getContextNarrative(lab: LabResult): string {
    const contexts: { [key: string]: string } = {
      'Potassium': 'Important for heart and muscle function.',
      'Creatinine': 'Indicates kidney function.',
      'Hemoglobin': 'Carries oxygen in red blood cells.',
      'Glucose': 'Blood sugar level.',
      'Sodium': 'Maintains fluid balance.',
      'Platelet': 'Essential for blood clotting.'
    };

    const context = Object.entries(contexts).find(([key]) =>
      lab.name.toLowerCase().includes(key.toLowerCase())
    );

    return context ? context[1] : '';
  }

  static getRecentLabsSummary(labResults: LabResult[]): string {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);

    const recentLabs = labResults.filter(lab =>
      new Date(lab.effectiveDateTime) > recentDate
    );

    const critical = recentLabs.filter(lab => lab.status === 'critical').length;
    const abnormal = recentLabs.filter(lab => lab.status === 'abnormal').length;

    if (critical > 0) {
      return `⚠️ ${critical} critical lab value${critical > 1 ? 's' : ''} in the past week requiring immediate attention.`;
    } else if (abnormal > 0) {
      return `${abnormal} abnormal lab value${abnormal > 1 ? 's' : ''} in the past week requiring review.`;
    } else if (recentLabs.length > 0) {
      return `✓ All ${recentLabs.length} recent lab values are within normal limits.`;
    } else {
      return 'No recent lab results in the past week.';
    }
  }
}