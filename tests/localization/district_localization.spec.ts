import { LocalizationService, MetricsService } from '@backend/localization/localization.service';
import { LocationRegistry } from '@backend/localization/localization.constants';

describe('Uttar Pradesh District Localization Tests', () => {
  let service: LocalizationService;

  beforeAll(() => {
    service = new LocalizationService(new MetricsService());
  });

  it('contains all 75 UP districts', () => {
    const districts = LocationRegistry.filter(entry => entry.type === 'DISTRICT' && entry.stateCode === 'UP');
    expect(districts.length).toBe(75);
  });

  it('all districts have en translations', () => {
    const districts = LocationRegistry.filter(entry => entry.type === 'DISTRICT' && entry.stateCode === 'UP');
    for (const d of districts) {
      expect(d.en).toBeDefined();
      expect(typeof d.en).toBe('string');
      expect(d.en.trim().length).toBeGreaterThan(0);
    }
  });

  it('all districts have hi translations', () => {
    const districts = LocationRegistry.filter(entry => entry.type === 'DISTRICT' && entry.stateCode === 'UP');
    for (const d of districts) {
      expect(d.hi).toBeDefined();
      expect(typeof d.hi).toBe('string');
      expect(d.hi.trim().length).toBeGreaterThan(0);
    }
  });

  it('all districts have hinglish translations', () => {
    const districts = LocationRegistry.filter(entry => entry.type === 'DISTRICT' && entry.stateCode === 'UP');
    for (const d of districts) {
      expect(d.hinglish).toBeDefined();
      expect(typeof d.hinglish).toBe('string');
      expect(d.hinglish.trim().length).toBeGreaterThan(0);
    }
  });

  it('district localization returns correct value', () => {
    expect(service.localizeDistrict('LUCKNOW', 'hi')).toBe('लखनऊ');
    expect(service.localizeDistrict('lucknow', 'hi')).toBe('लखनऊ');
    expect(service.localizeDistrict('LUCKNOW', 'en')).toBe('Lucknow');
    expect(service.localizeDistrict('PRAYAGRAJ', 'hi')).toBe('प्रयागराज');
    expect(service.localizeDistrict('AYODHYA', 'hi')).toBe('अयोध्या');
    
    // getAllLocalizedDistricts check
    const hiDistricts = service.getAllLocalizedDistricts('hi');
    expect(hiDistricts['LUCKNOW']).toBe('लखनऊ');
    expect(Object.keys(hiDistricts).length).toBe(75);
  });
});
