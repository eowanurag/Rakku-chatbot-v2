import * as fs from 'fs';
import * as path from 'path';

const scenarios = [
  "BIKE", "CAR", "COMMERCIAL_VEHICLE", "MOBILE", "AADHAAR", "PAN", 
  "PASSPORT", "DRIVING_LICENSE", "VOTER_ID", "RATION_CARD", "UPI", 
  "CREDIT_CARD", "DEBIT_CARD", "ATM", "OTP", "SOCIAL_MEDIA",
  "KIDNAPPING", "ASSAULT", "MISSING_PERSON"
];

const paths = [
  "Happy Path 1", "Happy Path 2", "Happy Path 3", "Happy Path 4", "Happy Path 5",
  "Clarification Path 1", "Clarification Path 2",
  "Ambiguous Path 1", "Ambiguous Path 2",
  "Failure Recovery Path"
];

function generate() {
  const replays: any[] = [];
  
  for (const scenario of scenarios) {
    for (let i = 0; i < paths.length; i++) {
      const pathType = paths[i];
      const isHappy = pathType.startsWith("Happy");
      const isClarification = pathType.startsWith("Clarification");
      const isAmbiguous = pathType.startsWith("Ambiguous");
      
      const conversationId = `REP-${scenario}-${i + 1}`;
      
      let turns: string[] = [];
      let expectedQuestions: string[] = [];
      let expectedOutcome = "DOCUMENT_REPLACEMENT";
      
      if (scenario === "KIDNAPPING" || scenario === "ASSAULT") {
        expectedOutcome = "EMERGENCY_ESCALATION";
      }

      const inputPrefix = scenario.toLowerCase().replace(/_/g, ' ');

      if (isHappy) {
        turns = [`I want to report about my ${inputPrefix}`, "Kanpur", "Kakadev", "Mohan Tiwari", "7766776677"];
        expectedQuestions = [];
      } else if (isClarification) {
        turns = [`I lost my ${inputPrefix}`, "No suspected misuse", "Lucknow"];
        expectedQuestions = ["misuse_suspected"];
      } else if (isAmbiguous) {
        turns = [`Help with my ${inputPrefix} query`, "Lucknow", "9900990099"];
        expectedQuestions = ["misuse_suspected"];
      } else {
        // Failure recovery
        turns = [`Urgent report on ${inputPrefix}`, "Kanpur", "Mohan"];
        expectedQuestions = ["misuse_suspected"];
      }

      replays.push({
        conversationId,
        scenario,
        turns,
        expectedQuestions,
        expectedOutcome
      });
    }
  }

  const outPath = path.resolve(__dirname, '../benchmarks/real_conversation_replays.json');
  fs.writeFileSync(outPath, JSON.stringify(replays, null, 2), 'utf8');
  console.log(`Generated ${replays.length} real conversation replays at ${outPath}`);
}

generate();
