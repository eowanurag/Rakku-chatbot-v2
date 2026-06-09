const fs = require('fs');
const path = require('path');

const servicePath = path.join(__dirname, 'src', 'chat', 'chat.service.ts');
const recoverLogPath = path.join(__dirname, 'recover_chat_service.txt');

// Reset to clean git state first to make sure we start from HEAD
const execSync = require('child_process').execSync;
console.log("Resetting chat.service.ts to HEAD...");
execSync(`git checkout src/chat/chat.service.ts`, { cwd: __dirname });

let content = fs.readFileSync(servicePath, 'utf8');

const rawLog = fs.readFileSync(recoverLogPath, 'utf8');
const sections = rawLog.split('--- STEP ');

// We want to apply steps 153, 161, 165, 250, 254, 258, 264, 529, 580, 609, 649, 677, 683, 697, 705, 709
const stepsToApply = [153, 161, 165, 250, 254, 258, 264, 529, 580, 609, 649, 677, 683, 697, 705, 709];

for (const section of sections) {
  if (!section.trim()) continue;
  const match = section.match(/^(\d+)/);
  if (!match) continue;
  const stepNum = parseInt(match[1]);
  if (!stepsToApply.includes(stepNum)) continue;

  console.log(`Applying STEP ${stepNum}...`);
  const jsonStr = section.substring(section.indexOf('{'));
  const edit = JSON.parse(jsonStr);

  if (edit.ReplacementContent && edit.TargetContent) {
    const target = JSON.parse(`"${edit.TargetContent.trim().replace(/^"/, '').replace(/"$/, '')}"`);
    const replacement = JSON.parse(`"${edit.ReplacementContent.trim().replace(/^"/, '').replace(/"$/, '')}"`);
    
    // Simple direct replace
    if (!content.includes(target)) {
      console.error(`Target not found for STEP ${stepNum}!`);
      // Let's try matching with normalized line endings
      const normContent = content.replace(/\r\n/g, '\n');
      const normTarget = target.replace(/\r\n/g, '\n');
      if (normContent.includes(normTarget)) {
        console.log("Matched with normalized line endings.");
        content = normContent.replace(normTarget, replacement.replace(/\r\n/g, '\n'));
      } else {
        process.exit(1);
      }
    } else {
      content = content.replace(target, replacement);
    }
  } else if (edit.ReplacementChunks) {
    const chunks = typeof edit.ReplacementChunks === 'string' ? JSON.parse(edit.ReplacementChunks) : edit.ReplacementChunks;
    for (const chunk of chunks) {
      const target = chunk.TargetContent;
      const replacement = chunk.ReplacementContent;
      if (!content.includes(target)) {
        console.error(`Chunk target not found for STEP ${stepNum}!`);
        const normContent = content.replace(/\r\n/g, '\n');
        const normTarget = target.replace(/\r\n/g, '\n');
        if (normContent.includes(normTarget)) {
          console.log("Matched chunk with normalized line endings.");
          content = normContent.replace(normTarget, replacement.replace(/\r\n/g, '\n'));
        } else {
          process.exit(1);
        }
      } else {
        content = content.replace(target, replacement);
      }
    }
  }
}

fs.writeFileSync(servicePath, content, 'utf8');
console.log("Successfully recovered chat.service.ts!");
