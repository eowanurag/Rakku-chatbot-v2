import { renderReview } from '@backend/chat/utils/review-renderer';

describe('Release - Renderer Validation Gate', () => {
  it('should return success false if type is missing', () => {
    const state = { workflow: 'complaint', data: { type: undefined } } as any;
    const result = renderReview(state, { translate: () => '', localizeLocation: () => '' } as any, () => ({ valid: false, checklist: '' }));
    expect(result.metadata.success).toBe(false);
  });
});
