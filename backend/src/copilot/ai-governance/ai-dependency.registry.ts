import { AiDependencyType, AiDependencyOptions } from './ai-dependency.types';

export interface RegisteredDependency {
  target: string;
  type: AiDependencyType;
  description?: string;
}

export class AiDependencyRegistry {
  private static dependencies: RegisteredDependency[] = [];

  public static register(targetName: string, options: AiDependencyOptions) {
    // Avoid double registrations
    const existing = this.dependencies.find(d => d.target === targetName);
    if (!existing) {
      this.dependencies.push({
        target: targetName,
        type: options.type,
        description: options.description,
      });
    }
  }

  public static getDependencies(): RegisteredDependency[] {
    return this.dependencies;
  }

  public static clear() {
    this.dependencies = [];
  }
}
