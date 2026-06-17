import { LegacyIntentAdapter } from '../../backend/src/copilot/sae/adapters/legacy-intent-adapter';

describe('LegacyIntentAdapter', () => {
  let adapter: LegacyIntentAdapter;

  beforeAll(() => {
    adapter = new LegacyIntentAdapter();
  });

  it('should map old intent keys to scenario hints correctly', () => {
    expect(adapter.adapt("LOST_MOBILE")).toEqual(["LOSS", "MOBILE"]);
    expect(adapter.adapt("LOST_AADHAAR")).toEqual(["LOSS", "DOCUMENT", "AADHAAR"]);
    expect(adapter.adapt("UPI_FRAUD")).toEqual(["FRAUD", "PAYMENT"]);
  });

  it('should return fallback hints for unknown intents', () => {
    expect(adapter.adapt("UNKNOWN_SOMETHING")).toEqual(["GENERAL"]);
  });

  it('should handle case insensitivity and extra whitespace', () => {
    expect(adapter.adapt("  lost_mobile  ")).toEqual(["LOSS", "MOBILE"]);
  });
});
