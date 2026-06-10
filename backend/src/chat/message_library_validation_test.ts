import * as fs from 'fs';
import * as path from 'path';

async function runMessageLibraryValidationTest() {
  console.log("=== STARTING MESSAGE LIBRARY VALIDATION TEST ===");
  const libraryPath = path.resolve(__dirname, 'message_library.json');
  
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      passed++;
      console.log(`[PASS] ${message}`);
    } else {
      failed++;
      console.error(`[FAIL] ${message}`);
    }
  }

  try {
    // 1. File existence
    assert(fs.existsSync(libraryPath), "message_library.json file should exist in the chat folder");

    if (fs.existsSync(libraryPath)) {
      const content = fs.readFileSync(libraryPath, 'utf8');
      const data = JSON.parse(content);

      // 2. Version and Metadata assertions
      assert(data.version === '1.0.0', `Expected version 1.0.0, got ${data.version}`);
      assert(data.updatedAt !== undefined, "updatedAt field should be defined");
      assert(data.messages !== undefined && typeof data.messages === 'object', "messages object should be defined");

      // 3. Essential message keys existence
      const requiredKeys = [
        'GREETING_WELCOME',
        'PROFILE_NAME_REQUEST',
        'PROFILE_MOBILE_REQUEST',
        'PROFILE_LOCATION_REQUEST',
        'PROFILE_CONFIRM_SCREEN',
        'ERROR_VALIDATION_MOBILE',
        'ERROR_VALIDATION_NAME',
        'SUCCESS_COMPLAINT',
        'FRUSTRATION_WHY_NEEDED'
      ];

      for (const key of requiredKeys) {
        assert(data.messages[key] !== undefined, `Required key "${key}" should be defined in the library`);
        if (data.messages[key]) {
          assert(data.messages[key].en !== undefined, `Key "${key}" should have English translation`);
          assert(data.messages[key].hi !== undefined, `Key "${key}" should have Hindi translation`);
          assert(data.messages[key].hinglish !== undefined, `Key "${key}" should have Hinglish translation`);
        }
      }
    }
  } catch (err) {
    console.error("Test execution failed with error:", err);
    failed++;
  }

  console.log(`\n=== MESSAGE LIBRARY VALIDATION SUMMARY ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runMessageLibraryValidationTest();
