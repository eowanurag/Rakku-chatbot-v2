import axios from 'axios';
import { TimelineEvent } from '../interfaces/complaint-intelligence.interface';

export class TimelineReconstructor {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
  }

  public async reconstruct(text: string): Promise<TimelineEvent[]> {
    const cleanText = text.toLowerCase();
    const events: TimelineEvent[] = [];

    // Local basic time triggers
    if (cleanText.includes('9 am') || cleanText.includes('9am')) {
      events.push({ time: '09:00', eventDescription: 'Left home / Started journey' });
    }
    if (cleanText.includes('11 am') || cleanText.includes('11am')) {
      events.push({ time: '11:00', eventDescription: 'Noticed incident / loss' });
    }

    if (this.apiKey) {
      const prompt = `
Analyze the following narrative and extract chronological events with dates and times if mentioned.
Return a JSON object containing:
{
  "events": [
    {
      "time": string, // e.g. "09:00" (optional)
      "date": string, // e.g. "2026-06-12" (optional)
      "eventDescription": string
    }
  ]
}

Narrative: "${text}"
`;

      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const contentText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (contentText) {
          const parsed = JSON.parse(contentText);
          if (parsed.events && parsed.events.length > 0) {
            // Overwrite with detailed chronological array from AI
            const aiEvents = parsed.events.map((e: any) => ({
              time: e.time || undefined,
              date: e.date || undefined,
              eventDescription: e.eventDescription
            }));

            // Sort AI events chronologically by time/date
            aiEvents.sort((a: any, b: any) => {
              if (a.date && b.date && a.date !== b.date) {
                return a.date.localeCompare(b.date);
              }
              if (a.time && b.time) {
                return a.time.localeCompare(b.time);
              }
              return 0;
            });

            return aiEvents;
          }
        }
      } catch (e: any) {
        console.error('Gemini TimelineReconstructor error:', e?.message || e);
      }
    }

    // Sort basic local events
    events.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    return events;
  }
}
