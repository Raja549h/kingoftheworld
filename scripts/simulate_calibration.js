import fs from 'fs';

// --- CONFIGURATION ---
const DAYS = 60;
const AGENTS_TEMPLATE = [
    { name: 'Reliable Rex', reliability: 0.95 },
    { name: 'Average Alice', reliability: 0.80 },
    { name: 'Chaos Carl', reliability: 0.50 },
];

// --- MODELS ---

// 1. BASELINE (Old Logic)
const Baseline = {
    updateTrust: (agent, outcome) => {
        if (outcome === 'success') return Math.min(1.0, agent.trustScore + 0.05);
        return Math.max(0.0, agent.trustScore - 0.10);
    },
    predictRisk: (agent) => {
        return agent.trustScore < 0.7; // Simple threshold
    }
};

// 2. CALIBRATED (New Logic)
const Calibrated = {
    updateTrust: (agent, outcome) => {
        if (outcome === 'success') {
            // Momentum Bonus: If 3 successes in a row AND trust is low
            agent.successStreak = (agent.successStreak || 0) + 1;
            let bonus = 0;
            if (agent.successStreak >= 3 && agent.trustScore < 0.6) bonus = 0.02;

            return Math.min(1.0, agent.trustScore + 0.05 + bonus);
        } else {
            agent.successStreak = 0;
            // Betrayal Penalty: Double penalty if Trust was high
            const penalty = agent.trustScore > 0.9 ? 0.20 : 0.10;
            return Math.max(0.0, agent.trustScore - penalty);
        }
    },
    predictRisk: (agent) => {
        // Dynamic Threshold: Risk if Trust < 0.7 OR recent failure streak
        // For sim simplicity, we'll stick to trust threshold but lower it slightly to reduce false positives,
        // relying on the harsher penalties to drop bad agents faster.
        return agent.trustScore < 0.6;
    }
};

// --- SIMULATION RUNNER ---
function runSimulation(modelName, logic) {
    // Reset Agents
    const agents = AGENTS_TEMPLATE.map(a => ({ ...a, trustScore: 0.5, successStreak: 0 }));

    let stats = {
        failures: 0,
        predictions: { truePos: 0, falsePos: 0, trueNeg: 0, falseNeg: 0 }
    };

    for (let day = 1; day <= DAYS; day++) {
        agents.forEach(agent => {
            if (Math.random() > 0.7) { // 30% chance of task
                const success = Math.random() < agent.reliability;
                const outcome = success ? 'success' : 'failure';

                const predictedHighRisk = logic.predictRisk(agent);

                // Update Trust
                agent.trustScore = logic.updateTrust(agent, outcome);

                // Stats
                if (predictedHighRisk && !success) stats.predictions.truePos++;
                if (predictedHighRisk && success) stats.predictions.falsePos++;
                if (!predictedHighRisk && success) stats.predictions.trueNeg++;
                if (!predictedHighRisk && !success) stats.predictions.falseNeg++;

                if (!success) stats.failures++;
            }
        });
    }
    return { agents, stats };
}

// --- EXECUTE ---
const baselineResults = runSimulation('Baseline', Baseline);
const calibratedResults = runSimulation('Calibrated', Calibrated);

// --- OUTPUT ---
let output = "--- CALIBRATION A/B TEST RESULTS ---\n\n";

function printStats(name, res) {
    const p = res.stats.predictions;
    const precision = p.truePos / (p.truePos + p.falsePos) || 0;
    const recall = p.truePos / (p.truePos + p.falseNeg) || 0;

    output += `[${name} MODEL]\n`;
    output += `  Precision: ${(precision * 100).toFixed(1)}%\n`;
    output += `  Recall: ${(recall * 100).toFixed(1)}%\n`;
    output += `  False Positives: ${p.falsePos}\n`;
    output += `  Final Trust Scores:\n`;
    res.agents.forEach(a => {
        output += `    ${a.name}: ${(a.trustScore * 100).toFixed(0)}%\n`;
    });
    output += "\n";
}

printStats('BASELINE', baselineResults);
printStats('CALIBRATED', calibratedResults);

fs.writeFileSync('calibration_output.txt', output);
console.log(output);
