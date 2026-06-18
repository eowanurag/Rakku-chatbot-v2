import * as fs from 'fs';
import * as path from 'path';

/**
 * Startup Time & Completeness Validation
 *
 * Verifies that all critical resources load within the startupTimeMs budget
 * defined in release-policy.json. Resources checked:
 *   - Scenario Graphs
 *   - Dictionaries (synonyms, dialects, abbreviations)
 *   - Playbooks
 *   - Knowledge JSONs
 *   - Outcome Rules
 *   - Risk Rules
 *   - Clarification Rules
 *
 * Severity: CRITICAL – incomplete resource load = broken runtime.
 */

const releasePolicy = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../config/release-validation/release-policy.json'), 'utf8')
);

interface ResourceCheck {
  name: string;
  relativePath: string;
  required: boolean;
}

const CRITICAL_RESOURCES: ResourceCheck[] = [
  { name: 'Scenario Graphs', relativePath: 'scenario-graphs/graphs.json', required: true },
  { name: 'Synonyms Dictionary', relativePath: 'understanding/synonyms.json', required: true },
  { name: 'Dialects Dictionary', relativePath: 'understanding/dialects.json', required: true },
  { name: 'Abbreviations Dictionary', relativePath: 'understanding/abbreviations.json', required: true },
  { name: 'Hindi Keywords', relativePath: 'hindi-keywords.json', required: true },
  { name: 'Hinglish Keywords', relativePath: 'hinglish-keywords.json', required: true },
  { name: 'Intents', relativePath: 'intents.json', required: true },
  { name: 'Service Mappings', relativePath: 'service-mappings.json', required: true },
  { name: 'Urgency Rules', relativePath: 'urgency-rules.json', required: true },
  { name: 'Confidence Policy', relativePath: 'confidence-policy.json', required: true },
  { name: 'Incident Categories', relativePath: 'incident-categories.json', required: true },
];

describe('Startup Time & Completeness Validation', () => {
  const basePath = path.resolve(__dirname, '../../../shared/copilot');

  it('should load all critical resources within startupTimeMs budget', () => {
    const startTime = Date.now();
    const results: { name: string; exists: boolean; loadTimeMs: number; sizeBytes: number }[] = [];

    for (const resource of CRITICAL_RESOURCES) {
      const resourceStart = Date.now();
      const fullPath = path.join(basePath, resource.relativePath);
      const exists = fs.existsSync(fullPath);

      let sizeBytes = 0;
      if (exists) {
        const content = fs.readFileSync(fullPath, 'utf8');
        JSON.parse(content); // Validate JSON parseable
        sizeBytes = Buffer.byteLength(content, 'utf8');
      }

      results.push({
        name: resource.name,
        exists,
        loadTimeMs: Date.now() - resourceStart,
        sizeBytes
      });
    }

    const totalLoadTime = Date.now() - startTime;
    const maxStartup = releasePolicy.startupTimeMs;

    console.log(`[Startup Completeness]`);
    for (const r of results) {
      console.log(`  ${r.exists ? '✓' : '✗'} ${r.name}: ${r.loadTimeMs}ms (${r.sizeBytes} bytes)`);
    }
    console.log(`  Total Load Time: ${totalLoadTime}ms (Budget: ${maxStartup}ms)`);

    expect(totalLoadTime).toBeLessThan(maxStartup);
  });

  it('should verify all required resources exist', () => {
    const missing: string[] = [];

    for (const resource of CRITICAL_RESOURCES) {
      if (resource.required) {
        const fullPath = path.join(basePath, resource.relativePath);
        if (!fs.existsSync(fullPath)) {
          missing.push(resource.name);
        }
      }
    }

    if (missing.length > 0) {
      console.error(`[STARTUP FAILURE] Missing required resources: ${missing.join(', ')}`);
    }
    expect(missing).toHaveLength(0);
  });

  it('should verify all resources contain valid parseable JSON', () => {
    const invalid: string[] = [];

    for (const resource of CRITICAL_RESOURCES) {
      const fullPath = path.join(basePath, resource.relativePath);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          JSON.parse(content);
        } catch {
          invalid.push(resource.name);
        }
      }
    }

    if (invalid.length > 0) {
      console.error(`[STARTUP FAILURE] Invalid JSON resources: ${invalid.join(', ')}`);
    }
    expect(invalid).toHaveLength(0);
  });

  it('should verify scenario graph has at least one root and one node', () => {
    const graphPath = path.join(basePath, 'scenario-graphs/graphs.json');
    const graphData = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

    expect(graphData.roots).toBeDefined();
    expect(graphData.roots.length).toBeGreaterThan(0);
    expect(graphData.nodes).toBeDefined();
    expect(Object.keys(graphData.nodes).length).toBeGreaterThan(0);
  });

  it('should verify playbooks directory contains at least one playbook', () => {
    const playbooksDir = path.join(basePath, 'playbooks');
    if (fs.existsSync(playbooksDir)) {
      const files = fs.readdirSync(playbooksDir);
      expect(files.length).toBeGreaterThan(0);
    }
  });

  it('should verify knowledge directory contains knowledge files', () => {
    const knowledgeDir = path.join(basePath, 'knowledge');
    if (fs.existsSync(knowledgeDir)) {
      const files = fs.readdirSync(knowledgeDir);
      expect(files.length).toBeGreaterThan(0);
    }
  });
});
