import type { DriftOptions, DriftReport, Finding, SnowflakeCostExport, SpendSnapshot } from "./types.js";

function isCurrent(snapshot: SpendSnapshot): boolean {
  return snapshot.baselineStatus === "CURRENT";
}

export function analyze(payload: SnowflakeCostExport, options: DriftOptions = {}): DriftReport {
  const now = options.now ?? new Date().toISOString();
  const staleOptimizationAfterHours = options.staleOptimizationAfterHours ?? 24;
  const snapshots = payload.snapshots ?? [];
  const drifts = payload.drifts ?? [];
  const findingsList: Finding[] = [];

  const currentSnapshots = snapshots.filter(isCurrent).length;
  if (currentSnapshots === 0) {
    findingsList.push({
      code: "no-current-snapshot",
      severity: "high",
      message: "No current Snowflake spend snapshot is available for governance decisions.",
      subject: "snapshot-currentness"
    });
  }

  for (const snapshot of snapshots) {
    if (snapshot.baselineStatus === "STALE") {
      findingsList.push({
        code: "stale-snapshot",
        severity: "medium",
        message: `Spend snapshot for "${snapshot.name}" is stale and should be refreshed before certifying warehouse-cost posture.`,
        subject: snapshot.id,
        subjectName: snapshot.scopePath,
        scope: snapshot.scope
      });
    }
  }

  for (const drift of drifts) {
    const observed = drift.observedState.toLowerCase();
    const expected = drift.expectedState.toLowerCase();
    if (drift.family === "Warehouse" && (observed.includes("spike") || drift.estimatedImpactCredits >= 900)) {
      findingsList.push({
        code: "warehouse-spike",
        severity: "high",
        message: `Warehouse spend spike on "${drift.scopePath}" is already pressuring the monthly Snowflake runway by ${Math.round(drift.estimatedImpactCredits).toLocaleString()} credits.`,
        subject: drift.id,
        subjectName: drift.scopePath,
        scope: drift.scope,
        family: drift.family,
        resourceName: drift.resourceName
      });
    }

    if (drift.family === "Queries" && (observed.includes("scan") || observed.includes("hotspot") || drift.estimatedImpactCredits >= 700)) {
      findingsList.push({
        code: "query-cost-hotspot",
        severity: drift.estimatedImpactCredits >= 1200 ? "high" : "medium",
        message: `Query-cost hotspot is active on "${drift.resourceName}" within "${drift.scopePath}" and should be tuned before warehouse efficiency slips.`,
        subject: drift.id,
        subjectName: drift.scopePath,
        scope: drift.scope,
        family: drift.family,
        resourceName: drift.resourceName
      });
    }

    if (drift.family === "Warehouse" && (observed.includes("idle") || observed.includes("underused"))) {
      findingsList.push({
        code: "idle-compute-surge",
        severity: "medium",
        message: `Idle compute is accumulating on "${drift.scopePath}" and should be rebalanced before warehouse credits leak further.`,
        subject: drift.id,
        subjectName: drift.scopePath,
        scope: drift.scope,
        family: drift.family,
        resourceName: drift.resourceName
      });
    }

    if (drift.family === "Tagging" && (observed.includes("missing") || observed.includes("untagged") || drift.affectsChargeback)) {
      findingsList.push({
        code: "low-tag-coverage",
        severity: "medium",
        message: `Tag coverage drift is active on "${drift.scopePath}" and unattributed Snowflake spend is reducing chargeback trust.`,
        subject: drift.id,
        subjectName: drift.scopePath,
        scope: drift.scope,
        family: drift.family,
        resourceName: drift.resourceName
      });
    }

    if (drift.family === "Storage" && (observed.includes("retention") || observed.includes("stale fail-safe") || drift.estimatedImpactCredits >= 500)) {
      findingsList.push({
        code: "storage-retention-bloat",
        severity: drift.breaksGuardrail ? "high" : "medium",
        message: `Storage-retention bloat is active on "${drift.scopePath}" and should be reviewed before historical-data credits keep compounding.`,
        subject: drift.id,
        subjectName: drift.scopePath,
        scope: drift.scope,
        family: drift.family,
        resourceName: drift.resourceName
      });
    }

    if (drift.family === "Transfer" && (observed.includes("transfer") || observed.includes("replication") || drift.estimatedImpactCredits >= 300)) {
      findingsList.push({
        code: "data-transfer-burst",
        severity: drift.breaksGuardrail ? "high" : "medium",
        message: `Data-transfer or replication spend is bursting on "${drift.scopePath}" and should be contained before cross-region copy costs keep climbing.`,
        subject: drift.id,
        subjectName: drift.scopePath,
        scope: drift.scope,
        family: drift.family,
        resourceName: drift.resourceName
      });
    }

    if (drift.family === "Telemetry" && (observed.includes("missing") || expected.includes("usage export") || expected.includes("telemetry"))) {
      findingsList.push({
        code: "telemetry-gap",
        severity: "high",
        message: `Telemetry coverage is broken on "${drift.scopePath}", which weakens downstream cost governance and optimization trust.`,
        subject: drift.id,
        subjectName: drift.scopePath,
        scope: drift.scope,
        family: drift.family,
        resourceName: drift.resourceName
      });
    }

    if (drift.changeWindowHours > staleOptimizationAfterHours) {
      findingsList.push({
        code: "stale-optimization-window",
        severity: drift.changeWindowHours > staleOptimizationAfterHours * 2 ? "medium" : "low",
        message: `Drift on "${drift.scopePath}" has remained unresolved for ${drift.changeWindowHours} hours.`,
        subject: drift.id,
        subjectName: drift.scopePath,
        scope: drift.scope,
        family: drift.family,
        resourceName: drift.resourceName
      });
    }
  }

  const warehouseSpikes = drifts.filter((drift) => drift.family === "Warehouse").length;
  const tagCoverageGaps = drifts.filter((drift) => drift.family === "Tagging").length;
  const optimizationEscalations = drifts.filter((drift) => drift.breaksGuardrail || drift.status !== "ROUTED").length;
  const ok = !findingsList.some((finding) => finding.severity === "high");

  return {
    generatedAt: now,
    snapshots: snapshots.length,
    currentSnapshots,
    drifts: drifts.length,
    warehouseSpikes,
    tagCoverageGaps,
    optimizationEscalations,
    findingsList,
    ok
  };
}
