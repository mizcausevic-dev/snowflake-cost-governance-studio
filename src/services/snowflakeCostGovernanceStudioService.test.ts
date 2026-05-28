import { describe, expect, test } from "vitest";

import {
  optimizationPosture,
  queryRisks,
  summary,
  verification,
  warehouseLane
} from "./snowflakeCostGovernanceStudioService.js";

describe("snowflakeCostGovernanceStudioService", () => {
  test("summary reflects the sample Snowflake posture", () => {
    expect(summary()).toMatchObject({
      snapshots: 2,
      currentSnapshots: 1,
      drifts: 6,
      warehouseSpikes: 2,
      tagCoverageGaps: 1,
      optimizationEscalations: 6
    });
  });

  test("warehouse lane maps related findings", () => {
    const lanes = warehouseLane();
    expect(lanes).toHaveLength(4);
    expect(lanes.find((lane) => lane.id === "query-governance")?.relatedFindings).toBeGreaterThan(0);
  });

  test("query risks expose hotspot and telemetry findings", () => {
    const findings = queryRisks();
    expect(findings.find((finding) => finding.code === "query-cost-hotspot")).toBeDefined();
    expect(findings.find((finding) => finding.code === "telemetry-gap")).toBeDefined();
  });

  test("optimization posture and verification stay populated", () => {
    expect(optimizationPosture()).toHaveLength(4);
    expect(verification()).toHaveLength(5);
  });
});
