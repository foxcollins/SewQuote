export type LaborMethod = "fixed" | "hourly";

export type Complexity = "low" | "medium" | "high" | "very_high";

export type Urgency = "normal" | "urgent" | "very_urgent";

export interface TenantPricingConfig {
  hourlyRate: number;
  defaultMarginPercent: number;
  defaultWastePercent: number;
  complexityFactors: Record<Complexity, number>;
  urgencyFactors: Record<Urgency, number>;
}

export interface QuoteMaterialInput {
  quantity: number;
  unitPrice: number;
}

export interface QuoteJobInput {
  laborMethod: LaborMethod;
  laborFixedPrice?: number;
  estimatedMinutes?: number;
  materials: QuoteMaterialInput[];
  otherCosts?: number;
  complexity: Complexity;
  urgency: Urgency;
}

export interface QuoteInput {
  jobs: QuoteJobInput[];
  marginPercent?: number;
}

export interface JobBreakdown {
  materials: number;
  labor: number;
  complexity: number;
  urgency: number;
  margin: number;
  baseCost: number;
  suggestedPrice: number;
}

export interface QuoteBreakdown {
  jobs: JobBreakdown[];
  materials: number;
  labor: number;
  complexity: number;
  urgency: number;
  margin: number;
  suggestedPrice: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calculateJob(
  job: QuoteJobInput,
  config: TenantPricingConfig,
  wastePercent: number = config.defaultWastePercent,
  marginPercent: number = config.defaultMarginPercent,
): JobBreakdown {
  const waste = wastePercent / 100;
  const materials = round2(
    job.materials.reduce(
      (sum, m) => sum + m.quantity * m.unitPrice * (1 + waste),
      0,
    ),
  );

  let labor = 0;
  if (job.laborMethod === "fixed") {
    labor = round2(job.laborFixedPrice ?? 0);
  } else {
    const minutes = job.estimatedMinutes ?? 0;
    labor = round2((minutes / 60) * config.hourlyRate);
  }

  const other = round2(job.otherCosts ?? 0);
  const baseCost = round2(materials + labor + other);

  const complexity = round2(baseCost * config.complexityFactors[job.complexity]);
  const urgency = round2(baseCost * config.urgencyFactors[job.urgency]);
  const costBeforeMargin = round2(baseCost + complexity + urgency);
  const margin = round2(costBeforeMargin * (marginPercent / 100));

  return {
    materials,
    labor,
    complexity,
    urgency,
    margin,
    baseCost,
    suggestedPrice: round2(costBeforeMargin + margin),
  };
}

export function calculateQuote(
  input: QuoteInput,
  config: TenantPricingConfig,
): QuoteBreakdown {
  const margin = input.marginPercent ?? config.defaultMarginPercent;
  const jobs = input.jobs.map((j) =>
    calculateJob(j, config, config.defaultWastePercent, margin),
  );

  const sum = (pick: (b: JobBreakdown) => number) =>
    round2(jobs.reduce((acc, b) => acc + pick(b), 0));

  return {
    jobs,
    materials: sum((b) => b.materials),
    labor: sum((b) => b.labor),
    complexity: sum((b) => b.complexity),
    urgency: sum((b) => b.urgency),
    margin: sum((b) => b.margin),
    suggestedPrice: sum((b) => b.suggestedPrice),
  };
}
