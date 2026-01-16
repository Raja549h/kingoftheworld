import { useState } from 'react';
import { useExecution } from '../lib/store';
import { analyzeText } from '../lib/analyzer';

export function IngestionPanel() {
    const [text, setText] = useState('');
    const { dispatch } = useExecution();
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = () => {
        setIsAnalyzing(true);
        // Simulate network delay for "AI" feel
        setTimeout(() => {
            const decisions = analyzeText(text);
            dispatch({ type: 'ADD_DECISIONS', payload: decisions });
            setIsAnalyzing(false);
            setText('');
        }, 800);
    };

    return (
        <div className="card">
            <h2 className="text-muted" style={{ marginBottom: '1rem' }}>Input Stream</h2>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste meeting notes, emails, or Slack threads here..."
                style={{ width: '100%', minHeight: '150px', marginBottom: '1rem', fontFamily: 'monospace' }}
            />
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted">
                    {text.length} characters
                </span>
                <button
                    className="btn btn-primary"
                    onClick={handleAnalyze}
                    disabled={!text.trim() || isAnalyzing}
                >
                    {isAnalyzing ? 'Analyzing...' : 'Scan for Decisions'}
                </button>
            </div>
        </div>
    );
}
