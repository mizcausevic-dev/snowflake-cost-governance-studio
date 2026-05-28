import { optimizationPosture, queryRisks, summary } from "../src/services/snowflakeCostGovernanceStudioService.js";

console.log("snowflake-cost-governance-studio demo");
console.log(summary());
console.log(
  optimizationPosture().map((packet) => ({
    lane: packet.lane,
    owner: packet.owner,
    status: packet.status
  }))
);
console.log(queryRisks().slice(0, 3));
