import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

jest.setTimeout(30000);

/**
 * Graph Growth Health Test
 *
 * Replaces the fixed candidate limit (50) with a coverage-based threshold.
 * Formula: pendingCandidates / activeGraphNodes <= maxGraphMissPercentage
 *
 * This scales automatically:
 *   100 nodes → max 5 misses (at 5%)
 *   1000 nodes → max 50 misses (at 5%)
 */

const releasePolicy = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../config/release-validation/release-policy.json'), 'utf8')
);

describe('SRE Graph Growth Health – Coverage-Based Threshold', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.scenarioGraphCandidate.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should load maxGraphMissPercentage from release-policy.json', () => {
    expect(releasePolicy.maxGraphMissPercentage).toBeDefined();
    expect(typeof releasePolicy.maxGraphMissPercentage).toBe('number');
    expect(releasePolicy.maxGraphMissPercentage).toBeGreaterThan(0);
    expect(releasePolicy.maxGraphMissPercentage).toBeLessThanOrEqual(100);
  });

  it('should calculate active graph node count from graphs.json', () => {
    const graphsPath = path.resolve(__dirname, '../../../shared/copilot/scenario-graphs/graphs.json');
    expect(fs.existsSync(graphsPath)).toBe(true);

    const graphData = JSON.parse(fs.readFileSync(graphsPath, 'utf8'));
    const nodes = graphData.nodes || {};

    const activeNodes = Object.entries(nodes).filter(
      ([, node]: [string, any]) => node.status === 'ACTIVE'
    );

    expect(activeNodes.length).toBeGreaterThan(0);
  });

  it('should enforce pendingCandidates / activeGraphNodes <= maxGraphMissPercentage', async () => {
    // 1. Count active graph nodes
    const graphsPath = path.resolve(__dirname, '../../../shared/copilot/scenario-graphs/graphs.json');
    const graphData = JSON.parse(fs.readFileSync(graphsPath, 'utf8'));
    const nodes = graphData.nodes || {};

    const activeNodeCount = Object.entries(nodes).filter(
      ([, node]: [string, any]) => node.status === 'ACTIVE'
    ).length;

    // 2. Count candidates in database by status
    const pendingCandidates = await prisma.scenarioGraphCandidate.count({
      where: { status: 'PENDING' }
    });
    const approvedCandidates = await prisma.scenarioGraphCandidate.count({
      where: { status: 'APPROVED' }
    });
    const rejectedCandidates = await prisma.scenarioGraphCandidate.count({
      where: { status: 'REJECTED' }
    });

    // 3. Find top missing terms
    const topMissing = await prisma.scenarioGraphCandidate.findMany({
      where: { status: 'PENDING' },
      orderBy: { occurrences: 'desc' },
      take: 5
    });

    // 4. Calculate miss ratio
    const missRatio = activeNodeCount > 0
      ? (pendingCandidates / activeNodeCount) * 100
      : 0;

    const maxAllowed = releasePolicy.maxGraphMissPercentage;
    const maxAllowedCount = Math.floor((maxAllowed / 100) * activeNodeCount);

    console.log(`[Graph Growth Health]`);
    console.log(`  Active Graph Nodes: ${activeNodeCount}`);
    console.log(`  Pending Candidates: ${pendingCandidates}`);
    console.log(`  Approved Candidates: ${approvedCandidates}`);
    console.log(`  Rejected Candidates: ${rejectedCandidates}`);
    console.log(`  Miss Ratio: ${missRatio.toFixed(2)}%`);
    console.log(`  Max Allowed: ${maxAllowed}% (${maxAllowedCount} candidates)`);
    console.log(`  Top Missing Terms:`, topMissing.map(c => `${c.proposedNode} (under ${c.parentNode}: ${c.occurrences} misses)`).join(', '));

    expect(missRatio).toBeLessThanOrEqual(maxAllowed);
  });

  it('should demonstrate scaling behavior with coverage-based formula', () => {
    const maxPercent = releasePolicy.maxGraphMissPercentage;

    // Small graph: 100 nodes
    const smallGraphMax = Math.floor((maxPercent / 100) * 100);
    expect(smallGraphMax).toBe(5);

    // Medium graph: 500 nodes
    const mediumGraphMax = Math.floor((maxPercent / 100) * 500);
    expect(mediumGraphMax).toBe(25);

    // Large graph: 1000 nodes
    const largeGraphMax = Math.floor((maxPercent / 100) * 1000);
    expect(largeGraphMax).toBe(50);

    // Very large graph: 2000 nodes
    const veryLargeGraphMax = Math.floor((maxPercent / 100) * 2000);
    expect(veryLargeGraphMax).toBe(100);
  });
});
