import { useState, useEffect } from 'react';

const ALLOWED_CODES = ['KING-ALPHA', 'EXECUTE-NOW', 'WORLD-DOMINATION'];
const STORAGE_KEY = 'kotw_access_granted';

export function AccessGate({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const granted = localStorage.getItem(STORAGE_KEY);
        if (granted === 'true') {
            setIsAuthorized(true);
        }
        setLoading(false);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (ALLOWED_CODES.includes(code)) {
            localStorage.setItem(STORAGE_KEY, 'true');
            setIsAuthorized(true);
            setError('');
        } else {
            setError('ACCESS DENIED: Invalid Authorization Code');
            setTimeout(() => setError(''), 3000);
        }
    };

    if (loading) return null; // Prevent flash

    if (isAuthorized) {
        return children;
    }

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div className="card" style={{
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center',
                padding: '3rem',
                border: '1px solid var(--bg-tertiary)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.05em' }}>
                    PRIVATE ACCESS
                </h1>
                <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '0.9rem' }}>
                    Enter your authorization code to access the King of the World system.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="password"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="ENTER ACCESS CODE"
                        style={{
                            textAlign: 'center',
                            letterSpacing: '0.2em',
                            fontSize: '1.2rem',
                            padding: '1rem',
                            background: 'var(--bg-secondary)',
                            border: error ? '1px solid var(--accent-danger)' : '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            borderRadius: '4px',
                            outline: 'none'
                        }}
                        autoFocus
                    />

                    {error && (
                        <div style={{
                            color: 'var(--accent-danger)',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            animation: 'shake 0.5s'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            fontSize: '1rem',
                            letterSpacing: '0.1em'
                        }}
                    >
                        AUTHENTICATE
                    </button>
                </form>

                <div style={{ marginTop: '2rem', fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.5 }}>
                    SECURE GATEWAY v1.0
                </div>
            </div>
        </div>
    );
}
