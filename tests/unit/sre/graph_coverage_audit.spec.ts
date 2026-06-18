import { runGraphCoverageAudit } from '../../../scripts/graph-coverage-audit';

/**
 * Graph Coverage Audit Test
 *
 * Verifies that active nodes in graphs.json map to:
 *   - Knowledge File
 *   - Playbook File
 *   - Risk Rule
 *   - Outcome Rule
 *   - Workflow Mapping
 *
 * Threshold: Coverage of Active Nodes >= 95%
 */
describe('SRE Graph Coverage Audit', () => {
  it('should pass coverage threshold of active nodes >= 95%', () => {
    const report = runGraphCoverageAudit();
    
    console.log(`[Graph Coverage Audit]`);
    console.log(`  Active Nodes: ${report.totalNodes}`);
    console.log(`  Covered Nodes: ${report.coveredNodes}`);
    console.log(`  Coverage Percent: ${report.coveragePercent.toFixed(2)}%`);

    if (report.missingKnowledge.length > 0) {
      console.log(`  Missing Knowledge for: ${report.missingKnowledge.join(', ')}`);
    }
    if (report.missingPlaybooks.length > 0) {
      console.log(`  Missing Playbooks for: ${report.missingPlaybooks.join(', ')}`);
    }
    if (report.missingOutcomes.length > 0) {
      console.log(`  Missing Outcomes for: ${report.missingOutcomes.join(', ')}`);
    }
    if (report.missingWorkflows.length > 0) {
      console.log(`  Missing Workflows for: ${report.missingWorkflows.join(', ')}`);
    }

    expect(report.coveragePercent).toBeGreaterThanOrEqual(95);
  });
});
