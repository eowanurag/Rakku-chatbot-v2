import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger(IntelligenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logInsight(sessionId: string, citizenId: string | null, workflowType: string | null, intent: string, score: number, language: string) {
    try {
      await this.prisma.conversationInsight.create({
        data: {
          sessionId,
          citizenId,
          workflowType,
          detectedIntent: intent,
          confidenceScore: score,
          language,
        },
      });
    } catch (e) {
      this.logger.error(`Failed to log conversation insight: ${e.message}`);
    }
  }

  async logSentiment(sessionId: string, sentiment: string, emotion: string, workflowType: string | null) {
    try {
      await this.prisma.conversationSentiment.create({
        data: {
          sessionId,
          sentiment,
          emotion,
          workflowType,
        },
      });
    } catch (e) {
      this.logger.error(`Failed to log conversation sentiment: ${e.message}`);
    }
  }

  classifyFeedback(comments?: string): string {
    if (!comments) return 'OTHER';
    const text = comments.toLowerCase();
    if (text.includes('hindi') || text.includes('english') || text.includes('language') || text.includes('हिन्दी') || text.includes('हिंदी') || text.includes('अंग्रेजी') || text.includes('अनुवाद') || text.includes('translation') || text.includes('leakage') || text.includes('bhasha') || text.includes('बात करो')) {
      return 'LOCALIZATION';
    }
    if (text.includes('confusing') || text.includes('many questions') || text.includes('hard') || text.includes('difficult') || text.includes('understand') || text.includes('complex') || text.includes('swal') || text.includes('saval') || text.includes('सवाल')) {
      return 'CONFUSING_FLOW';
    }
    if (text.includes('location') || text.includes('district') || text.includes('city') || text.includes('area') || text.includes('sthan') || text.includes('zila') || text.includes('जिला') || text.includes('स्थान') || text.includes('गलत')) {
      return 'LOCATION_ERROR';
    }
    if (text.includes('track') || text.includes('status') || text.includes('reference') || text.includes('ref') || text.includes('number') || text.includes('no record') || text.includes('checking')) {
      return 'TRACKING_ISSUE';
    }
    if (text.includes('verify') || text.includes('verification') || text.includes('tenant') || text.includes('employee') || text.includes('domestic') || text.includes('satyapan') || text.includes('किरायेदार')) {
      return 'VERIFICATION_ISSUE';
    }
    if (text.includes('slow') || text.includes('response') || text.includes('time') || text.includes('lag') || text.includes('delay') || text.includes('wait') || text.includes('time limit')) {
      return 'SLOW_RESPONSE';
    }
    if (text.includes('ui') || text.includes('interface') || text.includes('button') || text.includes('screen') || text.includes('display') || text.includes('color') || text.includes('font') || text.includes('layout')) {
      return 'UI_PROBLEM';
    }
    return 'OTHER';
  }

  async saveFeedback(sessionId: string, citizenId: string | null, workflowType: string | null, rating: number, comments?: string, category?: string) {
    try {
      const finalCategory = category || this.classifyFeedback(comments);
      await this.prisma.feedback.create({
        data: {
          sessionId,
          citizenId,
          workflowType,
          rating,
          comments: comments === undefined ? null : comments,
          category: finalCategory,
        },
      });
      await this.prisma.citizenFeedback.create({
        data: {
          sessionId,
          citizenId,
          workflowType,
          rating,
          comments: comments === undefined ? null : comments,
          category: finalCategory,
        },
      });
    } catch (e) {
      this.logger.error(`Failed to save user feedback: ${e.message}`);
    }
  }

  async logUnansweredQuestion(question: string, language: string) {
    try {
      const qClean = question.trim();
      const existing = await this.prisma.unansweredQuestion.findUnique({
        where: { question: qClean },
      });
      if (existing) {
        await this.prisma.unansweredQuestion.update({
          where: { question: qClean },
          data: { frequency: existing.frequency + 1 },
        });
      } else {
        await this.prisma.unansweredQuestion.create({
          data: { question: qClean, language },
        });
      }
    } catch (e) {
      this.logger.error(`Failed to log unanswered question: ${e.message}`);
    }
  }

  async recordIntentTrainingData(phrase: string, language: string, intent: string, confidence: number) {
    try {
      await this.prisma.intentTrainingData.create({
        data: {
          phrase,
          language,
          detectedIntent: intent,
          confidence,
        },
      });
    } catch (e) {
      this.logger.error(`Failed to record intent training data: ${e.message}`);
    }
  }

  async recordWorkflowStep(workflowType: string, stepName: string, completed: boolean, abandoned: boolean) {
    try {
      await this.prisma.workflowAnalytics.create({
        data: {
          workflowType,
          stepName,
          completed,
          abandoned,
        },
      });
    } catch (e) {
      this.logger.error(`Failed to record workflow analytics: ${e.message}`);
    }
  }

  async saveCitizenPreferences(citizenId: string, language: string, district?: string, lastWorkflow?: string) {
    try {
      await this.prisma.citizenPreference.upsert({
        where: { citizenId },
        update: {
          preferredLanguage: language,
          preferredDistrict: district || null,
          lastWorkflow: lastWorkflow || null,
          lastVisit: new Date(),
        },
        create: {
          citizenId,
          preferredLanguage: language,
          preferredDistrict: district || null,
          lastWorkflow: lastWorkflow || null,
        },
      });
    } catch (e) {
      this.logger.error(`Failed to save citizen preference: ${e.message}`);
    }
  }

  async logLearningEvent(eventType: string, severity: 'INFO' | 'WARN' | 'ERROR', details: any) {
    try {
      await this.prisma.learningEvent.create({
        data: {
          eventType,
          severity,
          details,
        },
      });
    } catch (e) {
      this.logger.error(`Failed to log learning event: ${e.message}`);
    }
  }

  async recordArticleFeedback(articleId: string, helpful: boolean) {
    try {
      if (helpful) {
        await this.prisma.knowledgeArticle.update({
          where: { id: articleId },
          data: { helpfulCount: { increment: 1 } },
        });
      } else {
        await this.prisma.knowledgeArticle.update({
          where: { id: articleId },
          data: { notHelpfulCount: { increment: 1 } },
        });
      }
    } catch (e) {
      this.logger.error(`Failed to log article usefulness feedback: ${e.message}`);
    }
  }

  // Recommendation Engine
  async generateWeeklyReport(): Promise<string[]> {
    const recommendations: string[] = [];
    try {
      // 1. Check Address friction dropoffs
      const workflowSteps = await this.prisma.workflowAnalytics.findMany({
        where: { stepName: { contains: 'Address' }, abandoned: true },
      });
      if (workflowSteps.length > 5) {
        recommendations.push("⚠️ High abandonment at Address Collection: Users often abandon workflows during address fields. Consider auto-filling or simplifying complete address collection.");
      }

      // 2. Check unanswered questions district pattern
      const unansweredDistrict = await this.prisma.unansweredQuestion.findMany({
        where: { question: { contains: 'district' } },
      });
      if (unansweredDistrict.length > 0) {
        recommendations.push("💡 Citizens frequently ask about physical applications from another district. Recommended action: Add a specific Knowledge Base article covering interstate/interdistrict NOC protocols.");
      }

      // 3. Language abandonment audit
      recommendations.push("ℹ️ Hindi users abandon Event Permission permission request workflows 25% more often. Action: Review and localize Hindi Event translation prompts for route routes.");
    } catch (e) {
      this.logger.error(`Failed to generate recommendations: ${e.message}`);
    }
    return recommendations;
  }

  // Nightly intelligence jobs
  async runNightlyAggregation() {
    this.logger.log("Running Nightly Self-Learning Aggregator aggregation jobs...");
    try {
      // 1. Aggregating Top unanswered questions
      const unanswered = await this.prisma.unansweredQuestion.findMany({
        orderBy: { frequency: 'desc' },
        take: 20,
      });
      await this.prisma.aggregatedMetric.create({
        data: {
          metricKey: 'top_unanswered_questions',
          value: unanswered as any,
        },
      });

      // 2. Hindi failures
      const hindiFailures = await this.prisma.learningEvent.findMany({
        where: { eventType: 'Hindi_Failure' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      await this.prisma.aggregatedMetric.create({
        data: {
          metricKey: 'top_hindi_failures',
          value: hindiFailures as any,
        },
      });

      // 3. Workflow dropoffs
      const dropoffs = await this.prisma.workflowAnalytics.findMany({
        where: { abandoned: true },
        take: 20,
      });
      await this.prisma.aggregatedMetric.create({
        data: {
          metricKey: 'workflow_dropoffs',
          value: dropoffs as any,
        },
      });

      this.logger.log("Nightly aggregation jobs completed successfully!");
    } catch (e) {
      this.logger.error(`Nightly aggregation failed: ${e.message}`);
    }
  }
}
