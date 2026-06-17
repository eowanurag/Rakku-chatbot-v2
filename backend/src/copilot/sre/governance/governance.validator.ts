import { ScenarioValidator } from './scenario-validator';
import { PlaybookValidator } from './playbook-validator';
import { KnowledgeValidator } from './knowledge-validator';

export class GovernanceValidator {
  static validateAll(basePath: string) {
    ScenarioValidator.validate(`${basePath}/scenario-graphs/graphs.json`);
    PlaybookValidator.validate(`${basePath}/playbooks`);
    KnowledgeValidator.validate(`${basePath}/knowledge`);
  }
}
