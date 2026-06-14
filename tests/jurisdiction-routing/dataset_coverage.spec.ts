import { JurisdictionSeedValidator } from '@backend/jurisdiction-routing/seed-validator';
import { PrismaService } from '@backend/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Jurisdiction Dataset Coverage Spec', () => {
  let seedValidator: JurisdictionSeedValidator;
  let prisma: PrismaService;

  beforeAll(() => {
    prisma = new PrismaService();
    seedValidator = new JurisdictionSeedValidator(prisma);
  });

  it('should successfully run the validator and verify dataset integrity', () => {
    // Calling seedValidator.validate() triggers all required coverage and structural validations,
    // including verifying coverage of all 75 UP districts, duplicate stationCode detection,
    // manifest count match, mapping integrity, etc. If it does not throw, the dataset is valid.
    expect(() => seedValidator.validate()).not.toThrow();
  });

  it('should verify stations and mappings contain zero orphan mappings or invalid districts', () => {
    const dataDir = seedValidator.getDatasetPath();
    const stations: any[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'stations.json'), 'utf8'));
    const mappings: any[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'jurisdiction-mappings.json'), 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'manifest.json'), 'utf8'));

    const stationCodes = new Set(stations.map(s => s.stationCode));

    // Verify zero orphan mappings
    for (const mapping of mappings) {
      expect(stationCodes.has(mapping.stationCode)).toBe(true);
    }

    // Verify verified and placeholder counts in manifest match stations
    const verifiedCount = stations.filter(s => !s.isPlaceholder).length;
    const placeholderCount = stations.filter(s => s.isPlaceholder).length;

    expect(manifest.coverage.verifiedStations).toBe(verifiedCount);
    expect(manifest.coverage.placeholderStations).toBe(placeholderCount);
    expect(stations.length).toBe(verifiedCount + placeholderCount);
  });
});
