import { useExecution } from '../lib/store';

export function AuditLogView() {
    const { state, dispatch } = useExecution();

    const toggleConfig = (key) => {
        dispatch({ type: 'TOGGLE_SYSTEM_CONFIG', payload: { key } });
    };

    return (
        <div className="card" style={{ marginTop: '2rem', borderTop: '4px solid var(--text-muted)' }}>
            <div className="flex justify-between items-center mb-4">
                <h2>Governance & Audit Layer</h2>
                <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted">Tenant: <strong>{state.tenantId}</strong></span>
                    <span className="text-sm text-muted">Role: <strong>{state.currentUser.role}</strong></span>
                    <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: state.pilotMode === 'ADVISORY' ? 'var(--accent-warning)' : 'var(--accent-success)',
                        color: '#000', fontWeight: 'bold', fontSize: '0.8rem'
                    }}>
                        {state.pilotMode} MODE
                    </span>
                </div>
            </div>

            {/* Pilot Controls & Kill-Switches */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="grid grid-cols-3 gap-4">
                    {Object.entries(state.systemConfig).map(([key, value]) => (
                        <button
                            key={key}
                            onClick={() => toggleConfig(key)}
                            className={`btn ${value ? 'btn-danger' : 'btn-secondary'}`}
                            style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                        >
                            {value ? 'DISABLE' : 'ENABLE'} {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Audit Log Table */}
            <div style={{ maxHeight: '400px', overflowY: 'auto', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '0.5rem' }}>Time</th>
                            <th style={{ padding: '0.5rem' }}>Actor</th>
                            <th style={{ padding: '0.5rem' }}>Event</th>
                            <th style={{ padding: '0.5rem' }}>Target</th>
                            <th style={{ padding: '0.5rem' }}>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.auditLog.slice().reverse().map(event => (
                            <tr key={event.id} style={{ borderBottom: '1px solid var(--bg-tertiary)' }}>
                                <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>
                                    {new Date(event.timestamp).toLocaleTimeString()}
                                </td>
                                <td style={{ padding: '0.5rem' }}>
                                    <span style={{
                                        padding: '0.1rem 0.3rem',
                                        borderRadius: '4px',
                                        background: event.actor.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                        color: event.actor.role === 'ADMIN' ? 'var(--accent-danger)' : 'var(--accent-primary)'
                                    }}>
                                        {event.actor.role}
                                    </span>
                                </td>
                                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{event.eventType}</td>
                                <td style={{ padding: '0.5rem' }}>{event.target.type}:{event.target.id.slice(0, 4)}...</td>
                                <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>
                                    {JSON.stringify(event.payload).slice(0, 50)}
                                    {JSON.stringify(event.payload).length > 50 && '...'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
