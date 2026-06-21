import { AiDependencyRegistry } from './ai-dependency.registry';
import { AiDependencyOptions } from './ai-dependency.types';

export function AiDependency(options: AiDependencyOptions): ClassDecorator {
  return (target: any) => {
    AiDependencyRegistry.register(target.name, options);
  };
}
