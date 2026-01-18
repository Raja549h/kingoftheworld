import React, { useState, useEffect } from 'react';
import { loginWithGoogle, auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const ALLOWED_CODES = ['KING-ALPHA', 'EXECUTE-NOW', 'WORLD-DOMINATION'];
const STORAGE_KEY = 'kotw_access_granted';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>
                    <h1>Something went wrong.</h1>
                    <pre>{this.state.error.toString()}</pre>
                    <button onClick={() => window.location.reload()} style={{ padding: '1rem', marginTop: '1rem' }}>Reload Page</button>
                </div>
            );
        }
        return this.props.children;
    }
}

function AccessGateInner({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [code, setCode] = useState('');
    const [designation, setDesignation] = useState('');
    const [company, setCompany] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('loading');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("Auth State Changed:", currentUser?.email);
            setLoading(true);

            if (currentUser) {
                setUser(currentUser);
                try {
                    // Check if profile exists in Firestore
                    const docRef = doc(db, "users", currentUser.uid);
                    let docSnap = null;

                    try {
                        docSnap = await getDoc(docRef);
                    } catch (fsError) {
                        console.error("Firestore Read Error:", fsError);
                        // If Firestore fails (e.g. permissions), we can handle it
                        // For now, treat as no profile, or show specific error if critical
                        setError('Notice: Could not load profile (Firestore Check Failed). ' + fsError.message);
                        // Fallback: Just ask for code if we can't read profile
                        setView('code');
                        setLoading(false);
                        return; // Stop here
                    }

                    if (docSnap && docSnap.exists()) {
                        setProfile(docSnap.data());
                        const granted = localStorage.getItem(STORAGE_KEY);
                        if (granted === 'true') {
                            setIsAuthorized(true);
                            setView('authorized');
                        } else {
                            setView('code');
                        }
                    } else {
                        // No profile found (or new user)
                        setView('profile');
                    }
                } catch (err) {
                    console.error("Access Logic Error:", err);
                    setError("Critical Login Logic Error: " + err.message);
                    setView('login'); // Fallback to login
                }
            } else {
                setUser(null);
                setProfile(null);
                setView('login');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleGoogleLogin = async () => {
        try {
            setError('');
            await loginWithGoogle();
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Login cancelled.');
            } else if (err.code === 'auth/unauthorized-domain') {
                setError('DOMAIN ERROR: Add this domain to Firebase Auth > Settings > Authorized Domains.');
            } else {
                setError(`Login Error: ${err.message}`);
            }
        }
    };

    // DEBUG: Get current config
    const currentConfig = auth.app.options;

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const userData = {
                uid: user.uid,
                email: user.email,
                name: user.displayName || 'Unknown',
                designation,
                company,
                timestamp: new Date().toISOString()
            };

            await setDoc(doc(db, "users", user.uid), userData);
            setProfile(userData);
            setView('code');
        } catch (err) {
            console.error(err);
            setError('Failed to save profile: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        if (ALLOWED_CODES.includes(code)) {
            localStorage.setItem(STORAGE_KEY, 'true');
            setIsAuthorized(true);
            setView('authorized');
            setError('');
        } else if (code === 'EXPORT-DATA-99') {
            await exportRegistry();
        } else {
            setError('ACCESS DENIED: Invalid Authorization Code');
            setTimeout(() => setError(''), 3000);
        }
    };

    const exportRegistry = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const data = [];
            let serialNo = 1;

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                data.push({
                    'S.No': serialNo++,
                    'Name': userData.name || 'N/A',
                    'Email': userData.email || 'N/A'
                });
            });

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Users");
            XLSX.writeFile(wb, "KingOfTheWorld_Users.xlsx");
            setError('Registry Downloaded!');
        } catch (err) {
            setError('Export Failed: ' + err.message);
        }
    }

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
                <div>CONNECTING...</div>
                <div style={{ fontSize: '0.7em', marginTop: '1rem', color: '#666' }}>
                    ID: {currentConfig.projectId}<br />
                    Auth: {currentConfig.authDomain}
                </div>
            </div>
        </div>
    );

    if (view === 'authorized') return children;

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
                maxWidth: '450px',
                width: '100%',
                textAlign: 'center',
                padding: '3rem',
                border: '1px solid var(--bg-tertiary)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.05em' }}>
                    {view === 'login' ? 'IDENTITY GATE' :
                        view === 'profile' ? 'REGISTRY ENTRY' :
                            'ACCESS CODE'}
                </h1>

                {error && (
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', fontSize: '0.8rem', marginBottom: '1rem', borderRadius: '4px', wordBreak: 'break-word', textAlign: 'left' }}>
                        <strong>ERROR:</strong> {error}
                        <br /><br />
                        <strong>DEBUG INFO:</strong><br />
                        Auth Domain: <code>{currentConfig.authDomain}</code>
                    </div>
                )}

                {view === 'login' && (
                    <div>
                        <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '0.9rem' }}>
                            Authenticate to access the system.
                        </p>
                        <button
                            onClick={handleGoogleLogin}
                            className="btn"
                            style={{
                                padding: '1rem', width: '100%', background: '#fff', color: '#000',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '600'
                            }}
                        >
                            Sign in with Google
                        </button>
                    </div>
                )}

                {view === 'profile' && (
                    <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
                        <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Complete your registration for the official records.
                        </p>
                        <input type="text" placeholder="Your Job Designation" value={designation} onChange={e => setDesignation(e.target.value)} required
                            style={{ padding: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'white' }} />
                        <input type="text" placeholder="Company Name" value={company} onChange={e => setCompany(e.target.value)} required
                            style={{ padding: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'white' }} />
                        <button type="submit" className="btn btn-primary" style={{ padding: '1rem' }}>SAVE RECORD</button>
                    </form>
                )}

                {view === 'code' && (
                    <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
                        <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Welcome, {profile?.name || user?.displayName || 'Agent'}. Enter access code.
                        </p>
                        <input type="password" placeholder="SECRET CODE" value={code} onChange={e => setCode(e.target.value)} autoFocus
                            style={{ padding: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'white', textAlign: 'center', letterSpacing: '0.2em' }} />
                        <button type="submit" className="btn btn-primary" style={{ padding: '1rem' }}>VERIFY</button>

                        <button type="button" onClick={() => auth.signOut()} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '1rem' }}>
                            Switch Account
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export function AccessGate({ children }) {
    return (
        <ErrorBoundary>
            <AccessGateInner>{children}</AccessGateInner>
        </ErrorBoundary>
    );
}
