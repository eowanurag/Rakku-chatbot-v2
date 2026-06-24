import { validateIncidentDate } from '@backend/chat/utils/validateIncidentDate';

describe('Date Validation Regression E2E', () => {
  const customToday = new Date('2026-06-24T00:00:00Z');

  it('should validate yesterday and today as true, tomorrow as false', () => {
    expect(validateIncidentDate('today', customToday)).toBe(true);
    expect(validateIncidentDate('yesterday', customToday)).toBe(true);
    expect(validateIncidentDate('tomorrow', customToday)).toBe(false);
  });

  it('should return false for impossible/invalid dates', () => {
    expect(validateIncidentDate('31/02/2026', customToday)).toBe(false);
    expect(validateIncidentDate('29/02/2025', customToday)).toBe(false);
    expect(validateIncidentDate('00/01/2026', customToday)).toBe(false);
    expect(validateIncidentDate('32/01/2026', customToday)).toBe(false);
    expect(validateIncidentDate('13/13/2026', customToday)).toBe(false);
  });

  it('should return false for future dates', () => {
    expect(validateIncidentDate('25/06/2026', customToday)).toBe(false);
    expect(validateIncidentDate('15/12/2026', customToday)).toBe(false);
  });

  it('should return true for valid past dates', () => {
    expect(validateIncidentDate('23/06/2026', customToday)).toBe(true);
    expect(validateIncidentDate('01/01/2026', customToday)).toBe(true);
  });
});
