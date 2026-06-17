import { PrismaService } from '../../backend/src/prisma.service';
import { DictionaryExportService } from '../../backend/src/copilot/cue/governance/dictionary-export.service';
import { CueService } from '../../backend/src/copilot/cue/runtime/cue.service';
import { DictionaryUnderstandingProvider } from '../../backend/src/copilot/cue/runtime/providers/dictionary-understanding.provider';

describe('CUE Governance & Export Boundary Verification', () => {
  let prisma: PrismaService;
  let exportService: DictionaryExportService;
  let cueService: CueService;

  beforeAll(() => {
    jest.setTimeout(30000);
    prisma = new PrismaService();
    const provider = new DictionaryUnderstandingProvider();
    cueService = new CueService(provider, prisma);
    exportService = new DictionaryExportService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should process candidates and export approved terms correctly', async () => {
    const uniqueTerm = "cyberstalking" + Math.random().toString(36).substring(7);

    // 1. Create a candidate by parsing unknown word
    const res = await cueService.normalize(`This is some random text with ${uniqueTerm}`, "session-gov-test", "CYBER_FRAUD");
    expect(res.cueResult.unknownTerms).toContain(uniqueTerm);

    // Find the candidate in DB
    const candidate = await prisma.understandingCandidate.findFirst({
      where: { term: uniqueTerm }
    });
    expect(candidate).toBeDefined();
    expect(candidate?.status).toBe("PENDING");
    expect(candidate?.priority).toBe("HIGH"); // containing 'cyber' word triggers HIGH priority

    // 2. Approve candidate
    await prisma.understandingCandidate.update({
      where: { id: candidate!.id },
      data: { status: "APPROVED" }
    });

    // Create a corresponding UnderstandingTerm
    const term = await prisma.understandingTerm.create({
      data: {
        term: uniqueTerm,
        meaning: "HARASSMENT",
        source: "SYNONYM",
        version: "1.0.0"
      }
    });

    // 3. Export
    const exportRes = await exportService.exportApprovedTerms("9.9.9");
    expect(exportRes.success).toBe(true);
    expect(exportRes.exportedCount).toBeGreaterThanOrEqual(1);

    // Check status is EXPORTED
    const updatedCandidate = await prisma.understandingCandidate.findUnique({
      where: { id: candidate!.id }
    });
    expect(updatedCandidate?.status).toBe("EXPORTED");
    expect(updatedCandidate?.promotedToTerm).toBe(true);

    const updatedTerm = await prisma.understandingTerm.findUnique({
      where: { id: term.id }
    });
    expect(updatedTerm?.exportedVersion).toBe("9.9.9");
    expect(updatedTerm?.exportedAt).toBeDefined();
  }, 30000);
});
