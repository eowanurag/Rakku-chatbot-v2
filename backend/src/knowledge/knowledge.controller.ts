import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get('search')
  async search(@Query('q') q: string) {
    if (!q) {
      return this.knowledgeService.getAll();
    }
    return this.knowledgeService.search(q);
  }

  @Get('category/:category')
  async getByCategory(@Param('category') category: string) {
    return this.knowledgeService.getByCategory(category);
  }

  @Get('governance/stats')
  async getGovernanceStats() {
    const rootDir = path.resolve(process.cwd());
    const graphsPath = path.join(rootDir, 'shared/copilot/scenario-graphs/graphs.json');
    const pendingDir = path.join(rootDir, 'shared/copilot/governance/submissions/pending');
    const approvedDir = path.join(rootDir, 'shared/copilot/governance/submissions/approved');
    const rejectedDir = path.join(rootDir, 'shared/copilot/governance/submissions/rejected');

    let activeScenarios = 0;
    let draftScenarios = 0;
    let deprecatedScenarios = 0;

    if (fs.existsSync(graphsPath)) {
      const graphs = JSON.parse(fs.readFileSync(graphsPath, 'utf8'));
      for (const node of Object.values(graphs.nodes) as any[]) {
        if (node.status === 'ACTIVE') activeScenarios++;
        else if (node.status === 'DRAFT') draftScenarios++;
        else if (node.status === 'DEPRECATED') deprecatedScenarios++;
      }
    }

    const countFiles = (dir: string) => {
      if (fs.existsSync(dir)) {
        return fs.readdirSync(dir).filter(f => f.endsWith('.json')).length;
      }
      return 0;
    };

    return {
      activeScenarios,
      draftScenarios,
      deprecatedScenarios,
      pendingSubmissions: countFiles(pendingDir),
      approvedSubmissions: countFiles(approvedDir),
      rejectedSubmissions: countFiles(rejectedDir),
    };
  }

  @Post('governance/submit')
  async submitScenario(@Body() body: any) {
    const rootDir = path.resolve(process.cwd());
    const pendingDir = path.join(rootDir, 'shared/copilot/governance/submissions/pending');

    if (!fs.existsSync(pendingDir)) {
      fs.mkdirSync(pendingDir, { recursive: true });
    }

    const fileName = `scenario-submission-${Date.now()}.json`;
    const filePath = path.join(pendingDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf8');
    return { success: true, file: fileName };
  }

  @Get()
  async getAll() {
    return this.knowledgeService.getAll();
  }
}
