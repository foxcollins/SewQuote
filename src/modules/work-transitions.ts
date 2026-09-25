export const WORK_STATUSES = [
  "accepted",
  "waiting_garment",
  "in_production",
  "fitting",
  "adjustments",
  "ready",
  "delivered",
  "cancelled",
] as const;

export type WorkStatus = (typeof WORK_STATUSES)[number];

export const WORK_TRANSITIONS: Record<string, string[]> = {
  accepted: ["waiting_garment", "in_production", "cancelled"],
  waiting_garment: ["in_production", "cancelled"],
  in_production: ["fitting", "adjustments", "ready", "cancelled"],
  fitting: ["adjustments", "ready", "in_production", "cancelled"],
  adjustments: ["fitting", "ready", "in_production", "cancelled"],
  ready: ["delivered", "adjustments"],
  delivered: [],
  cancelled: [],
};

export function isTerminalWorkStatus(status: string): boolean {
  return (WORK_TRANSITIONS[status] ?? []).length === 0;
}
