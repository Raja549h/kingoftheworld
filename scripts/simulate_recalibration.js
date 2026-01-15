import fs from 'fs';

// Mock Store State
let state = {
    contracts: [],
    agents: [
        { name: 'John', role: 'Engineering', trustScore: 0.9, history: [] },
        { name: 'Alice', role: 'Product', trustScore: 0.85, history: [] },
        { name: 'Bob', role: 'Design', trustScore: 0.6, history: [] }, // Bob is 0.6 (Safe now, was Risky)
        { name: 'Dave', role: 'Sales', trustScore: 0.4, history: [] }, // Dave is 0.4 (Risky)
    ]
};

// RECALIBRATED ENGINE LOGIC
function predictFailure(contract, agent) {
    if (!agent) return { probability: 0.5, isHighRisk: false };
    let prob = 0;

    // 1. Trust < 0.5 (Lowered from 0.7)
    if (agent.trustScore < 0.5) prob += 0.4;

    // 2. Complexity (Mock length)
    const complexity = (contract.title?.length || 0);

    // 3. Deadline (Only if complex or low trust)
    if (contract.deadline === 'Tomorrow') {
        if (complexity > 20 || agent.trustScore < 0.6) prob += 0.2;
    }

    return { probability: prob, isHighRisk: prob > 0.5 };
}

function log(msg) {
    console.log(`[${new Date().toISOString()}] ${msg}`);
}

log("Starting Recalibration Simulation...");

let totalContracts = 0;
let silentRiskFlags = 0;
let actualFailures = 0;
let falsePositives = 0;
let truePositives = 0;

for (let day = 1; day <= 7; day++) {
    // Create Contracts
    const dailyContracts = 10;
    totalContracts += dailyContracts;

    for (let i = 0; i < dailyContracts; i++) {
        // Random agent
        const agent = state.agents[Math.floor(Math.random() * state.agents.length)];
        const isComplex = Math.random() > 0.7;

        const contract = {
            id: `c-${day}-${i}`,
            owner: agent.name,
            deadline: Math.random() > 0.5 ? 'Tomorrow' : 'Next Week',
            title: isComplex ? 'A very long complex task title that implies difficulty' : 'Simple task',
            status: 'open'
        };

        // Prediction
        const prediction = predictFailure(contract, agent);
        if (prediction.isHighRisk) {
            silentRiskFlags++;
        }

        // Outcome
        // Dave (0.4) fails 40% of time. Bob (0.6) fails 10%. Others 0%.
        const failChance = agent.name === 'Dave' ? 0.4 : (agent.name === 'Bob' ? 0.1 : 0.0);
        const willFail = Math.random() < failChance;

        if (willFail) {
            actualFailures++;
            if (prediction.isHighRisk) truePositives++;
        } else {
            // Success
            if (prediction.isHighRisk) falsePositives++;
        }
    }
}

const precision = silentRiskFlags > 0 ? (truePositives / silentRiskFlags) * 100 : 0;
const recall = actualFailures > 0 ? (truePositives / actualFailures) * 100 : 0;

const report = {
    week: 'Recalibration',
    metrics: {
        totalContracts,
        silentRiskFlags,
        actualFailures,
        truePositives,
        falsePositives,
        precision: precision.toFixed(1) + '%',
        recall: recall.toFixed(1) + '%'
    },
    recommendation: precision > 50 ? 'GO FOR ADVISORY MODE' : 'KEEP CALIBRATING'
};

fs.writeFileSync('recalibration_telemetry.json', JSON.stringify(report, null, 2));
log(`Recalibration Complete. Precision: ${report.metrics.precision}`);
