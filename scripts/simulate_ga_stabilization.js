import fs from 'fs';

// Mock Store State
let state = {
    contracts: [],
    agents: [
        { name: 'John', role: 'Engineering', trustScore: 0.9, history: [] },
        { name: 'Alice', role: 'Product', trustScore: 0.85, history: [] },
        { name: 'Bob', role: 'Design', trustScore: 0.6, history: [] },
        { name: 'Dave', role: 'Sales', trustScore: 0.4, history: [] },
    ]
};

// LOCKED ENGINE (GA)
function predictFailure(contract, agent) {
    if (!agent) return { probability: 0.5, isHighRisk: false, riskLevel: 'MEDIUM' };
    let prob = 0;
    if (agent.trustScore < 0.5) prob += 0.4;
    else if (agent.trustScore < 0.7) prob += 0.2;
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

log("Starting 30-Day GA Stabilization Simulation...");

let totalContracts = 0;
let escalations = 0;
let recoveries = 0;
let overrides = 0;
let blockedOverrides = 0; // Missing justification

for (let day = 1; day <= 30; day++) {
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

        // Simulate Overdue (15% chance - slightly better than pilot)
        if (Math.random() < 0.15) {
            const prediction = predictFailure(contract, agent);

            // GA: Escalate HIGH or MEDIUM
            if (prediction.riskLevel === 'HIGH' || prediction.riskLevel === 'MEDIUM') {
                escalations++;
                contract.status = 'ESCALATED';

                // Recovery: 85% success (Improved due to GA acceptance)
                if (Math.random() < 0.85) {
                    recoveries++;
                    contract.status = 'completed';
                } else {
                    // Override Attempt
                    const hasJustification = Math.random() > 0.2; // 20% forget justification

                    if (hasJustification) {
                        overrides++;
                        contract.status = 'open'; // Manual Reset
                    } else {
                        blockedOverrides++; // System blocked it
                        // User forced to complete it eventually
                        recoveries++;
                        contract.status = 'completed';
                    }
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
    period: '30 Days (GA Stabilization)',
    metrics: {
        totalContracts,
        escalations,
        recoveries,
        overrides,
        blockedOverrides,
        recoveryRate: recoveryRate.toFixed(1) + '%',
        overrideRate: overrideRate.toFixed(1) + '%'
    },
    recommendation: overrideRate < 10 ? 'MAINTAIN CONSTRAINTS' : 'RE-TIGHTEN'
};

fs.writeFileSync('ga_30_day_telemetry.json', JSON.stringify(report, null, 2));
log(`Stabilization Complete. Recovery: ${report.metrics.recoveryRate}, Overrides: ${report.metrics.overrideRate}`);
