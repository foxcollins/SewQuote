import type { Complexity, Urgency } from "./engine";

export function complexityPercent(
  factors: Record<Complexity, number>,
  level: Complexity,
): number {
  return factors[level];
}

export function urgencyPercent(
  factors: Record<Urgency, number>,
  level: Urgency,
): number {
  return factors[level];
}
