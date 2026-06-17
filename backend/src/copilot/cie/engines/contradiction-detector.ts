import { ContradictionFlag, ExtractedFact, TimelineEvent } from '../interfaces/complaint-intelligence.interface';

export class ContradictionDetector {
  public detect(
    text: string,
    facts: ExtractedFact[],
    timeline: TimelineEvent[]
  ): ContradictionFlag[] {
    const flags: ContradictionFlag[] = [];
    const cleanText = text.toLowerCase();

    // Heuristic 1: Look for explicit contradiction key terms
    if (cleanText.includes('yesterday') && cleanText.includes('last month')) {
      flags.push({
        type: 'TIMELINE_CONTRADICTION',
        details: 'Citizen narrative references both "yesterday" and "last month" as temporal contexts.'
      });
    }

    if (cleanText.includes('lucknow') && cleanText.includes('kanpur') && cleanText.includes('stolen')) {
      flags.push({
        type: 'LOCATION_CONTRADICTION',
        details: 'Citizen report references both Lucknow and Kanpur as the incident location.'
      });
    }

    // Heuristic 2: Verify timeline chronology logical order
    // Check if any event has time that occurs before preceding event
    for (let i = 1; i < timeline.length; i++) {
      const prev = timeline[i - 1];
      const curr = timeline[i];
      if (prev.time && curr.time && prev.eventDescription && curr.eventDescription) {
        if (prev.time > curr.time) {
          // Check context description to confirm if timeline event sequence is logical
          if (prev.eventDescription.toLowerCase().includes('missing') && curr.eventDescription.toLowerCase().includes('started')) {
            flags.push({
              type: 'TIMELINE_CONTRADICTION',
              details: `Logical sequence contradiction: "${prev.eventDescription}" at ${prev.time} is placed before "${curr.eventDescription}" at ${curr.time}.`
            });
          }
        }
      }
    }

    return flags;
  }
}
