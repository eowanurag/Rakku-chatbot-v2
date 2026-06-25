import { detectContainerContext, ContainerType } from '../../backend/src/copilot/cie/config/incident-container.config';

describe('Container Ordering Intelligence Test', () => {
  it('should preserve textual order for "wallet and suitcase"', () => {
    const res = detectContainerContext('I lost my wallet and suitcase');
    expect(res.containers).toEqual([ContainerType.WALLET, ContainerType.SUITCASE]);
    expect(res.displayLabel).toBe('wallet');
  });

  it('should preserve textual order for "suitcase and wallet"', () => {
    const res = detectContainerContext('I lost my suitcase and wallet');
    expect(res.containers).toEqual([ContainerType.SUITCASE, ContainerType.WALLET]);
    expect(res.displayLabel).toBe('suitcase');
  });
});
