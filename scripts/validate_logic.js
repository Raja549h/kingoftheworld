import { analyzeText } from '../src/lib/analyzer.js';
import fs from 'fs';

const scenarios = [
    {
        name: "Scenario A: Clear Commitment",
        input: "John to finalize the budget by Friday.",
        expected: { count: 1, owner: "John", deadline: "Friday" }
    },
    {
        name: "Scenario B: Vague Discussion",
        input: "We should probably look into the server issues soon.",
        expected: { count: 0 }
    },
    {
        name: "Scenario C: Meeting Notes Dump",
        input: `Attendees: Alice, Bob.
Discussed Q3 goals.
Alice will draft the marketing plan by next week.
Bob agreed to review the code.
Is the API ready?`,
        expected: { count: 2, owners: ["Alice", "Bob"] }
    },
    {
        name: "Scenario D: Ambiguous 'We'",
        input: "We need to fix this.",
        expected: { count: 0 }
    }
];

let output = "--- STARTING LOGIC VALIDATION ---\\n\\n";

scenarios.forEach(scenario => {
    output += `Running: ${scenario.name}\\n`;
    output += `Input: "${scenario.input.replace(/\n/g, '\\n')}"\\n`;

    const results = analyzeText(scenario.input);
    output += `Detected: ${results.length} decisions\\n`;

    results.forEach((r, i) => {
        output += `  [${i + 1}] Summary: "${r.summary}"\\n`;
        output += `       Owner: ${r.suggestedOwner}\\n`;
        output += `       Deadline: ${r.suggestedDeadline}\\n`;
    });

    if (results.length !== scenario.expected.count) {
        output += `❌ FAILED: Expected ${scenario.expected.count}, got ${results.length}\\n`;
    } else {
        output += `✅ COUNT MATCH\\n`;
    }
    output += "-".repeat(20) + "\\n";
});

output += "\\n--- VALIDATION COMPLETE ---";
fs.writeFileSync('validation_output.txt', output);
console.log("Output written to validation_output.txt");
