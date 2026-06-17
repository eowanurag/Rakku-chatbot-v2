import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfidenceFusionEngine {
  public fuse(
    cueConfidence: number,
    saeConfidence: number,
    sreConfidence: number
  ): {
    fused: number;
    breakdown: {
      cue: number;
      sae: number;
      sre: number;
    };
  } {
    const cue = cueConfidence ?? 1.0;
    const sae = saeConfidence ?? 0.5;
    const sre = sreConfidence ?? 0.5;

    const fused = (cue * 0.15) + (sae * 0.25) + (sre * 0.60);
    const rounded = parseFloat(fused.toFixed(4));

    return {
      fused: rounded,
      breakdown: {
        cue,
        sae,
        sre
      }
    };
  }
}
