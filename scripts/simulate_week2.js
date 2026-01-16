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

// RECALIBRATED ENGINE (From Week 1)
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

log("Starting Week 2: Advisory Interventions...");

let totalContracts = 0;
let nudgesSent = 0;
let nudgesActedOn = 0;
let nudgesIgnored = 0;
let actualFailures = 0;

for (let day = 1; day <= 7; day++) {
    const dailyContracts = 10;
    totalContracts += dailyContracts;

    for (let i = 0; i < dailyContracts; i++) {
        const agent = state.agents[Math.floor(Math.random() * state.agents.length)];
        const isComplex = Math.random() > 0.7;

        const contract = {
            id: `c-${day}-${i}`,
            owner: agent.name,
            deadline: Math.random() > 0.5 ? 'Tomorrow' : 'Next Week',
            title: isComplex ? 'A very long complex task title that implies difficulty' : 'Simple task',
            status: 'open'
        };

        // Prediction & Nudge
        const prediction = predictFailure(contract, agent);
        let nudged = false;

        if (prediction.isHighRisk) {
            nudgesSent++;
            nudged = true;
        }

        // Outcome Simulation
        // Dave (0.4) fails 40%. Bob (0.6) fails 10%.
        let failChance = agent.name === 'Dave' ? 0.4 : (agent.name === 'Bob' ? 0.1 : 0.0);

        // NUDGE EFFECT: If nudged, failChance drops by 50% (User reacts)
        if (nudged) {
            // 10% Fatigue (Ignore nudge)
            if (Math.random() > 0.1) {
                failChance = failChance * 0.5;
                nudgesActedOn++;
            } else {
                nudgesIgnored++;
            }
        }

        const willFail = Math.random() < failChance;

        if (willFail) {
            actualFailures++;
        }
    }
}

const failureRate = (actualFailures / totalContracts) * 100;
const nudgeSuccessRate = (nudgesActedOn / nudgesSent) * 100;

const report = {
    week: 2,
    mode: 'ADVISORY (Nudges Enabled)',
    metrics: {
        totalContracts,
        nudgesSent,
        nudgesActedOn,
        nudgesIgnored,
        actualFailures,
        failureRate: failureRate.toFixed(1) + '%',
        nudgeSuccessRate: nudgeSuccessRate.toFixed(1) + '%',
        alertFatigue: ((nudgesIgnored / nudgesSent) * 100).toFixed(1) + '%'
    },
    recommendation: nudgeSuccessRate > 80 ? 'PROCEED TO WEEK 3 (ACTIVE)' : 'EXTEND ADVISORY'
};

fs.writeFileSync('week2_telemetry.json', JSON.stringify(report, null, 2));
log(`Week 2 Complete. Nudge Success: ${report.metrics.nudgeSuccessRate}`);
