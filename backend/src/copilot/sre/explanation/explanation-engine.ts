export class ExplanationEngine {
  generateExplanation(scenario: string, collectedData: Record<string, any>, risk: string, outcome: string, scenarioPath?: string[]): string[] {
    const summary: string[] = [];
    
    if (scenarioPath && scenarioPath.length >= 3 && scenarioPath[0] === 'LOSS' && scenarioPath[1] === 'DOCUMENT' && scenarioPath[2] === 'AADHAAR') {
      summary.push("I understand that your Aadhaar document appears to have been lost. Based on the information provided, replacement guidance and identity protection steps may be required.");
      return summary;
    }

    summary.push(`We have identified the scenario as ${scenario}.`);
    
    if (Object.keys(collectedData).length > 0) {
      summary.push(`Based on the details provided: ${JSON.stringify(collectedData)}.`);
    }

    if (risk === 'HIGH' || risk === 'CRITICAL') {
      summary.push(`This situation is flagged as ${risk} risk.`);
    }

    summary.push(`Recommended Outcome: ${outcome}`);
    return summary;
  }
}
