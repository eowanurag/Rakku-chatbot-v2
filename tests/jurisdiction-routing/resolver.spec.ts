import { LocationResolverService } from '@backend/jurisdiction-routing/location-resolver.service';
import { MatchType } from '@backend/jurisdiction-routing/jurisdiction-routing.types';

describe('LocationResolverService Tests', () => {
  let resolver: LocationResolverService;

  beforeAll(() => {
    resolver = new LocationResolverService();
  });

  it('normalizes location text properly', () => {
    expect(resolver.normalize('Lucknow!')).toBe('lucknow');
    expect(resolver.normalize('banki, barabanki')).toBe('banki barabanki');
    expect(resolver.normalize('  LUCKNOW   ZILA ')).toBe('lucknow zila');
  });

  it('resolves exact match for districts', () => {
    const res = resolver.resolve('Lucknow');
    expect(res.districtCode).toBe('LUCKNOW');
    // Lucknow is in LOCATION_ALIASES, so it maps via ALIAS
    expect(res.matchType).toBe(MatchType.ALIAS);
    expect(res.confidence).toBe(0.95);
  });

  it('resolves alias matching', () => {
    const res = resolver.resolve('bnki');
    expect(res.cityCode).toBe('BANKI');
    expect(res.matchType).toBe(MatchType.NONE);
  });

  it('resolves fuzzy matching for similar district names', () => {
    const res = resolver.resolve('Luknow');
    expect(res.districtCode).toBe('LUCKNOW');
    expect(res.matchType).toBe(MatchType.FUZZY);
    expect(res.confidence).toBeGreaterThan(0.7);
  });

  it('resolves specific sectors/localities', () => {
    const res = resolver.resolve('sector 62 noida');
    expect(res.cityCode).toBe('NOIDA');
    expect(res.localityCode).toBe('SECTOR_62');
  });

  it('handles empty inputs gracefully with fallback', () => {
    const res = resolver.resolve('');
    expect(res.districtCode).toBe('LUCKNOW');
    expect(res.matchType).toBe(MatchType.NONE);
    expect(res.confidence).toBe(0.0);
  });
});
