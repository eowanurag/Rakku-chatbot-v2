import * as fs from 'fs';
import * as path from 'path';

describe('Message Library Validation Test', () => {
  const libraryPath = path.resolve(__dirname, '../../../shared/message_library.json');
  let data: any;

  beforeAll(() => {
    expect(fs.existsSync(libraryPath)).toBe(true);
    const content = fs.readFileSync(libraryPath, 'utf8');
    data = JSON.parse(content);
  });

  it('should have correct version and metadata', () => {
    expect(data.version).toBe('1.0.0');
    expect(data.updatedAt).toBeDefined();
    expect(data.messages).toBeDefined();
    expect(typeof data.messages).toBe('object');
  });

  it('should have all required keys with complete translations', () => {
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
      expect(data.messages[key]).toBeDefined();
      if (data.messages[key]) {
        expect(data.messages[key].en).toBeDefined();
        expect(data.messages[key].hi).toBeDefined();
        expect(data.messages[key].hinglish).toBeDefined();
      }
    }
  });
});
