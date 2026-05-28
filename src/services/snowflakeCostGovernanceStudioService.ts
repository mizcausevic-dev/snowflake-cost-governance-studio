// SPDX-License-Identifier: AGPL-3.0-or-later

import { analyze } from "../analyze.js";
import { optimizationPackets, sampleSnowflakeCostPayload, warehouseLanePackets } from "../data/sampleSnowflakeCost.js";
import type { Finding } from "../types.js";

const NOW = "2026-05-30T00:00:00Z";
const report = analyze(sampleSnowflakeCostPayload, {
  now: NOW,
  staleOptimizationAfterHours: 24
});

function severityRank(finding: Finding): number {
  return finding.severity === "high"
    ? 0
    : finding.severity === "medium"
      ? 1
      : finding.severity === "low"
        ? 2
        : 3;
}

export function summary() {
  return {
    snapshots: report.snapshots,
    currentSnapshots: report.currentSnapshots,
    drifts: report.drifts,
    warehouseSpikes: report.warehouseSpikes,
    tagCoverageGaps: report.tagCoverageGaps,
    optimizationEscalations: report.optimizationEscalations,
    highFindings: report.findingsList.filter((finding) => finding.severity === "high").length,
    recommendation:
      "Contain the warehouse spike, trim idle compute, tune the hotspot query, restore telemetry, and backfill tagging before calling Snowflake cost posture healthy."
  };
}

export function warehouseLane() {
  return warehouseLanePackets.map((lane) => ({
    ...lane,
    relatedFindings: report.findingsList.filter((finding) => {
      if (lane.id === "warehouse-efficiency") {
        return finding.code === "warehouse-spike" || finding.code === "idle-compute-surge";
      }
      if (lane.id === "query-governance") {
        return finding.code === "query-cost-hotspot";
      }
      if (lane.id === "chargeback-hygiene") {
        return finding.code === "low-tag-coverage";
      }
      if (lane.id === "telemetry-and-storage") {
        return finding.code === "storage-retention-bloat" || finding.code === "telemetry-gap" || finding.code === "stale-snapshot" || finding.code === "stale-optimization-window";
      }
      return false;
    }).length
  }));
}

export function queryRisks() {
  return [...report.findingsList]
    .sort((left, right) => severityRank(left) - severityRank(right))
    .map((finding) => ({
      ...finding,
      owner:
        finding.code === "warehouse-spike" || finding.code === "idle-compute-surge"
          ? "Data Platform"
          : finding.code === "query-cost-hotspot"
            ? "Analytics Engineering"
            : finding.code === "low-tag-coverage"
              ? "FinOps Operations"
              : "Data Platform"
    }));
}

export function optimizationPosture() {
  return optimizationPackets;
}

export function verification() {
  return [
    "The dashboard is backed by a real offline analyzer and CLI, not static copy alone.",
    "Warehouse snapshots and cost-drift packets are synthetic sample data only; no live Snowflake credentials, queries, or account secrets are published.",
    "The control plane keeps warehouse, query, tagging, storage, and telemetry drift visible for FinOps and data-platform stakeholders.",
    "This surface demonstrates Snowflake cost governance operations, not a generic cloud-cost keyword page.",
    "It complements Azure, Entra, AWS, GCP, and reporting proof with a concrete data-platform FinOps lane."
  ];
}

export function payload() {
  return {
    summary: summary(),
    warehouseLane: warehouseLane(),
    queryRisks: queryRisks(),
    optimizationPosture: optimizationPosture(),
    verification: verification(),
    sample: sampleSnowflakeCostPayload
  };
}
