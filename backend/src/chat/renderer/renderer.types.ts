export interface Button {
  text: string;
  payload: string;
}

export interface Card {
  title: string;
  subtitle?: string;
  buttons?: Button[];
}

export interface ChatRenderResult {
  text: string;
  buttons?: Button[];
  cards?: Card[];
  metadata?: Record<string, unknown>;
}
