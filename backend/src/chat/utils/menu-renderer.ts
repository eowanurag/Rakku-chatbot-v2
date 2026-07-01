import { ChatRenderResult } from '../renderer/renderer.types';

export function renderMenu(
  text: string,
  options: string[]
): ChatRenderResult {
  let menuText = text;
  if (options && options.length > 0) {
    menuText += '\n\n' + options.map(opt => `- [${opt}](option:${opt})`).join('\n');
  }
  return {
    text: menuText,
    buttons: options.map(opt => ({ text: opt, payload: opt }))
  };
}
