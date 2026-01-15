import { predictFailure } from '../src/lib/failure_engine.js';

// Mock Agents
const agents = [
    { name: 'John', role: 'Engineering', trustScore: 0.9 },
    { name: 'Bob', role: 'Design', trustScore: 0.6 }, // Risky
];

// Mock Contracts
const contracts = [
    {
        id: 'c1',
        title: 'Simple Task',
        owner: 'John',
        deadline: 'Next Week',
        proofRequirement: 'Link'
    },
    {
        id: 'c2',
        title: 'Complex Critical Task',
        owner: 'Bob',
        deadline: 'Tomorrow', // Tight deadline
        proofRequirement: 'Detailed Report with 5 attachments' // High complexity
    }
];

console.log("--- STARTING ENGINE VERIFICATION ---\n");

contracts.forEach(contract => {
    const agent = agents.find(a => a.name === contract.owner);
    console.log(`Analyzing Contract: "${contract.title}"`);
    console.log(`  Owner: ${agent.name} (Trust: ${agent.trustScore})`);
    console.log(`  Deadline: ${contract.deadline}`);

    const prediction = predictFailure(contract, agent);

    console.log(`  Prediction: ${(prediction.probability * 100).toFixed(0)}% Failure Probability`);
    if (prediction.isHighRisk) {
        console.log(`  ⚠️ HIGH RISK DETECTED`);
    }
    prediction.reasons.forEach(r => console.log(`     - ${r}`));
    console.log("-".repeat(20));
});

console.log("\n--- VERIFICATION COMPLETE ---");
