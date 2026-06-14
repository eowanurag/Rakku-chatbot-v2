import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import { LocationRegistry } from '../localization/localization.constants';

@Injectable()
export class JurisdictionSeedValidator implements OnModuleInit {
  private readonly logger = new Logger(JurisdictionSeedValidator.name);

  onModuleInit() {
    this.validate();
  }

  getDatasetPath(): string {
    const pathsToTry = [
      path.resolve(process.cwd(), 'shared/jurisdiction-data'),
      path.resolve(__dirname, 'jurisdiction-data'),
      path.resolve(__dirname, '../../shared/jurisdiction-data'),
      path.resolve(__dirname, '../../../shared/jurisdiction-data'),
      path.resolve(__dirname, '../../../../shared/jurisdiction-data'),
      path.resolve(process.cwd(), 'src/jurisdiction-routing/jurisdiction-data'),
      path.resolve(process.cwd(), 'dist/jurisdiction-routing/jurisdiction-data'),
      path.resolve(process.cwd(), 'backend/src/jurisdiction-routing/jurisdiction-data'),
    ];

    for (const p of pathsToTry) {
      this.logger.log(`Checking candidate seed directory path: ${p}`);
      if (fs.existsSync(p) && fs.existsSync(path.join(p, 'manifest.json'))) {
        this.logger.log(`Successfully resolved seed directory at: ${p}`);
        return p;
      }
    }

    throw new Error('Jurisdiction seed data directory not found in any of the resolved paths.');
  }

  validate() {
    this.logger.log('Starting seed dataset and policy validation...');
    const dataDir = this.getDatasetPath();

    const manifestPath = path.join(dataDir, 'manifest.json');
    const stationsPath = path.join(dataDir, 'stations.json');
    const mappingsPath = path.join(dataDir, 'jurisdiction-mappings.json');
    const policiesPath = path.join(dataDir, 'routing-policies.json');

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Missing mandatory file: manifest.json at ${manifestPath}`);
    }
    if (!fs.existsSync(stationsPath)) {
      throw new Error(`Missing mandatory file: stations.json at ${stationsPath}`);
    }
    if (!fs.existsSync(mappingsPath)) {
      throw new Error(`Missing mandatory file: jurisdiction-mappings.json at ${mappingsPath}`);
    }
    if (!fs.existsSync(policiesPath)) {
      throw new Error(`Missing mandatory file: routing-policies.json at ${policiesPath}`);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest.version) {
      throw new Error('Seed dataset validation failed: manifest.json does not contain version field.');
    }

    const stations: any[] = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
    const mappings: any[] = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
    const policies: Record<string, string> = JSON.parse(fs.readFileSync(policiesPath, 'utf8'));

    // 1. Coverage check: all 75 UP districts from LocationRegistry represented
    const upDistricts = LocationRegistry.filter(entry => entry.type === 'DISTRICT' && entry.stateCode === 'UP');
    const upDistrictCodes = new Set(upDistricts.map(d => d.code));
    
    // Check coverage in stations
    const stationDistricts = new Set(stations.map(s => s.districtCode));
    for (const code of upDistrictCodes) {
      if (!stationDistricts.has(code)) {
        throw new Error(`Seed dataset validation failed: District "${code}" is not represented in stations.json`);
      }
    }

    // Check coverage in mappings
    const mappedDistricts = new Set(mappings.map(m => m.districtCode));
    for (const code of upDistrictCodes) {
      if (!mappedDistricts.has(code)) {
        throw new Error(`Seed dataset validation failed: District "${code}" is not represented in jurisdiction-mappings.json`);
      }
    }

    // 2. Duplicate StationCode detection
    const stationCodes = new Set<string>();
    for (const station of stations) {
      if (stationCodes.has(station.stationCode)) {
        throw new Error(`Seed dataset validation failed: Duplicate stationCode found: "${station.stationCode}"`);
      }
      stationCodes.add(station.stationCode);
    }

    // 3. Mapping Integrity: every mapping references an existing stationCode
    const duplicateMappings = new Set<string>();
    for (const mapping of mappings) {
      if (!stationCodes.has(mapping.stationCode)) {
        throw new Error(
          `Seed dataset validation failed: mapping for ${mapping.localityCode || mapping.cityCode || mapping.districtCode} references invalid stationCode "${mapping.stationCode}"`
        );
      }
      // 4. Duplicate district mappings check
      const mappingKey = `${mapping.districtCode}:${mapping.cityCode || ''}:${mapping.localityCode || ''}`;
      if (duplicateMappings.has(mappingKey)) {
        throw new Error(`Seed dataset validation failed: Duplicate mapping entry found for: "${mappingKey}"`);
      }
      duplicateMappings.add(mappingKey);
    }

    // 5. District Integrity: every station references a valid district from LocationRegistry
    const allRegisteredDistrictCodes = new Set(LocationRegistry.filter(e => e.type === 'DISTRICT').map(e => e.code));
    for (const station of stations) {
      if (!allRegisteredDistrictCodes.has(station.districtCode)) {
        throw new Error(`Seed dataset validation failed: Station "${station.stationCode}" references unregistered district "${station.districtCode}"`);
      }
    }

    // 6. Manifest Checksum validation
    const verifiedCount = stations.filter(s => !s.isPlaceholder).length;
    const placeholderCount = stations.filter(s => s.isPlaceholder).length;
    const manifestVerified = manifest.coverage?.verifiedStations || 0;
    const manifestPlaceholder = manifest.coverage?.placeholderStations || 0;

    if (verifiedCount !== manifestVerified) {
      throw new Error(`Seed dataset validation failed: Manifest verifiedStations count (${manifestVerified}) does not match actual verified stations (${verifiedCount})`);
    }
    if (placeholderCount !== manifestPlaceholder) {
      throw new Error(`Seed dataset validation failed: Manifest placeholderStations count (${manifestPlaceholder}) does not match actual placeholder stations (${placeholderCount})`);
    }
    if (stations.length !== (manifestVerified + manifestPlaceholder)) {
      throw new Error(`Seed dataset validation failed: Total stations count (${stations.length}) does not match verified + placeholder sum (${manifestVerified + manifestPlaceholder})`);
    }

    // Required workflow routing policies check
    const requiredWorkflows = [
      'LOST_MOBILE',
      'LOST_DOCUMENT',
      'CYBER_FRAUD',
      'HARASSMENT',
      'TENANT_VERIFICATION',
      'EMPLOYEE_VERIFICATION',
      'DOMESTIC_HELP_VERIFICATION',
      'CHARACTER_CERTIFICATE',
      'EVENT_PERMISSION',
    ];

    for (const wf of requiredWorkflows) {
      if (!policies[wf]) {
        throw new Error(`Startup policy check failed: Missing routing policy for workflow "${wf}"`);
      }
    }

    this.logger.log(`Seed dataset validation PASSED. Version loaded: ${manifest.version}`);
  }
}
