import { ScenarioHintResult } from '../interfaces/scenario-hint-result.interface';

export class HintConsensusEngine {
  public resolveConsensus(results: ScenarioHintResult[]): {
    acceptedHints: string[];
    rejectedHints: string[];
    consensusScore: number;
    sources: Record<string, string[]>;
  } {
    if (results.length === 0) {
      return { acceptedHints: [], rejectedHints: [], consensusScore: 1.0, sources: {} };
    }

    const voteCounts: Record<string, number> = {};
    const sourcesMap: Record<string, string[]> = {};

    for (const res of results) {
      const distinctHintsInRes = Array.from(new Set(res.scenarioHints));
      for (const hint of distinctHintsInRes) {
        voteCounts[hint] = (voteCounts[hint] || 0) + 1;
        
        if (!sourcesMap[hint]) {
          sourcesMap[hint] = [];
        }
        if (res.hintSource) {
          for (const src of res.hintSource) {
            if (!sourcesMap[hint].includes(src)) {
              sourcesMap[hint].push(src);
            }
          }
        }
      }
    }

    const acceptedHints: string[] = [];
    const rejectedHints: string[] = [];

    // Majority threshold calculation
    // If only 1 provider, threshold is 1. If 2, threshold is 1. If 3, threshold is 2.
    // Generally: Math.max(1, Math.ceil(results.length / 2))
    const threshold = Math.max(1, Math.ceil(results.length / 2));

    // Sort tags alphabetically to ensure absolute determinism
    const allHints = Object.keys(voteCounts).sort();

    for (const hint of allHints) {
      const votes = voteCounts[hint];
      if (votes >= threshold) {
        acceptedHints.push(hint);
      } else {
        rejectedHints.push(hint);
      }
    }

    // Consensus score: ratio of accepted hints to total proposed distinct hints
    const totalProposed = acceptedHints.length + rejectedHints.length;
    const consensusScore = totalProposed > 0 ? parseFloat((acceptedHints.length / totalProposed).toFixed(2)) : 1.0;

    return {
      acceptedHints,
      rejectedHints,
      consensusScore,
      sources: sourcesMap
    };
  }
}
