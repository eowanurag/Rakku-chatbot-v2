const fs = require('fs');
const path = require('path');

const logPath = "C:\\Users\\acer\\.gemini\\antigravity-ide\\brain\\5b6999c6-5211-4276-b0e9-be105d6bffbb\\.system_generated\\logs\\transcript.jsonl";
const outputPath = path.join(__dirname, 'recover_chat_service.txt');

const lines = fs.readFileSync(logPath, 'utf8').split('\n');

let out = "";
for (let i = 0; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  try {
    const obj = JSON.parse(lines[i]);
    if (obj.tool_calls) {
      for (const tc of obj.tool_calls) {
        if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
          const args = typeof tc.args === 'string' ? JSON.parse(tc.args) : tc.args;
          const target = args.TargetFile || args.TargetFile;
          if (target && target.includes('chat.service.ts')) {
            out += `--- STEP ${obj.step_index} (${tc.name}) ---\n`;
            out += JSON.stringify(args, null, 2);
            out += "\n\n";
          }
        }
      }
    }
  } catch (e) {
    // console.error(e);
  }
}

fs.writeFileSync(outputPath, out);
console.log(`Saved output to ${outputPath}`);
