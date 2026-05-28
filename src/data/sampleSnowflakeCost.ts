import type { SnowflakeCostExport } from "../types.js";

export const sampleSnowflakeCostPayload: SnowflakeCostExport = {
  snapshots: [
    {
      id: "snap-workloads",
      name: "Shared analytics workloads",
      scope: "ACCOUNT",
      scopePath: "/accounts/kg-prod/usage/shared-analytics",
      accountName: "KG_PROD",
      baselineStatus: "CURRENT",
      owner: "Data Platform",
      currentMonthCredits: 6840,
      budgetCredits: 6200,
      monthOverMonthChangePct: 18,
      tagCoveragePct: 88,
      idleCreditsPct: 22,
      collectedAt: "2026-05-30T14:00:00Z"
    },
    {
      id: "snap-finance-mart",
      name: "Finance mart and replication",
      scope: "WAREHOUSE",
      scopePath: "/accounts/kg-prod/warehouses/finance_transform",
      accountName: "KG_PROD",
      baselineStatus: "STALE",
      owner: "FinOps Operations",
      currentMonthCredits: 2190,
      budgetCredits: 2400,
      monthOverMonthChangePct: 7,
      tagCoveragePct: 71,
      idleCreditsPct: 11,
      collectedAt: "2026-05-27T08:30:00Z"
    }
  ],
  drifts: [
    {
      id: "drift-warehouse-spike",
      snapshotId: "snap-workloads",
      scope: "WAREHOUSE",
      scopePath: "/accounts/kg-prod/warehouses/transform_xl",
      family: "Warehouse",
      status: "OPEN",
      resourceName: "TRANSFORM_XL",
      expectedState: "Shared analytics warehouse stays within the monthly credit envelope.",
      observedState: "Warehouse spend spike after concurrency scale-up and longer idle timeout.",
      estimatedImpactCredits: 1240,
      changeWindowHours: 18,
      owner: "Data Platform",
      breaksGuardrail: true,
      affectsForecast: true,
      note: "Auto-suspend drift is already burning through the monthly forecast."
    },
    {
      id: "drift-idle-compute",
      snapshotId: "snap-workloads",
      scope: "WAREHOUSE",
      scopePath: "/accounts/kg-prod/warehouses/bi_medium",
      family: "Warehouse",
      status: "ACKNOWLEDGED",
      resourceName: "BI_MEDIUM",
      expectedState: "BI warehouse auto-suspends quickly outside dashboard refresh windows.",
      observedState: "Warehouse sits idle for long periods and remains underused overnight.",
      estimatedImpactCredits: 410,
      changeWindowHours: 31,
      owner: "Analytics Engineering",
      affectsForecast: true
    },
    {
      id: "drift-query-hotspot",
      snapshotId: "snap-workloads",
      scope: "WORKLOAD",
      scopePath: "/accounts/kg-prod/workloads/weekly_exec_rollup",
      family: "Queries",
      status: "OPEN",
      resourceName: "weekly_exec_rollup.sql",
      expectedState: "Executive rollup query keeps scans bounded and reuses clustered storage efficiently.",
      observedState: "Query hotspot with wide scans and repeated full-history reads.",
      estimatedImpactCredits: 860,
      changeWindowHours: 14,
      owner: "Analytics Engineering",
      breaksGuardrail: true,
      affectsForecast: true
    },
    {
      id: "drift-tag-coverage",
      snapshotId: "snap-finance-mart",
      scope: "DATABASE",
      scopePath: "/accounts/kg-prod/databases/finance_mart",
      family: "Tagging",
      status: "OPEN",
      resourceName: "FINANCE_MART",
      expectedState: "Warehouse, database, and task costs carry owner and cost-center tags for chargeback.",
      observedState: "Untagged spend remains on replicated tasks and one ad hoc warehouse.",
      estimatedImpactCredits: 280,
      changeWindowHours: 42,
      owner: "FinOps Operations",
      affectsChargeback: true
    },
    {
      id: "drift-storage-bloat",
      snapshotId: "snap-finance-mart",
      scope: "DATABASE",
      scopePath: "/accounts/kg-prod/databases/raw_events",
      family: "Storage",
      status: "ACKNOWLEDGED",
      resourceName: "RAW_EVENTS",
      expectedState: "Historical storage and fail-safe retention stay trimmed to the published retention window.",
      observedState: "Storage retention bloat from stale transient clones and extended fail-safe footprint.",
      estimatedImpactCredits: 560,
      changeWindowHours: 28,
      owner: "Data Platform"
    },
    {
      id: "drift-telemetry-gap",
      snapshotId: "snap-finance-mart",
      scope: "ACCOUNT",
      scopePath: "/accounts/kg-prod/usage/telemetry_exports",
      family: "Telemetry",
      status: "OPEN",
      resourceName: "ACCOUNT_USAGE_EXPORT",
      expectedState: "Usage export and warehouse metering feeds land daily for optimization review.",
      observedState: "Usage export partitions are missing for the last two days.",
      estimatedImpactCredits: 190,
      changeWindowHours: 36,
      owner: "Data Platform",
      breaksGuardrail: true,
      affectsChargeback: true
    }
  ]
};

export const warehouseLanePackets = [
  {
    id: "warehouse-efficiency",
    lane: "Warehouse efficiency lane",
    owner: "Data Platform",
    focus: "Compute spikes, idle windows, auto-suspend posture, and credit runway",
    status: "red",
    note: "Transform and BI warehouses are consuming more credits than the envelope expects.",
    nextAction: "Trim idle windows, rightsize concurrency, and restore suspend discipline on the high-credit warehouses."
  },
  {
    id: "query-governance",
    lane: "Query governance lane",
    owner: "Analytics Engineering",
    focus: "Scan hotspots, repeated full-table reads, and workload tuning",
    status: "red",
    note: "One executive rollup path is generating a query-cost hotspot that is already pressuring the forecast.",
    nextAction: "Refactor the hotspot query path and validate clustering/pruning before the next executive refresh cycle."
  },
  {
    id: "chargeback-hygiene",
    lane: "Chargeback hygiene lane",
    owner: "FinOps Operations",
    focus: "Tag coverage, owner attribution, and finance-facing visibility",
    status: "yellow",
    note: "Untagged tasks and warehouses are reducing chargeback trust.",
    nextAction: "Backfill owner/cost-center tags and enforce tagging checks on new warehouse and task creation."
  },
  {
    id: "telemetry-and-storage",
    lane: "Telemetry and storage lane",
    owner: "Data Platform",
    focus: "Usage exports, retention windows, fail-safe bloat, and optimization evidence",
    status: "yellow",
    note: "Telemetry freshness and storage retention both need cleanup before governance posture can be called healthy.",
    nextAction: "Restore usage exports and shrink stale storage/clones before the next monthly review."
  }
] as const;

export const optimizationPackets = [
  {
    packetId: "SNF-11",
    lane: "Warehouse efficiency recovery",
    owner: "Data Platform",
    status: "red",
    completenessScore: 58,
    decisionNote: "Compute spikes and idle credits are both active, so warehouse posture is not ready for sign-off.",
    blocker: "Suspend policy and right-sizing changes still need to land on the highest-credit warehouses.",
    launchWindowHours: 10
  },
  {
    packetId: "SNF-19",
    lane: "Query hotspot remediation",
    owner: "Analytics Engineering",
    status: "red",
    completenessScore: 63,
    decisionNote: "The executive rollup query still scans too broadly and keeps warehouse pressure elevated.",
    blocker: "Hot query tuning and clustering review have not completed.",
    launchWindowHours: 12
  },
  {
    packetId: "SNF-24",
    lane: "Chargeback cleanup",
    owner: "FinOps Operations",
    status: "yellow",
    completenessScore: 76,
    decisionNote: "Tagging hygiene can clear once the remaining unowned tasks and warehouses are mapped.",
    blocker: "Two cost-center mappings are still missing from the finance mart stack.",
    launchWindowHours: 20
  },
  {
    packetId: "SNF-31",
    lane: "Telemetry and retention repair",
    owner: "Data Platform",
    status: "yellow",
    completenessScore: 71,
    decisionNote: "Telemetry freshness and retention cleanup are recoverable in one governance cycle.",
    blocker: "Usage exports must replay and stale storage objects must be pruned.",
    launchWindowHours: 24
  }
] as const;
