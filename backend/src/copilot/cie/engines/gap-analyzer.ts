import { MissingFactField, ExtractedFact, IncidentModel } from '../interfaces/complaint-intelligence.interface';

export class GapAnalyzer {
  public analyze(
    incidentType: string,
    facts: ExtractedFact[],
    model: Partial<IncidentModel>
  ): {
    completenessScore: number;
    complaintReadinessScore: number;
    firReadinessScore: number;
    missingInformation: MissingFactField[];
  } {
    const missingInformation: MissingFactField[] = [];

    // Define mandatory fields by incidentType
    const requiredFields: Record<string, { field: string; reason: string; priority: "LOW" | "MEDIUM" | "HIGH"; isFirMandatory: boolean }[]> = {
      LOST_MOBILE: [
        { field: "property_brand", reason: "Required to identify mobile manufacturer", priority: "HIGH", isFirMandatory: true },
        { field: "property_model", reason: "Required to identify specific device type", priority: "HIGH", isFirMandatory: true },
        { field: "incident_location", reason: "Required to determine jurisdiction routing", priority: "HIGH", isFirMandatory: true },
        { field: "incident_date", reason: "Required for incident timeline logging", priority: "MEDIUM", isFirMandatory: true },
        { field: "property_color", reason: "Improves visual matching capability", priority: "LOW", isFirMandatory: false },
        { field: "imei", reason: "Required for digital device tracking / blacklisting", priority: "MEDIUM", isFirMandatory: true }
      ],
      CYBER_FRAUD: [
        { field: "transaction_id", reason: "Required to trace banking transfer details", priority: "HIGH", isFirMandatory: true },
        { field: "bank_name", reason: "Required to contact security cells", priority: "HIGH", isFirMandatory: true },
        { field: "incident_date", reason: "Required to trigger Golden Hour reversal", priority: "HIGH", isFirMandatory: true },
        { field: "incident_location", reason: "Required for local jurisdiction mapping", priority: "MEDIUM", isFirMandatory: true }
      ]
    };

    const rules = requiredFields[incidentType] || [
      { field: "incident_location", reason: "Required for routing", priority: "HIGH", isFirMandatory: true },
      { field: "incident_date", reason: "Required for verification", priority: "HIGH", isFirMandatory: true }
    ];

    let foundCount = 0;
    let foundFirCount = 0;
    let firTotal = 0;

    for (const rule of rules) {
      if (rule.isFirMandatory) {
        firTotal++;
      }

      const fact = facts.find(f => f.field === rule.field);
      if (fact && fact.value && fact.value.trim() !== '') {
        foundCount++;
        if (rule.isFirMandatory) {
          foundFirCount++;
        }
      } else {
        missingInformation.push({
          field: rule.field,
          reason: rule.reason,
          priority: rule.priority
        });
      }
    }

    const totalCount = rules.length;
    const completenessScore = totalCount > 0 ? foundCount / totalCount : 1.0;
    const complaintReadinessScore = completenessScore;
    const firReadinessScore = firTotal > 0 ? foundFirCount / firTotal : 1.0;

    return {
      completenessScore,
      complaintReadinessScore,
      firReadinessScore,
      missingInformation
    };
  }
}
