import * as fs from 'fs';
import * as path from 'path';

const SRC_PATH = path.resolve(__dirname, '../shared/message_library.json');
const NEST_DEST_PATH = path.resolve(__dirname, '../backend/src/chat/message_library.json');
const FASTAPI_DEST_PATH = path.resolve(__dirname, '../ai-service/message_library.json');

function sync() {
  console.log(`[SYNC] Copying ${SRC_PATH} to destinations...`);
  if (!fs.existsSync(SRC_PATH)) {
    console.error(`Error: Source file not found at ${SRC_PATH}`);
    process.exit(1);
  }

  // Copy to NestJS Backend
  fs.copyFileSync(SRC_PATH, NEST_DEST_PATH);
  console.log(`[SYNC] Copied to NestJS Backend: ${NEST_DEST_PATH}`);

  // Copy to FastAPI Service
  fs.copyFileSync(SRC_PATH, FASTAPI_DEST_PATH);
  console.log(`[SYNC] Copied to FastAPI Service: ${FASTAPI_DEST_PATH}`);

  console.log('[SYNC] Message library synchronization completed successfully.');
}

sync();
