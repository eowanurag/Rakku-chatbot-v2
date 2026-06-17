import * as fs from 'fs';
import * as crypto from 'crypto';

export class ScenarioGraphEngine {
  private graphsPath: string;
  private resolvedPathCache = new Map<string, any>();
  private cacheHits = 0;
  private cacheMisses = 0;
  private hash: string = '';

  constructor(basePath: string) {
    this.graphsPath = `${basePath}/scenario-graphs/graphs.json`;
    this.calculateHash();
  }

  private calculateHash() {
    if (fs.existsSync(this.graphsPath)) {
      const content = fs.readFileSync(this.graphsPath, 'utf8');
      this.hash = crypto.createHash('sha256').update(content).digest('hex');
    } else {
      this.hash = 'default_hash';
    }
  }

  public getGraphHash(): string {
    return this.hash;
  }

  public getCacheMetrics() {
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses
    };
  }

  public getGraphData(): any {
    if (!fs.existsSync(this.graphsPath)) {
      return { version: "1.0", roots: [], nodes: {} };
    }
    return JSON.parse(fs.readFileSync(this.graphsPath, 'utf8'));
  }

  public resolvePath(intentPath: string[]): { scenario: string; path: string[]; requiresImmediateEscalation: boolean } {
    if (!fs.existsSync(this.graphsPath)) {
      return { scenario: intentPath[intentPath.length - 1], path: intentPath, requiresImmediateEscalation: false };
    }
    const data = JSON.parse(fs.readFileSync(this.graphsPath, 'utf8'));
    const nodes = data.nodes;
    
    let currentScenario = intentPath[intentPath.length - 1];
    let requiresImmediateEscalation = false;

    if (nodes[currentScenario]) {
      requiresImmediateEscalation = !!nodes[currentScenario].requiresImmediateEscalation;
    }

    return { scenario: currentScenario, path: intentPath, requiresImmediateEscalation };
  }

  public traverseFromSeeds(seeds: string[]): { path: string[]; requiresImmediateEscalation: boolean } {
    const canonicalSeeds = seeds.map(s => s.toUpperCase());
    const cacheKey = canonicalSeeds.join(':');
    
    if (this.resolvedPathCache.has(cacheKey)) {
      this.cacheHits++;
      return this.resolvedPathCache.get(cacheKey);
    }
    this.cacheMisses++;

    const graphData = this.getGraphData();
    const nodes = graphData.nodes || {};
    const pathList: string[] = [];
    
    // Find starting root
    const roots = graphData.roots || [];
    let current: string | null = null;
    for (const root of roots) {
      if (canonicalSeeds.includes(root)) {
        current = root;
        break;
      }
    }

    if (!current && canonicalSeeds.length > 0) {
      current = canonicalSeeds[0];
    }

    let requiresImmediateEscalation = false;
    if (current) {
      pathList.push(current);
      let node = nodes[current];
      if (node && node.requiresImmediateEscalation) {
        requiresImmediateEscalation = true;
      }

      let walking = true;
      while (walking) {
        walking = false;
        if (node && node.children) {
          for (const child of node.children) {
            if (canonicalSeeds.includes(child)) {
              pathList.push(child);
              current = child;
              node = nodes[child];
              if (node && node.requiresImmediateEscalation) {
                requiresImmediateEscalation = true;
              }
              walking = true;
              break;
            }
          }
        }
      }
    }

    const result = { path: pathList, requiresImmediateEscalation };
    
    // Enforce cache bound limits (eviction if > 1000)
    if (this.resolvedPathCache.size >= 1000) {
      const firstKey = this.resolvedPathCache.keys().next().value;
      if (firstKey) this.resolvedPathCache.delete(firstKey);
    }
    this.resolvedPathCache.set(cacheKey, result);

    return result;
  }

  public calculateCompleteness(scenario: string, collectedData: Record<string, any>, requiredFields: string[]): number {
    if (!requiredFields || requiredFields.length === 0) return 1.0;
    let count = 0;
    for (const field of requiredFields) {
      if (collectedData[field] !== undefined) {
        count++;
      }
    }
    return count / requiredFields.length;
  }
}
