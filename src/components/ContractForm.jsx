import { useState } from 'react';

export function ContractForm({ decision, onCancel, onSubmit }) {
    const [owner, setOwner] = useState(decision.suggestedOwner || '');
    const [deadline, setDeadline] = useState(decision.suggestedDeadline || '');
    const [proof, setProof] = useState('');
    const [risk, setRisk] = useState('Medium');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            decisionId: decision.id,
            title: decision.summary,
            owner,
            deadline,
            proofRequirement: proof,
            riskLevel: risk,
        });
    };

    return (
        <div className="card" style={{ border: '1px solid var(--accent-primary)' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create Execution Contract</h2>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                <span className="text-sm text-muted">DECISION</span>
                <p style={{ marginTop: '0.5rem' }}>{decision.summary}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="text-sm text-muted">Responsible Owner</label>
                    <input
                        type="text"
                        required
                        value={owner}
                        onChange={e => setOwner(e.target.value)}
                        placeholder="e.g. John Doe, Engineering Lead"
                        style={{ width: '100%', marginTop: '0.5rem' }}
                    />
                </div>

                <div className="flex gap-4">
                    <div style={{ flex: 1 }}>
                        <label className="text-sm text-muted">Deadline</label>
                        <input
                            type="text"
                            required
                            value={deadline}
                            onChange={e => setDeadline(e.target.value)}
                            placeholder="e.g. Friday 5pm"
                            style={{ width: '100%', marginTop: '0.5rem' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className="text-sm text-muted">Risk Level</label>
                        <select
                            value={risk}
                            onChange={e => setRisk(e.target.value)}
                            style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}
                        >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Critical</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-sm text-muted">Proof of Execution (Required)</label>
                    <textarea
                        required
                        value={proof}
                        onChange={e => setProof(e.target.value)}
                        placeholder="What objective evidence proves this is done? (e.g. URL, Screenshot, Doc)"
                        style={{ width: '100%', marginTop: '0.5rem', minHeight: '80px' }}
                    />
                </div>

                <div className="flex gap-4 mt-4">
                    <button type="button" className="btn" onClick={onCancel} style={{ flex: 1, border: '1px solid var(--border-subtle)' }}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                        Sign & Execute
                    </button>
                </div>
            </form>
        </div>
    );
}
