import * as fs from 'fs';
import * as path from 'path';

describe('Frontend Localization and Multilingual UI Spec', () => {
  const localesDir = path.resolve(__dirname, '../../frontend/src/locales');
  const languages = ['en', 'hi', 'hinglish'];

  it('should verify that locales directory and keys file exist', () => {
    expect(fs.existsSync(localesDir)).toBe(true);
    expect(fs.existsSync(path.join(localesDir, 'keys.ts'))).toBe(true);
  });

  it('should verify that all languages have identical JSON structures and no missing translation keys', () => {
    const namespaces = ['common', 'emergency', 'feedback', 'notifications', 'services', 'tracking', 'workflows'];

    namespaces.forEach(ns => {
      const enPath = path.join(localesDir, 'en', `${ns}.json`);
      expect(fs.existsSync(enPath)).toBe(true);
      const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
      const enKeys = Object.keys(enJson).sort();

      languages.filter(lang => lang !== 'en').forEach(lang => {
        const langPath = path.join(localesDir, lang, `${ns}.json`);
        expect(fs.existsSync(langPath)).toBe(true);
        const langJson = JSON.parse(fs.readFileSync(langPath, 'utf8'));
        const langKeys = Object.keys(langJson).sort();

        // Check key parity
        expect(langKeys).toEqual(enKeys);
      });
    });
  });
});
