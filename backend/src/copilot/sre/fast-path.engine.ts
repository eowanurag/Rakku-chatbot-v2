import { Injectable } from '@nestjs/common';

@Injectable()
export class FastPathEngine {
  public evaluateFastPath(
    scenarioHints: string[],
    confidence: number,
    graphData: any
  ): {
    canResolve: boolean;
    resolvedNode?: string;
    resolutionQuality?: string;
    ambiguityScore: number;
  } {
    if (!scenarioHints || scenarioHints.length === 0 || !graphData || !graphData.nodes) {
      return { canResolve: false, ambiguityScore: 0.0 };
    }

    const hintsSet = new Set(scenarioHints.map(h => h.toUpperCase()));

    // Find all reachable leaf nodes from the roots matching the hints
    const matchingLeaves: string[] = [];
    const nodes = graphData.nodes;

    const findLeaves = (nodeKey: string, currentPath: string[]) => {
      const node = nodes[nodeKey];
      if (!node) return;

      const path = [...currentPath, nodeKey];

      // If all nodes in the path are in the hints
      const matchesAll = path.every(n => hintsSet.has(n));
      if (!matchesAll) return;

      if (!node.children || node.children.length === 0) {
        // It's a leaf node
        matchingLeaves.push(nodeKey);
        return;
      }

      for (const child of node.children) {
        findLeaves(child, path);
      }
    };

    // Start traversal from roots
    const roots = graphData.roots || [];
    for (const root of roots) {
      findLeaves(root, []);
    }

    const ambiguityScore = matchingLeaves.length > 1 ? 1.0 : 0.0;

    // Rule 1: confidence >= 0.95
    if (confidence < 0.95) {
      return { canResolve: false, ambiguityScore };
    }

    // Rule 2: complete path and no ambiguity (exactly 1 matching leaf)
    if (matchingLeaves.length !== 1) {
      return { canResolve: false, ambiguityScore };
    }

    const targetLeaf = matchingLeaves[0];
    const leafNode = nodes[targetLeaf];

    // Rule 3: target node.status === "ACTIVE"
    if (!leafNode || leafNode.status !== "ACTIVE") {
      return { canResolve: false, ambiguityScore };
    }

    return {
      canResolve: true,
      resolvedNode: targetLeaf,
      resolutionQuality: "FAST_PATH",
      ambiguityScore
    };
  }
}
