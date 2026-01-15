import { useState } from 'react';
import { useExecution } from '../lib/store';
import { predictFailure } from '../lib/failure_engine';

export function ExecutionFeed() {
    const { state, dispatch } = useExecution();
    const [proofInput, setProofInput] = useState({});

    const handleProofSubmit = (id) => {
        if (!proofInput[id]) return;
        dispatch({ type: 'ADD_PROOF', payload: { id, proof: proofInput[id] } });
        setProofInput(prev => ({ ...prev, [id]: '' }));
    };

    const isOverdue = (deadline) => {
        if (!deadline) return false;
        const lower = deadline.toLowerCase();
        // Mock logic: if deadline is "Yesterday" or contains "past", it's overdue
        // In real app, parse date. For demo, we'll assume "Friday" is future unless specified
        return lower.includes('yesterday') || lower.includes('last');
    };

    if (state.contracts.length === 0) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', borderStyle: 'dashed' }}>
                <p className="text-muted">No active execution contracts.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {state.contracts.map(contract => {
                const overdue = isOverdue(contract.deadline);
                const escalated = contract.status !== 'completed' && overdue;

                // Find Agent and Calculate Risk
                const agent = state.agents.find(a => a.name === contract.owner);
                const prediction = contract.status === 'open' ? predictFailure(contract, agent) : null;

                return (
                    <div key={contract.id} className="card" style={{
                        borderLeft: contract.status === 'completed'
                            ? '4px solid var(--accent-success)'
                            : escalated
                                ? '4px solid var(--accent-danger)'
                                : '4px solid var(--accent-warning)',
                        background: escalated ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-secondary)'
                    }}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{contract.title}</h3>
                                <div className="flex gap-4 text-sm text-muted">
                                    <span>Owner: <strong style={{ color: 'var(--text-primary)' }}>{contract.owner}</strong></span>
                                    {agent && (
                                        <span title="Execution Trust Score">
                                            Trust: <strong style={{ color: agent.trustScore < 0.7 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                                                {(agent.trustScore * 100).toFixed(0)}%
                                            </strong>
                                        </span>
                                    )}
                                    <span>Due: <strong style={{ color: escalated ? 'var(--accent-danger)' : 'var(--text-primary)' }}>{contract.deadline}</strong></span>
                                </div>
                            </div>
                            <div className={`text-sm font-bold`}
                                style={{ color: contract.status === 'completed' ? 'var(--accent-success)' : escalated ? 'var(--accent-danger)' : 'var(--accent-warning)' }}>
                                {contract.status === 'completed' ? 'COMPLETED' : escalated ? 'ESCALATED' : 'OPEN'}
                            </div>
                        </div>

                        {/* Predictive Risk Warning - NUDGE (Week 2) */}
                        {state.systemConfig.enableNudges && prediction && prediction.isHighRisk && (
                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--accent-warning)', borderRadius: 'var(--radius-sm)' }}>
                                <strong style={{ color: 'var(--accent-warning)', fontSize: '0.8rem' }}>⚠️ PREDICTED FAILURE RISK: {(prediction.probability * 100).toFixed(0)}%</strong>
                                <ul style={{ margin: '0.25rem 0 0 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {prediction.reasons.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                        )}

                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                            <span className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>REQUIRED PROOF</span>
                            <p className="text-sm">{contract.proofRequirement}</p>
                        </div>

                        {contract.status !== 'completed' ? (
                            <div style={{ marginTop: '1rem' }} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Paste proof URL or evidence..."
                                    value={proofInput[contract.id] || ''}
                                    onChange={e => setProofInput(prev => ({ ...prev, [contract.id]: e.target.value }))}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleProofSubmit(contract.id)}
                                    disabled={!proofInput[contract.id]}
                                >
                                    Verify
                                </button>
                            </div>
                        ) : (
                            <div style={{ marginTop: '1rem' }} className="text-sm">
                                <span className="text-muted">Verified Proof: </span>
                                <a href="#" style={{ color: 'var(--accent-success)' }}>{contract.proof}</a>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
