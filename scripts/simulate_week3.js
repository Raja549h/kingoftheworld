import fs from 'fs';

// Mock Store State
let state = {
    contracts: [],
    agents: [
        { name: 'John', role: 'Engineering', trustScore: 0.9, history: [] },
        { name: 'Alice', role: 'Product', trustScore: 0.85, history: [] },
        { name: 'Bob', role: 'Design', trustScore: 0.6, history: [] }, // Low Risk
        { name: 'Dave', role: 'Sales', trustScore: 0.4, history: [] }, // High Risk
    ]
};

// RECALIBRATED ENGINE
function predictFailure(contract, agent) {
    if (!agent) return { probability: 0.5, isHighRisk: false };
    let prob = 0;
    if (agent.trustScore < 0.5) prob += 0.4;
    const complexity = (contract.title?.length || 0);
    if (contract.deadline === 'Tomorrow') {
        if (complexity > 20 || agent.trustScore < 0.6) prob += 0.2;
    }
    return { probability: prob, isHighRisk: prob > 0.5 };
}

function log(msg) {
    console.log(`[${new Date().toISOString()}] ${msg}`);
}

log("Starting Week 3: Limited Active Enforcement...");

let totalContracts = 0;
let escalationsTriggered = 0;
let escalationsSuppressed = 0;
let recoveries = 0;
let overrides = 0;

for (let day = 1; day <= 7; day++) {
    const dailyContracts = 50; // High Volume
    totalContracts += dailyContracts;

    for (let i = 0; i < dailyContracts; i++) {
        const agent = state.agents[Math.floor(Math.random() * state.agents.length)];
        const isComplex = Math.random() > 0.7;

        const contract = {
            id: `c-${day}-${i}`,
            owner: agent.name,
            deadline: 'Tomorrow', // Force deadline check
            title: isComplex ? 'A very long complex task title that implies difficulty' : 'Simple task',
            status: 'open'
        };

        // Simulate Overdue (20% chance)
        if (Math.random() < 0.2) {
            // ATTEMPT AUTO-ESCALATION
            const prediction = predictFailure(contract, agent);

            if (prediction.isHighRisk) {
                // High Risk -> ESCALATE
                escalationsTriggered++;
                contract.status = 'ESCALATED';

                // Recovery Simulation: Dave fixes it 80% of time if escalated
                if (Math.random() < 0.8) {
                    recoveries++;
                    contract.status = 'completed';
                } else {
                    // 20% Override/Ignore
                    overrides++;
                }
            } else {
                // Low Risk -> SUPPRESS
                escalationsSuppressed++;
                // Bob fixes it anyway eventually (90% chance)
                if (Math.random() < 0.9) {
                    contract.status = 'completed';
                }
            }
        } else {
            contract.status = 'completed';
        }
    }
}

const recoveryRate = escalationsTriggered > 0 ? (recoveries / escalationsTriggered) * 100 : 0;

const report = {
    week: 3,
    mode: 'ACTIVE (Limited)',
    metrics: {
        totalContracts,
        escalationsTriggered,
        escalationsSuppressed,
        recoveries,
        overrides,
        recoveryRate: recoveryRate.toFixed(1) + '%',
        suppressionRate: ((escalationsSuppressed / (escalationsTriggered + escalationsSuppressed)) * 100).toFixed(1) + '%'
    },
    recommendation: recoveryRate > 70 ? 'EXPAND ENFORCEMENT' : 'CONSTRAIN'
};

fs.writeFileSync('week3_telemetry.json', JSON.stringify(report, null, 2));
log(`Week 3 Complete. Recovery Rate: ${report.metrics.recoveryRate}`);
