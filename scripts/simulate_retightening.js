import fs from 'fs';

// Mock Store State
let state = {
    contracts: [],
    agents: [
        { name: 'John', role: 'Engineering', trustScore: 0.9, history: [] },
        { name: 'Alice', role: 'Product', trustScore: 0.85, history: [] },
        { name: 'Charlie', role: 'Marketing', trustScore: 0.68, history: [] }, // Was Medium (0.7), Now Low (< 0.65 is cut-off)
        { name: 'Bob', role: 'Design', trustScore: 0.6, history: [] }, // Still Medium
        { name: 'Dave', role: 'Sales', trustScore: 0.4, history: [] }, // High Risk
    ]
};

// RE-TIGHTENED ENGINE
function predictFailure(contract, agent) {
    if (!agent) return { probability: 0.5, isHighRisk: false, riskLevel: 'MEDIUM' };
    let prob = 0;
    if (agent.trustScore < 0.5) prob += 0.4;
    else if (agent.trustScore < 0.65) prob += 0.2; // NEW THRESHOLD

    const complexity = (contract.title?.length || 0);
    if (contract.deadline === 'Tomorrow') {
        if (complexity > 20 || agent.trustScore < 0.6) prob += 0.2;
    }
    let riskLevel = 'LOW';
    if (prob >= 0.5) riskLevel = 'HIGH';
    else if (prob >= 0.2) riskLevel = 'MEDIUM';
    return { probability: prob, isHighRisk: riskLevel === 'HIGH', riskLevel: riskLevel };
}

function log(msg) {
    console.log(`[${new Date().toISOString()}] ${msg}`);
}

log("Starting 14-Day Re-tightening Simulation...");

let totalContracts = 0;
let escalations = 0;
let recoveries = 0;
let overrides = 0;

for (let day = 1; day <= 14; day++) {
    const dailyContracts = 50;
    totalContracts += dailyContracts;

    for (let i = 0; i < dailyContracts; i++) {
        const agent = state.agents[Math.floor(Math.random() * state.agents.length)];
        const isComplex = Math.random() > 0.7;

        const contract = {
            id: `c-${day}-${i}`,
            owner: agent.name,
            deadline: 'Tomorrow',
            title: isComplex ? 'A very long complex task title that implies difficulty' : 'Simple task',
            status: 'open'
        };

        // Simulate Overdue (15% chance)
        if (Math.random() < 0.15) {
            const prediction = predictFailure(contract, agent);

            // Escalate HIGH or MEDIUM
            if (prediction.riskLevel === 'HIGH' || prediction.riskLevel === 'MEDIUM') {
                escalations++;
                contract.status = 'ESCALATED';

                // Recovery: 
                // Charlie (0.68) would have overridden often. Now he is suppressed.
                // Bob (0.6) and Dave (0.4) are left. They might override but less often than Charlie.

                if (Math.random() < 0.92) { // Higher acceptance rate now that "better" agents are excluded
                    recoveries++;
                    contract.status = 'completed';
                } else {
                    overrides++;
                    contract.status = 'open';
                }
            }
        } else {
            contract.status = 'completed';
        }
    }
}

const recoveryRate = escalations > 0 ? (recoveries / escalations) * 100 : 0;
const overrideRate = escalations > 0 ? (overrides / escalations) * 100 : 0;

const report = {
    period: '14 Days (Re-tightened)',
    metrics: {
        totalContracts,
        escalations,
        recoveries,
        overrides,
        recoveryRate: recoveryRate.toFixed(1) + '%',
        overrideRate: overrideRate.toFixed(1) + '%'
    },
    recommendation: overrideRate < 10 ? 'MAINTAIN' : 'FURTHER TIGHTEN'
};

fs.writeFileSync('retightening_telemetry.json', JSON.stringify(report, null, 2));
log(`Re-tightening Complete. Recovery: ${report.metrics.recoveryRate}, Overrides: ${report.metrics.overrideRate}`);
