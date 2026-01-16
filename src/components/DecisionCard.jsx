export function DecisionCard({ decision, onCreateContract }) {
    return (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-warning)', marginBottom: '1rem' }}>
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Detected Decision • {decision.confidence} Confidence
                </span>
                <button className="text-sm text-muted" style={{ textDecoration: 'underline' }}>
                    Dismiss
                </button>
            </div>

            <p style={{ fontSize: '1.1rem', margin: '1rem 0', fontWeight: 500 }}>
                "{decision.summary}"
            </p>

            <div className="flex gap-4 text-sm text-muted" style={{ marginBottom: '1rem' }}>
                {decision.suggestedOwner && (
                    <span>Suggested Owner: <strong style={{ color: 'var(--text-primary)' }}>{decision.suggestedOwner}</strong></span>
                )}
                {decision.suggestedDeadline && (
                    <span>Suggested Deadline: <strong style={{ color: 'var(--text-primary)' }}>{decision.suggestedDeadline}</strong></span>
                )}
            </div>

            <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => onCreateContract(decision)}
            >
                Create Execution Contract
            </button>
        </div>
    );
}
