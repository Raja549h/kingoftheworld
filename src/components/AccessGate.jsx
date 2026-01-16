import { useState, useEffect } from 'react';
import { loginWithGoogle, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const ALLOWED_CODES = ['KING-ALPHA', 'EXECUTE-NOW', 'WORLD-DOMINATION'];
const STORAGE_KEY = 'kotw_access_granted';

export function AccessGate({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check Firebase Auth State
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            // If user is logged in, check for local storage access code
            if (currentUser) {
                const granted = localStorage.getItem(STORAGE_KEY);
                if (granted === 'true') {
                    setIsAuthorized(true);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleGoogleLogin = async () => {
        try {
            setError('');
            await loginWithGoogle();
            // Auth state listener will handle the rest
        } catch (err) {
            console.error(err);
            setError('Login Failed. Popup closed or error.');
        }
    };

    const handleCodeSubmit = (e) => {
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

    if (loading) return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            color: 'var(--text-muted)'
        }}>
            INITIALIZING SECURE GATEWAY...
        </div>
    );

    // STATE 3: AUTHORIZED -> Show App
    if (user && isAuthorized) {
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
                    {user ? 'EARLY ACCESS' : 'IDENTITY VERIFICATION'}
                </h1>
                <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '0.9rem' }}>
                    {user
                        ? `Welcome, ${user.displayName || user.email}. Enter access code to proceed.`
                        : 'Authenticate identity to access the King of the World system.'}
                </p>

                {error && (
                    <div style={{
                        color: 'var(--accent-danger)',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        marginBottom: '1rem',
                        animation: 'shake 0.5s'
                    }}>
                        {error}
                    </div>
                )}

                {/* STATE 1: NOT LOGGED IN -> SHOW LOGIN OPTIONS */}
                {!user && (
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleGoogleLogin}
                            className="btn"
                            style={{
                                padding: '1rem',
                                background: '#fff',
                                color: '#000',
                                border: '1px solid #ddd',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                fontWeight: '600'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.64 9.2c0-.637-.057-1.252-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" fillRule="evenodd" />
                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" fillRule="evenodd" />
                                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" fillRule="evenodd" />
                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" fillRule="evenodd" />
                            </svg>
                            Sign in with Google
                        </button>
                    </div>
                )}

                {/* STATE 2: LOGGED IN -> SHOW CODE INPUT */}
                {user && (
                    <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
                        <input
                            type="password"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="ENTER SECRET CODE"
                            style={{
                                textAlign: 'center',
                                letterSpacing: '0.2em',
                                fontSize: '1.2rem',
                                padding: '1rem',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                borderRadius: '4px',
                                outline: 'none'
                            }}
                            autoFocus
                        />
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
                            VERIFY & ENTER
                        </button>
                        <button
                            type="button"
                            onClick={() => auth.signOut()}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                marginTop: '1rem'
                            }}
                        >
                            Change Account
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '2rem', fontSize: '0.6rem', color: 'var(--text-muted)', opacity: 0.5, letterSpacing: '0.1em' }}>
                    SECURE GATEWAY v2.0 <br /> IDENTITY VERIFICATION REQUIRED
                </div>
            </div>
        </div>
    );
}
