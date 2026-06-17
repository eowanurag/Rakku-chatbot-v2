import * as fs from 'fs';

export class ScenarioValidator {
  static validate(graphsPath: string) {
    if (!fs.existsSync(graphsPath)) return;
    const data = JSON.parse(fs.readFileSync(graphsPath, 'utf8'));
    const nodes = data.nodes;
    const roots = data.roots;

    if (!roots || roots.length === 0) {
      throw new Error('Graph validation failed: No roots defined.');
    }

    // Check for orphan nodes
    const reachableNodes = new Set<string>();
    const stack = [...roots];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (!reachableNodes.has(current)) {
        reachableNodes.add(current);
        const node = nodes[current];
        if (node && node.children) {
          stack.push(...node.children);
        }
      }
    }

    const allNodes = Object.keys(nodes);
    for (const node of allNodes) {
      if (!reachableNodes.has(node) && !roots.includes(node)) {
        throw new Error(`Graph validation failed: Orphan node detected - ${node}`);
      }
    }

    // Circular loop detection
    const visited = new Set<string>();
    const recStack = new Set<string>();

    function isCyclic(nodeKey: string): boolean {
      if (!visited.has(nodeKey)) {
        visited.add(nodeKey);
        recStack.add(nodeKey);

        const node = nodes[nodeKey];
        if (node && node.children) {
          for (const child of node.children) {
            if (!visited.has(child) && isCyclic(child)) {
              return true;
            } else if (recStack.has(child)) {
              return true;
            }
          }
        }
      }
      recStack.delete(nodeKey);
      return false;
    }

    for (const root of roots) {
      if (isCyclic(root)) {
        throw new Error(`Graph validation failed: Circular loop detected starting from ${root}`);
      }
    }
  }
}
