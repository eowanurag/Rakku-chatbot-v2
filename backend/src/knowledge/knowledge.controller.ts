import { Controller, Get, Query, Param } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

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

  @Get()
  async getAll() {
    return this.knowledgeService.getAll();
  }
}
