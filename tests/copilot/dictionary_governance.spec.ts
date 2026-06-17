import { DictionaryGovernanceService } from '../../backend/src/copilot/cue/governance/dictionary-governance.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Dictionary Governance Validator', () => {
  let governanceService: DictionaryGovernanceService;

  beforeAll(() => {
    governanceService = new DictionaryGovernanceService();
  });

  it('should detect and reject circular mappings', () => {
    const mockCircularEntries = {
      "phone": "mobile",
      "mobile": "phone"
    };

    expect(() => {
      (governanceService as any).detectCircularMappings(mockCircularEntries, 'test-dict');
    }).toThrow('Circular mapping detected');
  });

  it('should detect direct self circular mappings', () => {
    const mockCircularEntries = {
      "bag": "bag"
    };

    expect(() => {
      (governanceService as any).detectCircularMappings(mockCircularEntries, 'test-dict');
    }).toThrow('Circular mapping detected');
  });

  it('should validate semantic versions correctly', () => {
    // We override validateFile or run it on a temp dictionary to test
    const invalidMeta = {
      version: "abc",
      lastUpdated: "2026-06-17",
      entries: { "test": "test" }
    };
    
    const tempFilePath = path.resolve(__dirname, '../../shared/copilot/understanding/temp-invalid.json');
    fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
    fs.writeFileSync(tempFilePath, JSON.stringify(invalidMeta, null, 2), 'utf8');

    expect(() => {
      governanceService.validateFile('understanding/temp-invalid.json');
    }).toThrow('Must follow semantic versioning');

    fs.unlinkSync(tempFilePath);
  });
});
