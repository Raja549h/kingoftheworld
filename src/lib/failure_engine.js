// PARAMETERS LOCKED FOR STEADY-STATE GOVERNANCE - DO NOT MODIFY WITHOUT COMMITTEE APPROVAL
export function predictFailure(contract, agent) {
    if (!agent) return { probability: 0.5, isHighRisk: false, riskLevel: 'MEDIUM' };

    let prob = 0;

    // Factor 1: Trust Score
    // HIGH RISK: < 0.5
    if (agent.trustScore < 0.5) prob += 0.4;
    // MEDIUM RISK: < 0.65 (Re-tightened from 0.7)
    else if (agent.trustScore < 0.65) prob += 0.2;

    // Factor 2: Complexity
    const complexity = (contract.title?.length || 0);

    // Factor 3: Deadline
    if (contract.deadline === 'Tomorrow') {
        if (complexity > 20 || agent.trustScore < 0.6) prob += 0.2;
    }

    // Classification
    let riskLevel = 'LOW';
    if (prob >= 0.5) riskLevel = 'HIGH';
    else if (prob >= 0.2) riskLevel = 'MEDIUM';

    return {
        probability: prob,
        isHighRisk: riskLevel === 'HIGH',
        riskLevel: riskLevel
    };
}
