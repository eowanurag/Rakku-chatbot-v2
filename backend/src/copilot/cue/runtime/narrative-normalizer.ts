import { DictionaryNormalizer, TransformationLogEntry } from './dictionary-normalizer';
import { DialectNormalizer } from './dialect-normalizer';
import { SynonymResolver } from './synonym-resolver';

export class NarrativeNormalizer {
  private dictNormalizer: DictionaryNormalizer;
  private dialectNormalizer: DialectNormalizer;
  private synonymResolver: SynonymResolver;

  constructor() {
    this.dictNormalizer = new DictionaryNormalizer();
    this.dialectNormalizer = new DialectNormalizer();
    this.synonymResolver = new SynonymResolver();
  }

  public getDictionaryVersions() {
    return {
      synonyms: this.synonymResolver.getVersion(),
      dialects: this.dialectNormalizer.getVersion(),
      abbreviations: this.dictNormalizer.getAbbreviationsVersion(),
      normalizationRules: this.dictNormalizer.getRulesVersion()
    };
  }

  public normalize(text: string): { normalized: string; log: TransformationLogEntry[] } {
    const log: TransformationLogEntry[] = [];
    
    // 1. Basic Cleaning & Abbreviations expansion
    let result = this.dictNormalizer.normalize(text, log);
    
    // 2. Dialect translation (phrase/word replacements)
    result = this.dialectNormalizer.normalize(result, log);
    
    // 3. Synonym/slang token resolution
    result = this.synonymResolver.normalize(result, log);
    
    // Clean potential double spaces left during replacements
    result = result.replace(/\s+/g, " ").trim();

    return {
      normalized: result,
      log
    };
  }
}
