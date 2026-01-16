import fs from 'fs';

// Mock Store State
let state = {
    tenantId: 'pilot-tenant-001',
    pilotMode: 'ADVISORY',
    decisions: [],
    contracts: [],
    agents: [
        { name: 'John', role: 'Engineering', trustScore: 0.9, history: [] },
        { name: 'Alice', role: 'Product', trustScore: 0.85, history: [] },
        { name: 'Bob', role: 'Design', trustScore: 0.6, history: [] },
    ],
    auditLog: [],
    metrics: {
        executionLift: 0,
        alertFatigue: 0,
        overrideFreq: 0,
        trustDrift: 0,
    }
};

// Mock Failure Engine
function predictFailure(contract, agent) {
    if (!agent) return { probability: 0.5, isHighRisk: false };
    let prob = 0;
    if (agent.trustScore < 0.7) prob += 0.4;
    if (contract.deadline && contract.deadline.includes('Tomorrow')) prob += 0.2;
    return { probability: prob, isHighRisk: prob > 0.5 };
}

// Simulation Log
const simLog = [];

function log(msg) {
    simLog.push(`[${new Date().toISOString()}] ${msg}`);
    console.log(msg);
}

// Run 7 Days
log("Starting Week 1: Silent Running Simulation...");

let totalDecisions = 0;
let totalContracts = 0;
let totalCompleted = 0;
let silentRiskFlags = 0;
let actualFailures = 0;
let falsePositives = 0;

for (let day = 1; day <= 7; day++) {
    log(`--- Day ${day} ---`);

    // 1. Ingest Decisions
    const dailyDecisions = Math.floor(Math.random() * 5) + 5; // 5-10 decisions
    totalDecisions += dailyDecisions;
    log(`Ingested ${dailyDecisions} decisions.`);

    // 2. Create Contracts (80% conversion)
    const dailyContracts = Math.floor(dailyDecisions * 0.8);
    totalContracts += dailyContracts;

    for (let i = 0; i < dailyContracts; i++) {
        const owner = ['John', 'Alice', 'Bob'][Math.floor(Math.random() * 3)];
        const contract = {
            id: `c-${day}-${i}`,
            owner,
            deadline: day % 2 === 0 ? 'Tomorrow' : 'Next Week',
            status: 'open'
        };
        state.contracts.push(contract);

        // Silent Prediction
        const agent = state.agents.find(a => a.name === owner);
        const prediction = predictFailure(contract, agent);
        if (prediction.isHighRisk) {
            silentRiskFlags++;
            // In Advisory Mode, this flag is NOT shown to user
        }
    }

    // 3. Simulate Completions & Failures
    state.contracts.forEach(c => {
        if (c.status === 'open') {
            const agent = state.agents.find(a => a.name === c.owner);
            const roll = Math.random();

            // High trust agents complete faster
            const successThreshold = agent.trustScore;

            if (roll < successThreshold) {
                c.status = 'completed';
                totalCompleted++;
                // Check if it was flagged high risk (False Positive check)
                const pred = predictFailure(c, agent);
                if (pred.isHighRisk) falsePositives++;
            } else {
                // Failure / Delay
                if (c.deadline === 'Tomorrow') {
                    actualFailures++; // "Overdue"
                }
            }
        }
    });
}

// Calculate Metrics
const conversionRate = (totalContracts / totalDecisions) * 100;
const failureRate = (actualFailures / totalContracts) * 100;
const precision = ((silentRiskFlags - falsePositives) / silentRiskFlags) * 100;

const report = {
    week: 1,
    mode: 'ADVISORY (Silent)',
    metrics: {
        totalDecisions,
        totalContracts,
        conversionRate: conversionRate.toFixed(1) + '%',
        totalCompleted,
        silentRiskFlags,
        actualFailures,
        falsePositives,
        predictionPrecision: isNaN(precision) ? '0%' : precision.toFixed(1) + '%',
        alertFatigue: '0% (Suppressed)',
        userOverrides: '0 (Suppressed)',
    },
    recommendation: precision > 50 ? 'PROCEED TO WEEK 2' : 'RECALIBRATE'
};

fs.writeFileSync('week1_telemetry.json', JSON.stringify(report, null, 2));
log("Week 1 Simulation Complete. Report generated.");
