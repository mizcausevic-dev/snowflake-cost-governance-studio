// Operator surface for Snowflake cost governance and warehouse optimization posture.

export type ScopeKind = "ACCOUNT" | "WAREHOUSE" | "DATABASE" | "WORKLOAD";
export type BaselineStatus = "CURRENT" | "STALE";
export type DriftStatus = "OPEN" | "ACKNOWLEDGED" | "ROUTED";
export type AnomalyFamily = "Warehouse" | "Queries" | "Storage" | "Tagging" | "Telemetry" | "Transfer";

export interface SpendSnapshot {
  id: string;
  name: string;
  scope: ScopeKind;
  scopePath: string;
  accountName: string;
  baselineStatus: BaselineStatus;
  owner: string;
  currentMonthCredits: number;
  budgetCredits: number;
  monthOverMonthChangePct: number;
  tagCoveragePct: number;
  idleCreditsPct: number;
  collectedAt: string;
}

export interface CostDrift {
  id: string;
  snapshotId: string;
  scope: ScopeKind;
  scopePath: string;
  family: AnomalyFamily;
  status: DriftStatus;
  resourceName: string;
  expectedState: string;
  observedState: string;
  estimatedImpactCredits: number;
  changeWindowHours: number;
  owner: string;
  breaksGuardrail?: boolean;
  affectsForecast?: boolean;
  affectsChargeback?: boolean;
  note?: string;
}

export interface SnowflakeCostExport {
  snapshots?: SpendSnapshot[];
  drifts?: CostDrift[];
}

export type FindingSeverity = "high" | "medium" | "low" | "info";

export type FindingCode =
  | "no-current-snapshot"
  | "stale-snapshot"
  | "warehouse-spike"
  | "idle-compute-surge"
  | "query-cost-hotspot"
  | "low-tag-coverage"
  | "storage-retention-bloat"
  | "data-transfer-burst"
  | "telemetry-gap"
  | "stale-optimization-window";

export interface Finding {
  code: FindingCode;
  severity: FindingSeverity;
  message: string;
  subject: string;
  subjectName?: string;
  scope?: ScopeKind;
  family?: AnomalyFamily;
  resourceName?: string;
}

export interface DriftReport {
  generatedAt: string;
  snapshots: number;
  currentSnapshots: number;
  drifts: number;
  warehouseSpikes: number;
  tagCoverageGaps: number;
  optimizationEscalations: number;
  findingsList: Finding[];
  ok: boolean;
}

export interface DriftOptions {
  now?: string;
  staleOptimizationAfterHours?: number;
}
