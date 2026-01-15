export function analyzeText(text) {
    const lines = text.split('\n');
    const decisions = [];

    // Expanded Heuristics
    // 1. Explicit: "will", "decided", "agree"
    // 2. Implicit: "John to finish", "Alice to draft"
    const explicitKeywords = ['agree', 'will', 'decided', 'action', 'deadline', 'ensure'];
    const implicitPattern = /^[A-Z][a-z]+ to [a-z]+/; // e.g. "John to test"

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.length < 10) return;

        const lower = trimmed.toLowerCase();
        const hasExplicit = explicitKeywords.some(k => lower.includes(k));
        const hasImplicit = implicitPattern.test(trimmed);
        const isQuestion = trimmed.endsWith('?');

        if ((hasExplicit || hasImplicit) && !isQuestion) {
            decisions.push({
                id: crypto.randomUUID(),
                summary: trimmed,
                rawText: trimmed,
                confidence: hasImplicit ? 'high' : 'medium',
                status: 'detected',
                suggestedOwner: extractOwner(trimmed),
                suggestedDeadline: extractDeadline(trimmed),
            });
        }
    });

    return decisions;
}

function extractOwner(text) {
    const words = text.split(' ');

    // Strategy 1: Check first word (for "John to..." patterns)
    if (/^[A-Z][a-z]+$/.test(words[0]) && words[1] === 'to') {
        return words[0];
    }

    // Strategy 2: Look for capitalized words mid-sentence (excluding start)
    for (let i = 1; i < words.length; i++) {
        // Ignore common non-names if needed, but for now simple capitalization
        if (/^[A-Z][a-z]+$/.test(words[i])) {
            return words[i];
        }
    }
    return null;
}

function extractDeadline(text) {
    const lower = text.toLowerCase();
    if (lower.includes('tomorrow')) return 'Tomorrow';
    if (lower.includes('next week')) return 'Next Week';
    if (lower.includes('friday')) return 'Friday';
    if (lower.includes('monday')) return 'Monday';
    // Simple regex for dates like 12/05
    const dateMatch = text.match(/\d{1,2}\/\d{1,2}/);
    if (dateMatch) return dateMatch[0];
    return null;
}
