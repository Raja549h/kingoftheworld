import fs from 'fs';

// Mock Store State
let state = {
    contracts: [],
    agents: [
        { name: 'John', role: 'Engineering', trustScore: 0.9, history: [] },
        { name: 'Alice', role: 'Product', trustScore: 0.85, history: [] }, // Low Risk
        { name: 'Bob', role: 'Design', trustScore: 0.6, history: [] }, // Medium Risk
        { name: 'Dave', role: 'Sales', trustScore: 0.4, history: [] }, // High Risk
    ]
};

// EXPANDED ENGINE
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

log("Starting Week 4: Expanded Enforcement...");

let totalContracts = 0;
let escalationsTriggered = 0;
let escalationsSuppressed = 0;
let recoveries = 0;
let overrides = 0;

// Breakdown
let highRiskEscalations = 0;
let mediumRiskEscalations = 0;

for (let day = 1; day <= 7; day++) {
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

        // Simulate Overdue (20% chance)
        if (Math.random() < 0.2) {
            const prediction = predictFailure(contract, agent);

            // Week 4: Escalate HIGH or MEDIUM
            if (prediction.riskLevel === 'HIGH' || prediction.riskLevel === 'MEDIUM') {
                escalationsTriggered++;
                contract.status = 'ESCALATED';

                if (prediction.riskLevel === 'HIGH') highRiskEscalations++;
                if (prediction.riskLevel === 'MEDIUM') mediumRiskEscalations++;

                // Recovery: 
                // Dave (High Risk) fixes 80% of time.
                // Bob (Medium Risk) fixes 90% of time (better agent).
                const recoveryChance = prediction.riskLevel === 'HIGH' ? 0.8 : 0.9;

                if (Math.random() < recoveryChance) {
                    recoveries++;
                    contract.status = 'completed';
                } else {
                    overrides++;
                }
            } else {
                // Low Risk -> SUPPRESS
                escalationsSuppressed++;
                if (Math.random() < 0.95) contract.status = 'completed';
            }
        } else {
            contract.status = 'completed';
        }
    }
}

const recoveryRate = escalationsTriggered > 0 ? (recoveries / escalationsTriggered) * 100 : 0;

const report = {
    week: 4,
    mode: 'ACTIVE (Expanded)',
    metrics: {
        totalContracts,
        escalationsTriggered,
        highRiskEscalations,
        mediumRiskEscalations,
        escalationsSuppressed,
        recoveries,
        overrides,
        recoveryRate: recoveryRate.toFixed(1) + '%',
        suppressionRate: ((escalationsSuppressed / (escalationsTriggered + escalationsSuppressed)) * 100).toFixed(1) + '%'
    },
    recommendation: recoveryRate > 80 ? 'GENERAL AVAILABILITY' : 'CONSTRAINED ROLLOUT'
};

fs.writeFileSync('week4_telemetry.json', JSON.stringify(report, null, 2));
log(`Week 4 Complete. Recovery Rate: ${report.metrics.recoveryRate}`);
