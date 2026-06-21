import * as fs from 'fs';
import * as path from 'path';
import { SreService } from '../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Conversation Operational Reliability Gate', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const rootDir = path.resolve(__dirname, '../../');

  beforeAll(() => {
    const emitter = new EventEmitter2();
    sreService = new SreService(emitter);
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await (sreService as any).prisma?.$disconnect().catch(() => {});
  });

  it('should run and verify the entire operation reliability sequence and pass the gate', async () => {
    // 1. Release Lock Integrity Checks
    const releaseLockManifestPath = path.join(rootDir, 'benchmarks/release-lock-manifest.json');
    expect(fs.existsSync(releaseLockManifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(releaseLockManifestPath, 'utf8'));
    expect(manifest.releaseLocked).toBe(true);
    expect(manifest.version).toBe('2.7.8.2-A');

    // 2. Sentinel Incidents Validation
    const sentinelIncidentsPath = path.join(rootDir, 'config/release-validation/sentinel-incidents.json');
    expect(fs.existsSync(sentinelIncidentsPath)).toBe(true);
    const sentinels = JSON.parse(fs.readFileSync(sentinelIncidentsPath, 'utf8'));
    expect(sentinels.length).toBeGreaterThan(0);

    // 3. Domain boundaries check
    const registryPath = path.join(rootDir, 'shared/copilot/scenario-registry/scenario-registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    if (registry.WATER_COMPLAINT) {
      expect(registry.WATER_COMPLAINT.workflow).not.toBe('SAFETY_ESCALATION');
    } else {
      expect(registry.WATER_COMPLAINT).toBeUndefined();
    }

    // 4. Stability Check
    const sessionId = `gate-stability-${Date.now()}`;
    const turn = await sreService.processIntent(
      sessionId,
      ['THEFT', 'VEHICLE', 'BIKE'],
      { incidentDate: '2026-06-19', incidentLocation: 'Kanpur', name: 'Mohan' },
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['THEFT', 'VEHICLE', 'BIKE'] }
    );
    expect(turn.scenario).toBe('BIKE');
    expect(turn.outcome).toBe('DOCUMENT_REPLACEMENT');

    await prisma.scenarioAssessment.deleteMany({ where: { sessionId } }).catch(() => {});
    await prisma.scenarioSession.deleteMany({ where: { sessionId } }).catch(() => {});

    console.log('[CONVERSATION OPERATIONAL RELIABILITY GATE] All checks PASSED.');
  });
});
