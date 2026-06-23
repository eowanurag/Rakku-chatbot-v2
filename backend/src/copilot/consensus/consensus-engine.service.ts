import { Injectable } from '@nestjs/common';

export interface ConsensusResult {
  intent: string;
  confidence: number;
  confidenceScore: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  recommendations: string[];
  riskLevel?: string;
  clarificationRequired?: boolean;
  frictionRisk?: string;
  complaintQuality?: string;
  isEmergency?: boolean;
  completionPercentage?: number;
}

@Injectable()
export class ConsensusEngineService {
  public getConsensus(
    cueResult: any,
    cieResult: any,
    saeResult: any,
    sreResult: any,
    dbCieResult: any,
    frictionResult?: any,
    qualityResult?: any,
    progressResult?: any
  ): ConsensusResult {
    let intent = cueResult?.intent || saeResult?.intent || 'UNKNOWN';
    let confidence = saeResult?.confidence || cueResult?.confidence || 0.5;
    
    // Conflict resolution: CIE Complaint vs. SAE Emergency (High/Critical risk)
    const isEmergency = saeResult?.urgency === 'HIGH' || saeResult?.urgency === 'CRITICAL' || saeResult?.clarificationType === 'EMERGENCY_FAST_PATH';
    const isComplaint = cieResult?.complaintReadinessScore > 0 || intent === 'COMPLAINT';
    
    let clarificationRequired = saeResult?.requiresClarification || false;
    if (isEmergency && isComplaint) {
      clarificationRequired = true;
    }

    // Map confidence score to VERY_LOW, LOW, MEDIUM, HIGH, VERY_HIGH
    let confidenceScore: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' = 'MEDIUM';
    if (confidence >= 0.95) {
      confidenceScore = 'VERY_HIGH';
    } else if (confidence >= 0.80) {
      confidenceScore = 'HIGH';
    } else if (confidence >= 0.60) {
      confidenceScore = 'MEDIUM';
    } else if (confidence >= 0.40) {
      confidenceScore = 'LOW';
    } else {
      confidenceScore = 'VERY_LOW';
    }

    const recommendations = [
      ...(saeResult?.recommendedServices || []),
      ...(sreResult || [])
    ];

    // Filter unique recommendations
    const uniqueRecs = Array.from(new Set(recommendations));

    return {
      intent,
      confidence,
      confidenceScore,
      recommendations: uniqueRecs,
      riskLevel: saeResult?.urgency || 'LOW',
      clarificationRequired,
      frictionRisk: frictionResult?.risk || 'LOW',
      complaintQuality: qualityResult?.score || 'GOOD',
      isEmergency: !!isEmergency,
      completionPercentage: progressResult?.completionPercentage || 0
    };
  }
}
