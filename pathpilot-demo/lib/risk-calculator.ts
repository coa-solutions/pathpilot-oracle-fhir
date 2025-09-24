import { LabResult } from './types';

export interface RiskScore {
  score: number;
  level: 'critical' | 'high' | 'moderate' | 'low';
  factors: RiskFactor[];
}

export interface RiskFactor {
  name: string;
  weight: number;
  value: string;
  contribution: number;
}

export interface OrganSystemRisk {
  system: string;
  score: number;
  trend: 'worsening' | 'stable' | 'improving';
  markers: string[];
}

export class RiskScoreCalculator {
  /**
   * Calculate overall patient risk score based on lab results
   */
  static calculatePatientRisk(labs: LabResult[]): RiskScore {
    const factors: RiskFactor[] = [];
    let totalScore = 0;

    // Group labs by recency
    const recentLabs = labs.filter(lab => {
      const labDate = new Date(lab.effectiveDateTime);
      const daysSince = (Date.now() - labDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 2;
    });

    // Critical value scoring
    const criticalCount = recentLabs.filter(l => l.status === 'critical').length;
    if (criticalCount > 0) {
      const criticalScore = Math.min(criticalCount * 15, 45);
      factors.push({
        name: 'Critical Values',
        weight: 0.35,
        value: `${criticalCount} critical`,
        contribution: criticalScore
      });
      totalScore += criticalScore;
    }

    // Abnormal value scoring
    const abnormalCount = recentLabs.filter(l => l.status === 'abnormal').length;
    if (abnormalCount > 0) {
      const abnormalScore = Math.min(abnormalCount * 3, 30);
      factors.push({
        name: 'Abnormal Values',
        weight: 0.25,
        value: `${abnormalCount} abnormal`,
        contribution: abnormalScore
      });
      totalScore += abnormalScore;
    }

    // Specific high-risk markers
    const highRiskMarkers = this.checkHighRiskMarkers(recentLabs);
    if (highRiskMarkers.score > 0) {
      factors.push({
        name: 'High-Risk Markers',
        weight: 0.40,
        value: highRiskMarkers.markers.join(', '),
        contribution: highRiskMarkers.score
      });
      totalScore += highRiskMarkers.score;
    }

    // Determine risk level
    let level: 'critical' | 'high' | 'moderate' | 'low';
    if (totalScore >= 80) level = 'critical';
    else if (totalScore >= 60) level = 'high';
    else if (totalScore >= 40) level = 'moderate';
    else level = 'low';

    return {
      score: Math.min(totalScore, 100),
      level,
      factors
    };
  }

  /**
   * Check for specific high-risk lab patterns
   */
  private static checkHighRiskMarkers(labs: LabResult[]): { score: number; markers: string[] } {
    const markers: string[] = [];
    let score = 0;

    // Check for AKI markers
    const creatinine = labs.find(l => l.code.toLowerCase().includes('creatinine'));
    if (creatinine && creatinine.status !== 'normal') {
      const value = parseFloat(String(creatinine.value));
      if (!isNaN(value) && value > 2.0) {
        markers.push('AKI Risk');
        score += 15;
      }
    }

    // Check for sepsis markers
    const wbc = labs.find(l => l.code.toLowerCase().includes('wbc') || l.code.toLowerCase().includes('white'));
    const lactate = labs.find(l => l.code.toLowerCase().includes('lactate'));
    if ((wbc && wbc.status === 'critical') || (lactate && parseFloat(lactate.value) > 2)) {
      markers.push('Sepsis Risk');
      score += 20;
    }

    // Check for liver dysfunction
    const bilirubin = labs.find(l => l.code.toLowerCase().includes('bilirubin'));
    const alt = labs.find(l => l.code.toLowerCase().includes('alt') || l.code.toLowerCase().includes('alanine'));
    if ((bilirubin && bilirubin.status !== 'normal') || (alt && alt.status !== 'normal')) {
      markers.push('Hepatic Dysfunction');
      score += 10;
    }

    // Check for coagulopathy
    const inr = labs.find(l => l.code.toLowerCase().includes('inr'));
    const plt = labs.find(l => l.code.toLowerCase().includes('platelet') || l.code.toLowerCase().includes('plt'));
    if ((inr && parseFloat(inr.value) > 2) || (plt && parseFloat(plt.value) < 50)) {
      markers.push('Coagulopathy');
      score += 15;
    }

    return { score, markers };
  }

  /**
   * Calculate organ system-specific risks
   */
  static calculateOrganSystemRisks(labs: LabResult[]): OrganSystemRisk[] {
    const systems: OrganSystemRisk[] = [];

    // Renal system
    const renalLabs = labs.filter(l =>
      l.code.toLowerCase().includes('creatinine') ||
      l.code.toLowerCase().includes('bun') ||
      l.code.toLowerCase().includes('egfr')
    );
    if (renalLabs.length > 0) {
      systems.push(this.assessRenalRisk(renalLabs));
    }

    // Cardiac system
    const cardiacLabs = labs.filter(l =>
      l.code.toLowerCase().includes('troponin') ||
      l.code.toLowerCase().includes('bnp') ||
      l.code.toLowerCase().includes('ck')
    );
    if (cardiacLabs.length > 0) {
      systems.push(this.assessCardiacRisk(cardiacLabs));
    }

    // Hepatic system
    const hepaticLabs = labs.filter(l =>
      l.code.toLowerCase().includes('alt') ||
      l.code.toLowerCase().includes('ast') ||
      l.code.toLowerCase().includes('bilirubin') ||
      l.code.toLowerCase().includes('albumin')
    );
    if (hepaticLabs.length > 0) {
      systems.push(this.assessHepaticRisk(hepaticLabs));
    }

    return systems;
  }

  private static assessRenalRisk(labs: LabResult[]): OrganSystemRisk {
    const abnormalCount = labs.filter(l => l.status !== 'normal').length;
    const criticalCount = labs.filter(l => l.status === 'critical').length;
    const score = Math.min((abnormalCount * 10) + (criticalCount * 20), 100);

    return {
      system: 'Renal',
      score,
      trend: criticalCount > 0 ? 'worsening' : abnormalCount > 0 ? 'stable' : 'improving',
      markers: labs.map(l => l.name)
    };
  }

  private static assessCardiacRisk(labs: LabResult[]): OrganSystemRisk {
    const abnormalCount = labs.filter(l => l.status !== 'normal').length;
    const criticalCount = labs.filter(l => l.status === 'critical').length;
    const score = Math.min((abnormalCount * 15) + (criticalCount * 25), 100);

    return {
      system: 'Cardiac',
      score,
      trend: criticalCount > 0 ? 'worsening' : abnormalCount > 0 ? 'stable' : 'improving',
      markers: labs.map(l => l.name)
    };
  }

  private static assessHepaticRisk(labs: LabResult[]): OrganSystemRisk {
    const abnormalCount = labs.filter(l => l.status !== 'normal').length;
    const criticalCount = labs.filter(l => l.status === 'critical').length;
    const score = Math.min((abnormalCount * 8) + (criticalCount * 18), 100);

    return {
      system: 'Hepatic',
      score,
      trend: criticalCount > 0 ? 'worsening' : abnormalCount > 0 ? 'stable' : 'improving',
      markers: labs.map(l => l.name)
    };
  }

  /**
   * Calculate MELD score for liver disease severity
   */
  static calculateMELD(labs: LabResult[]): number | null {
    const bilirubin = labs.find(l => l.code.toLowerCase().includes('bilirubin'));
    const inr = labs.find(l => l.code.toLowerCase().includes('inr'));
    const creatinine = labs.find(l => l.code.toLowerCase().includes('creatinine'));

    if (!bilirubin || !inr || !creatinine) return null;

    const bilirubinValue = parseFloat(bilirubin.value);
    const inrValue = parseFloat(inr.value);
    const creatinineValue = parseFloat(creatinine.value);

    if (isNaN(bilirubinValue) || isNaN(inrValue) || isNaN(creatinineValue)) return null;

    // MELD = 3.78×ln[serum bilirubin] + 11.2×ln[INR] + 9.57×ln[serum creatinine] + 6.43
    const meld = 3.78 * Math.log(Math.max(bilirubinValue, 1)) +
                 11.2 * Math.log(Math.max(inrValue, 1)) +
                 9.57 * Math.log(Math.max(creatinineValue, 1)) +
                 6.43;

    return Math.round(Math.min(Math.max(meld, 6), 40));
  }

  /**
   * Detect deterioration patterns
   */
  static detectDeterioration(currentLabs: LabResult[], previousLabs: LabResult[]): boolean {
    if (previousLabs.length === 0) return false;

    // Count worsening trends
    let worseningCount = 0;

    currentLabs.forEach(currentLab => {
      const previousLab = previousLabs.find(p => p.code === currentLab.code);
      if (!previousLab) return;

      // Check if status worsened
      if (currentLab.status === 'critical' && previousLab.status !== 'critical') {
        worseningCount++;
      } else if (currentLab.status === 'abnormal' && previousLab.status === 'normal') {
        worseningCount++;
      }

      // Check numeric trends for key markers
      const currentValue = parseFloat(currentLab.value);
      const previousValue = parseFloat(previousLab.value);

      if (!isNaN(currentValue) && !isNaN(previousValue)) {
        const percentChange = ((currentValue - previousValue) / previousValue) * 100;

        // Flag significant worsening
        if (currentLab.code.toLowerCase().includes('creatinine') && percentChange > 25) {
          worseningCount++;
        }
        if (currentLab.code.toLowerCase().includes('lactate') && percentChange > 20) {
          worseningCount++;
        }
      }
    });

    return worseningCount >= 3;
  }
}