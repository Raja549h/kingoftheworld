import fs from 'fs';

// --- CONFIGURATION ---
const DAYS = 60;
const AGENTS = [
    { name: 'Reliable Rex', reliability: 0.95, trustScore: 0.5 },
    { name: 'Average Alice', reliability: 0.80, trustScore: 0.5 },
    { name: 'Chaos Carl', reliability: 0.50, trustScore: 0.5 },
];

// --- LOGIC DUPLICATION (From Store/Failure Engine) ---
function updateTrust(agent, outcome) {
    if (outcome === 'success') {
        return Math.min(1.0, agent.trustScore + 0.05);
    } else {
        return Math.max(0.0, agent.trustScore - 0.10); // Simulated penalty
    }
}

function predictRisk(agent, deadlineType) {
    let probability = 0.0;
    if (agent.trustScore < 0.7) probability += 0.4;
    if (deadlineType === 'tight' && agent.trustScore < 0.9) probability += 0.2;
    return probability;
}

// --- SIMULATION ---
let output = "--- LONGITUDINAL SIMULATION (60 DAYS) ---\n\n";
let stats = {
    totalContracts: 0,
    failures: 0,
    predictions: { truePos: 0, falsePos: 0, trueNeg: 0, falseNeg: 0 }
};

for (let day = 1; day <= DAYS; day++) {
    // output += `Day ${day}:\n`;

    AGENTS.forEach(agent => {
        // 30% chance to get a contract today
        if (Math.random() > 0.7) {
            stats.totalContracts++;
            const isTight = Math.random() > 0.5;
            const riskProb = predictRisk(agent, isTight ? 'tight' : 'normal');
            const predictedHighRisk = riskProb > 0.5;

            // Outcome determined by inherent reliability
            const success = Math.random() < agent.reliability;
            const outcome = success ? 'success' : 'failure';

            // Update Trust
            const oldTrust = agent.trustScore;
            agent.trustScore = updateTrust(agent, outcome);

            // Track Prediction Stats
            if (predictedHighRisk && !success) stats.predictions.truePos++;
            if (predictedHighRisk && success) stats.predictions.falsePos++;
            if (!predictedHighRisk && success) stats.predictions.trueNeg++;
            if (!predictedHighRisk && !success) stats.predictions.falseNeg++;

            if (!success) stats.failures++;

            // Log significant events
            if (!success || day % 10 === 0) {
                // output += `  [${agent.name}] Task ${outcome.toUpperCase()}. Trust: ${oldTrust.toFixed(2)} -> ${agent.trustScore.toFixed(2)}. Predicted Risk: ${(riskProb*100).toFixed(0)}%\n`;
            }
        }
    });
}

output += "\n--- FINAL RESULTS ---\n";
AGENTS.forEach(a => {
    output += `${a.name}: Final Trust Score = ${(a.trustScore * 100).toFixed(0)}% (Inherent: ${(a.reliability * 100).toFixed(0)}%)\n`;
});

output += `\nTotal Contracts: ${stats.totalContracts}\n`;
output += `Total Failures: ${stats.failures}\n`;
output += `Prediction Accuracy:\n`;
output += `  True Positives (Predicted Fail & Failed): ${stats.predictions.truePos}\n`;
output += `  False Positives (Predicted Fail & Succeeded): ${stats.predictions.falsePos}\n`;
output += `  False Negatives (Predicted Success & Failed): ${stats.predictions.falseNeg}\n`;

const precision = stats.predictions.truePos / (stats.predictions.truePos + stats.predictions.falsePos) || 0;
const recall = stats.predictions.truePos / (stats.predictions.truePos + stats.predictions.falseNeg) || 0;

output += `  Precision: ${(precision * 100).toFixed(1)}%\n`;
output += `  Recall: ${(recall * 100).toFixed(1)}%\n`;

fs.writeFileSync('simulation_output.txt', output);
console.log(output);
