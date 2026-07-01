import { ChatRenderResult } from '../renderer/renderer.types';

export function renderRecovery(
  resumeMessage: string,
  options: string[]
): ChatRenderResult {
  let text = resumeMessage;
  if (options && options.length > 0) {
    text += '\n\n' + options.map(opt => `- [${opt}](option:${opt})`).join('\n');
  }
  return {
    text,
    buttons: options.map(opt => ({ text: opt, payload: opt }))
  };
}
