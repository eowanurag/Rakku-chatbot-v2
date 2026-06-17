import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ScenarioGraphEngine } from './resolver/scenario-graph.engine';
import { KnowledgeEngine } from './knowledge/knowledge-engine';
import { RiskEngine } from './risk/risk-engine';
import { InformationGainPlanner } from './clarification/information-gain.planner';
import { ExplanationEngine } from './explanation/explanation-engine';
import { OutcomeEngine } from './outcomes/outcome-engine';
import { SessionStateManager } from './state/session-state.manager';
import { LearningEngine } from './learning/learning-engine';
import { PrismaClient } from '@prisma/client';
import { ConfidenceFusionEngine } from './confidence-fusion.engine';
import { FastPathEngine } from './fast-path.engine';
import { GraphMissService } from './analytics/graph-miss.service';
import { SreTelemetry } from './telemetry/sre-telemetry';

@Injectable()
export class SreService {
  private graphEngine: ScenarioGraphEngine;
  private knowledgeEngine: KnowledgeEngine;
  private riskEngine: RiskEngine;
  private igPlanner: InformationGainPlanner;
  private explanationEngine: ExplanationEngine;
  private outcomeEngine: OutcomeEngine;
  private stateManager: SessionStateManager;
  private learningEngine: LearningEngine;
  private prisma: PrismaClient;
  private confidenceFusionEngine: ConfidenceFusionEngine;
  private fastPathEngine: FastPathEngine;
  private graphMissService: GraphMissService;
  private telemetry: SreTelemetry;
  private readonly logger = new Logger(SreService.name);

  constructor(private eventEmitter: EventEmitter2) {
    const basePath = 'shared/copilot';
    this.graphEngine = new ScenarioGraphEngine(basePath);
    this.knowledgeEngine = new KnowledgeEngine(basePath);
    this.riskEngine = new RiskEngine(basePath);
    this.igPlanner = new InformationGainPlanner(basePath);
    this.explanationEngine = new ExplanationEngine();
    this.outcomeEngine = new OutcomeEngine(basePath);
    this.stateManager = new SessionStateManager();
    this.learningEngine = new LearningEngine();
    this.prisma = new PrismaClient();
    this.confidenceFusionEngine = new ConfidenceFusionEngine();
    this.fastPathEngine = new FastPathEngine();
    this.graphMissService = new GraphMissService(this.prisma as any);
    this.telemetry = new SreTelemetry(this.eventEmitter);
  }

  async processIntent(
    sessionId: string,
    intentPath: string[],
    context: Record<string, any>,
    additionalOptions?: {
      cueConfidence?: number;
      saeConfidence?: number;
      saeSources?: string[];
      scenarioHints?: string[];
    }
  ) {
    // 1. Resolve seed nodes and load session for recovery checks
    let session = await this.prisma.scenarioSession.findUnique({ where: { sessionId } });
    
    const scenarioHints = additionalOptions?.scenarioHints || intentPath || [];
    
    // Recovery Check: Use activeScenarioPath if session is present and active
    const activePathList = (session?.activeScenarioPath as string[]) || [];
    const seedNodes = scenarioHints.length > 0 ? scenarioHints : activePathList;

    // SRE seeded traversal
    const traversalResult = this.graphEngine.traverseFromSeeds(seedNodes);
    const { path, requiresImmediateEscalation } = traversalResult;
    const scenario = path[path.length - 1] || "UNKNOWN";
    
    this.telemetry.emit('SCENARIO_HINT_GENERATED', { sessionId, scenarioHints });

    // 2. Fetch Knowledge
    const knowledge = this.knowledgeEngine.getKnowledge(scenario);

    // 3. Completeness (acting as SRE graph walker confidence)
    const completeness = this.graphEngine.calculateCompleteness(scenario, context, knowledge.requiredInformation || []);

    // 4. Evaluate Risk
    const risk = this.riskEngine.evaluateRisk(scenario, context);
    this.telemetry.emit('RISK_CLASSIFIED', { sessionId, scenario, risk });

    // Scenario Drift Tracker
    let scenarioRevision = session?.scenarioRevision || 1;
    if (session && activePathList.length > 0 && path.length > 0) {
      if (path[0] !== activePathList[0]) {
        scenarioRevision++;
        this.telemetry.emit('SCENARIO_DRIFT_DETECTED', {
          sessionId,
          oldRoot: activePathList[0],
          newRoot: path[0],
          revision: scenarioRevision
        });
      }
    }

    if (!session) {
      session = await this.prisma.scenarioSession.create({
        data: {
          sessionId,
          currentScenario: scenario,
          clarificationCount: 0,
          askedQuestions: [],
          scenarioRevision,
          activeScenarioPath: path as any,
          currentNode: scenario
        }
      });
    }

    const askedQuestionsList = (session.askedQuestions as any[])?.map(q => q.questionId) || [];

    // 5. Graph Miss Analytics Check
    // If seeds contained keywords under known parent category but were not registered SRE node children
    const graphData = this.graphEngine.getGraphData();
    for (const hint of scenarioHints) {
      const hintUpper = hint.toUpperCase();
      // If hint is not a node in SRE but parent root or branch is matched in seeds
      if (graphData.nodes && !graphData.nodes[hintUpper]) {
        // Find a matched parent node in seeds
        for (const pNode of path) {
          const parentChildren = graphData.nodes[pNode]?.children || [];
          // Queue candidate proposedNode
          await this.graphMissService.recordGraphMiss(pNode, hintUpper);
          this.telemetry.emit('SCENARIO_GRAPH_MISS', {
            sessionId,
            parentNode: pNode,
            proposedNode: hintUpper
          });
        }
      }
    }

    // 6. Confidence Fusion Engine
    const cueConf = additionalOptions?.cueConfidence ?? 1.0;
    const saeConf = additionalOptions?.saeConfidence ?? 0.85;
    const fusion = this.confidenceFusionEngine.fuse(cueConf, saeConf, completeness);
    const overallScenarioConfidence = fusion.fused;
    this.telemetry.emit('SCENARIO_CONFIDENCE_CALCULATED', { sessionId, confidence: overallScenarioConfidence });

    // 7. Fast Path Evaluator & Ambiguity Checks
    const fastPathResult = this.fastPathEngine.evaluateFastPath(seedNodes, overallScenarioConfidence, graphData);
    
    let resolutionSource = 'GRAPH_AND_QUESTION';
    if (!additionalOptions?.scenarioHints || additionalOptions.scenarioHints.length === 0) {
      if (activePathList.length > 0) {
        resolutionSource = 'GRAPH_ONLY';
      }
    }
    let resolutionQuality = 'CLARIFIED';

    if (fastPathResult.canResolve) {
      resolutionSource = 'FAST_PATH';
      resolutionQuality = 'FAST_PATH';
      this.telemetry.emit('FAST_PATH_RESOLUTION', { sessionId, resolvedNode: fastPathResult.resolvedNode });
      this.telemetry.emit('CLARIFICATION_AVOIDED', { sessionId, resolvedNode: fastPathResult.resolvedNode });
    } else {
      if (fastPathResult.ambiguityScore > 0.5) {
        this.telemetry.emit('SCENARIO_AMBIGUITY_DETECTED', { sessionId, ambiguityScore: fastPathResult.ambiguityScore });
      }
      
      // Outcome Thresholds Mapping
      if (overallScenarioConfidence >= 0.95) {
        resolutionQuality = 'HIGH_CONFIDENCE';
      } else if (askedQuestionsList.length > 0) {
        resolutionQuality = 'CLARIFIED';
      } else if (overallScenarioConfidence >= 0.50 && overallScenarioConfidence < 0.70) {
        resolutionQuality = 'OFFICER_REVIEW';
      } else {
        resolutionQuality = 'FALLBACK';
      }
    }

    // 8. Information Gain Planner (bypassed if Fast Path is active)
    let nextQuestion = null;
    let budgetExhausted = false;

    if (resolutionQuality !== 'FAST_PATH') {
      nextQuestion = this.igPlanner.getBestQuestion(scenario, askedQuestionsList, risk);
      if (!nextQuestion && askedQuestionsList.length >= 3) {
         budgetExhausted = true;
         this.telemetry.emit('CLARIFICATION_BUDGET_EXHAUSTED', { sessionId, scenario });
      } else if (nextQuestion) {
         this.telemetry.emit('CLARIFICATION_REQUIRED', { sessionId, questionId: nextQuestion.questionId });
         session = this.stateManager.updateAskedQuestions(session as any, nextQuestion.questionId, nextQuestion.gain) as any;
         await this.prisma.scenarioSession.update({
           where: { sessionId },
           data: {
             askedQuestions: session.askedQuestions,
             clarificationCount: session.clarificationCount,
             activeScenarioPath: path as any,
             currentNode: scenario,
             scenarioRevision
           }
         });
      }
    }

    // Outcome determination based SRE thresholds
    let outcome = 'CLARIFICATION_REQUIRED';
    if (resolutionQuality === 'FAST_PATH') {
      outcome = 'DOCUMENT_REPLACEMENT';
    } else {
      outcome = this.outcomeEngine.determineOutcome(scenario, overallScenarioConfidence, budgetExhausted, requiresImmediateEscalation);
      if (outcome === 'OFFICER_REVIEW') {
        resolutionQuality = 'OFFICER_REVIEW';
      } else if (overallScenarioConfidence < 0.50) {
        resolutionQuality = 'FALLBACK';
      }
    }
    
    this.telemetry.emit('OUTCOME_SELECTED', { sessionId, scenario, outcome });

    // Explanation Engine
    const explanation = this.explanationEngine.generateExplanation(scenario, context, risk, outcome);

    // Learning suggestion
    this.learningEngine.emitSuggestion(scenario, 'Analyze SRE fusion metrics', this.eventEmitter);

    if (requiresImmediateEscalation) resolutionSource = 'EMERGENCY_ESCALATION';
    else if (outcome === 'OFFICER_REVIEW') resolutionSource = 'OFFICER_REVIEW';

    // Persist Scenario Assessment
    const assessment = await this.prisma.scenarioAssessment.create({
      data: {
        sessionId,
        scenario,
        scenarioPath: path,
        scenarioHints: seedNodes,
        scenarioCompleteness: completeness,
        outcome,
        goal: 'Address ' + scenario,
        riskLevel: risk,
        confidence: completeness,
        scenarioConfidence: overallScenarioConfidence,
        confidenceHistory: [{ version: 1, confidence: overallScenarioConfidence, active: true }],
        reasoningSummary: explanation,
        actionPlan: { recommendedActions: knowledge.recommendedActions || [] },
        resolutionSource,
        graphVersion: graphData.version || "1.0",
        graphHash: this.graphEngine.getGraphHash(),
        resolutionQuality,
        hintConfidenceBreakdown: fusion.breakdown as any
      }
    });

    // Update Session Lifecycle
    await this.prisma.scenarioSession.update({
      where: { sessionId },
      data: {
        currentScenario: scenario,
        activeScenarioPath: path as any,
        currentNode: scenario,
        scenarioRevision
      }
    });

    this.telemetry.emit('ACTION_PLAN_GENERATED', { sessionId, assessmentId: assessment.id });

    return assessment;
  }
}
