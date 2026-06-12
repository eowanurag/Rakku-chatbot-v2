import { ValidationService } from '@backend/chat/validation.service';

describe('Hindi Date Parsing and Validation Test', () => {
  let validationService: ValidationService;

  beforeAll(() => {
    validationService = new ValidationService();
  });

  it('should parse standard English slashed and hyphenated dates', () => {
    expect(validationService.validateDate('06/06/2026', false)).toBe(true);
    expect(validationService.validateDate('06-06-2026', false)).toBe(true);
    expect(validationService.validateDate('6-6-2026', false)).toBe(true);
  });

  it('should parse Hindi named months in date strings', () => {
    // Current date is 2026-06-12, so 6 जून 2026 is in the past/today, should be valid with rejectFuture=true
    expect(validationService.validateDate('6 जून 2026', true)).toBe(true);
    expect(validationService.validateDate('06 जून 2026', true)).toBe(true);
    expect(validationService.validateDate('1 जनवरी 2026', true)).toBe(true);
    expect(validationService.validateDate('15 अगस्त 2025', true)).toBe(true);
  });

  it('should reject future dates when rejectFuture is true', () => {
    // 15 December 2026 is in the future relative to June 2026
    expect(validationService.validateDate('15 दिसंबर 2026', true)).toBe(false);
    expect(validationService.validateDate('15-12-2026', true)).toBe(false);
  });

  it('should accept future dates when rejectFuture is false', () => {
    expect(validationService.validateDate('15 दिसंबर 2026', false)).toBe(true);
    expect(validationService.validateDate('15-12-2026', false)).toBe(true);
  });

  it('should reject invalid Hindi dates', () => {
    expect(validationService.validateDate('32 जून 2026', false)).toBe(false);
    expect(validationService.validateDate('6 गलतमाह 2026', false)).toBe(false);
  });
});
