import { Injectable, OnModuleInit } from '@nestjs/common';
import { RoutingTargetType } from './jurisdiction-routing.types';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RoutingPolicyService implements OnModuleInit {
  private policies: Record<string, string> = {};

  onModuleInit() {
    this.loadPolicies();
  }

  private getDatasetPath(): string {
    const pathsToTry = [
      path.resolve(process.cwd(), 'shared/jurisdiction-data'),
      path.resolve(__dirname, '../../shared/jurisdiction-data'),
      path.resolve(__dirname, '../../../shared/jurisdiction-data'),
    ];

    for (const p of pathsToTry) {
      if (fs.existsSync(p) && fs.existsSync(path.join(p, 'manifest.json'))) {
        return p;
      }
    }
    return '';
  }

  loadPolicies() {
    const dataDir = this.getDatasetPath();
    if (dataDir) {
      const policiesPath = path.join(dataDir, 'routing-policies.json');
      if (fs.existsSync(policiesPath)) {
        this.policies = JSON.parse(fs.readFileSync(policiesPath, 'utf8'));
        return;
      }
    }

    // Standard fallback mapping
    this.policies = {
      LOST_MOBILE: 'POLICE_STATION',
      LOST_DOCUMENT: 'POLICE_STATION',
      CYBER_FRAUD: 'CYBER_CELL',
      HARASSMENT: 'POLICE_STATION',
      TENANT_VERIFICATION: 'VERIFICATION_UNIT',
      EMPLOYEE_VERIFICATION: 'VERIFICATION_UNIT',
      DOMESTIC_HELP_VERIFICATION: 'VERIFICATION_UNIT',
      CHARACTER_CERTIFICATE: 'VERIFICATION_UNIT',
      EVENT_PERMISSION: 'POLICE_STATION',
    };
  }

  getTargetTypeForWorkflow(workflow: string): RoutingTargetType {
    const canonicalKey = workflow.toUpperCase().replace(/\s+/g, '_');
    const policy = this.policies[canonicalKey] || this.policies[workflow];
    
    if (policy === 'CYBER_CELL') return RoutingTargetType.CYBER_CELL;
    if (policy === 'VERIFICATION_UNIT') return RoutingTargetType.VERIFICATION_UNIT;
    if (policy === 'OTHER') return RoutingTargetType.OTHER;
    return RoutingTargetType.POLICE_STATION;
  }
}
