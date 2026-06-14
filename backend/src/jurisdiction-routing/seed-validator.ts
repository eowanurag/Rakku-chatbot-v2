import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JurisdictionSeedValidator implements OnModuleInit {
  private readonly logger = new Logger(JurisdictionSeedValidator.name);

  onModuleInit() {
    this.validate();
  }

  getDatasetPath(): string {
    const pathsToTry = [
      path.resolve(process.cwd(), 'shared/jurisdiction-data'),
      path.resolve(__dirname, '../../shared/jurisdiction-data'),
      path.resolve(__dirname, '../../../shared/jurisdiction-data'),
      path.resolve(__dirname, '../../../../shared/jurisdiction-data'),
    ];

    for (const p of pathsToTry) {
      if (fs.existsSync(p) && fs.existsSync(path.join(p, 'manifest.json'))) {
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

    const stationCodes = new Set(stations.map(s => s.stationCode));
    for (const mapping of mappings) {
      if (!stationCodes.has(mapping.stationCode)) {
        throw new Error(
          `Seed dataset validation failed: mapping for ${mapping.localityCode || mapping.cityCode || mapping.districtCode} references invalid stationCode "${mapping.stationCode}"`
        );
      }
    }

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
