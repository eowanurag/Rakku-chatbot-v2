import { FastPathEngine } from '../../backend/src/copilot/sre/fast-path.engine';

describe('SRE Fast Path Engine', () => {
  let engine: FastPathEngine;
  let mockGraphData: any;

  beforeAll(() => {
    engine = new FastPathEngine();
    mockGraphData = {
      version: "1.0",
      roots: ["LOSS", "FRAUD"],
      nodes: {
        LOSS: { status: "ACTIVE", children: ["DOCUMENT"] },
        DOCUMENT: { status: "ACTIVE", children: ["AADHAAR"] },
        AADHAAR: { status: "ACTIVE", children: [] },
        FRAUD: { status: "INACTIVE", children: [] }
      }
    };
  });

  it('should resolve fast path for confidence >= 0.95 and full deterministic active path', () => {
    const res = engine.evaluateFastPath(["LOSS", "DOCUMENT", "AADHAAR"], 0.96, mockGraphData);
    expect(res.canResolve).toBe(true);
    expect(res.resolvedNode).toBe("AADHAAR");
    expect(res.resolutionQuality).toBe("FAST_PATH");
  });

  it('should not resolve fast path when confidence is below 0.95', () => {
    const res = engine.evaluateFastPath(["LOSS", "DOCUMENT", "AADHAAR"], 0.94, mockGraphData);
    expect(res.canResolve).toBe(false);
  });

  it('should reject fast path if target node is INACTIVE', () => {
    const res = engine.evaluateFastPath(["FRAUD"], 0.98, mockGraphData);
    expect(res.canResolve).toBe(false);
  });

  it('should report ambiguity and reject fast path if multiple leaf nodes match hints', () => {
    const ambigGraph = {
      roots: ["LOSS"],
      nodes: {
        LOSS: { status: "ACTIVE", children: ["DOCUMENT", "MOBILE"] },
        DOCUMENT: { status: "ACTIVE", children: [] },
        MOBILE: { status: "ACTIVE", children: [] }
      }
    };

    // User provided hints matching both branches
    const res = engine.evaluateFastPath(["LOSS", "DOCUMENT", "MOBILE"], 0.98, ambigGraph);
    expect(res.canResolve).toBe(false);
    expect(res.ambiguityScore).toBe(1.0);
  });
});
