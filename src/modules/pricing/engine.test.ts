import { describe, it, expect } from "vitest";
import { calculateJob, calculateQuote, type TenantPricingConfig } from "./engine";

const config: TenantPricingConfig = {
  hourlyRate: 35,
  defaultMarginPercent: 40,
  defaultWastePercent: 10,
  complexityFactors: { low: 0, medium: 0.1, high: 0.2, very_high: 0.35 },
  urgencyFactors: { normal: 0, urgent: 0.2, very_urgent: 0.4 },
};

describe("calculateJob", () => {
  it("AC-001: materials = qty × price × (1+waste)", () => {
    const job = calculateJob(
      {
        laborMethod: "fixed",
        laborFixedPrice: 0,
        materials: [{ quantity: 3.2, unitPrice: 41 }],
        complexity: "low",
        urgency: "normal",
      },
      config,
      10,
      40,
    );
    expect(job.materials).toBeCloseTo(3.2 * 41 * 1.1, 2);
  });

  it("hourly labor uses tenant rate", () => {
    const job = calculateJob(
      {
        laborMethod: "hourly",
        estimatedMinutes: 480,
        materials: [],
        complexity: "low",
        urgency: "normal",
      },
      config,
      0,
      0,
    );
    expect(job.labor).toBe(280);
  });

  it("fixed labor uses fixed price", () => {
    const job = calculateJob(
      {
        laborMethod: "fixed",
        laborFixedPrice: 250,
        materials: [],
        complexity: "low",
        urgency: "normal",
      },
      config,
      0,
      0,
    );
    expect(job.labor).toBe(250);
  });

  it("AC-007: same input produces same output", () => {
    const input = {
      laborMethod: "hourly" as const,
      estimatedMinutes: 120,
      materials: [{ quantity: 2, unitPrice: 30 }],
      complexity: "medium" as const,
      urgency: "normal" as const,
    };
    const a = calculateJob(input, config);
    const b = calculateJob(input, config);
    expect(a).toEqual(b);
  });

  it("AC-009: two jobs sum into quote total", () => {
    const result = calculateQuote(
      {
        jobs: [
          {
            laborMethod: "fixed",
            laborFixedPrice: 250,
            materials: [{ quantity: 1, unitPrice: 100 }],
            complexity: "low",
            urgency: "normal",
          },
          {
            laborMethod: "hourly",
            estimatedMinutes: 60,
            materials: [],
            complexity: "low",
            urgency: "normal",
          },
        ],
        marginPercent: 0,
      },
      { ...config, defaultWastePercent: 0 },
    );
    expect(result.jobs).toHaveLength(2);
    expect(result.suggestedPrice).toBeCloseTo(
      result.jobs[0]!.suggestedPrice + result.jobs[1]!.suggestedPrice,
      2,
    );
    expect(result.labor).toBeCloseTo(250 + 35, 2);
  });

  it("AC-010: complexity and urgency appear in breakdown", () => {
    const job = calculateJob(
      {
        laborMethod: "fixed",
        laborFixedPrice: 100,
        materials: [],
        complexity: "high",
        urgency: "urgent",
      },
      config,
      0,
      0,
    );
    expect(job.complexity).toBe(20);
    expect(job.urgency).toBe(20);
    expect(job.suggestedPrice).toBe(140);
  });
});
