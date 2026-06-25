import { IncidentItemService } from '../../backend/src/copilot/cie/services/incident-item.service';

describe('Item Extraction Performance Test', () => {
  let service: IncidentItemService;

  beforeAll(() => {
    service = new IncidentItemService();
  });

  it('should process 20 items and 1000 characters within strict SLA thresholds: 95th %ile < 50ms and max < 100ms', () => {
    // Construct a long text with 1000 characters containing keywords to extract up to 20 items
    const narrativeText = `I lost my bag containing passport, driving license, aadhaar, pan card, vehicle rc, chequebook. inside there were two credit cards (creditcard, credit card), debit card, and ATM card. Also had my mobile phone, cash of Rs 5000, and some other documents. Additionally, we found electronics, some cards, and other devices. It was stolen yesterday. ${'a'.repeat(700)}`;
    
    expect(narrativeText.length).toBeGreaterThanOrEqual(1000);

    const iterationCount = 50;
    const runtimes: number[] = [];

    // Warm up the runtime
    service.extractItemsAndContainers(narrativeText);

    for (let i = 0; i < iterationCount; i++) {
      const start = performance.now();
      service.extractItemsAndContainers(narrativeText);
      const end = performance.now();
      runtimes.push(end - start);
    }

    // Sort runtimes to calculate percentiles
    runtimes.sort((a, b) => a - b);

    const p95Index = Math.floor(iterationCount * 0.95);
    const p95Runtime = runtimes[p95Index];
    const maxRuntime = runtimes[runtimes.length - 1];

    console.log(`Item Extraction Performance: p95 = ${p95Runtime.toFixed(2)}ms, max = ${maxRuntime.toFixed(2)}ms`);

    expect(p95Runtime).toBeLessThan(50);
    expect(maxRuntime).toBeLessThan(100);
  });
});
