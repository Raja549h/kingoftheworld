export function analyzeText(text) {
    // Pre-processing: Split by newlines and then by sentences to get granular segments
    const rawLines = text.split('\n');
    const segments = [];

    rawLines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Check if it's explicitly a list item (starts with -, *, •, or 1.)
        const isBullet = /^(\d+\.|[\-\*\•])\s/.test(trimmed);

        if (isBullet) {
            // If it's a bullet, treat the whole line as one distinct point
            // Remove the bullet marker for cleaner summary
            segments.push(trimmed.replace(/^(\d+\.|[\-\*\•])\s/, ''));
        } else {
            // If it's a paragraph, split into sentences
            // Split by punctuation (.?!) followed by whitespace, but keep the punctuation logic simpler for now
            // Using a lookbehind equivalent or simple split
            const sentences = trimmed.match(/[^.?!]+[.?!]+|[^.?!]+$/g);
            if (sentences) {
                sentences.forEach(s => segments.push(s.trim()));
            } else {
                segments.push(trimmed);
            }
        }
    });

    const decisions = [];

    // Expanded Heuristics
    // 1. Explicit: "will", "decided", "agree"
    // 2. Implicit: "John to finish", "Alice to draft"
    const explicitKeywords = ['agree', 'will', 'decided', 'action', 'deadline', 'ensure', 'tasked', 'responsible'];
    const implicitPattern = /^[A-Z][a-z]+ to [a-z]+/; // e.g. "John to test"

    segments.forEach(segment => {
        if (segment.length < 10) return;

        const lower = segment.toLowerCase();
        const hasExplicit = explicitKeywords.some(k => lower.includes(k));
        const hasImplicit = implicitPattern.test(segment);
        const isQuestion = segment.endsWith('?');

        if ((hasExplicit || hasImplicit) && !isQuestion) {
            decisions.push({
                id: crypto.randomUUID(),
                summary: segment,
                rawText: segment,
                confidence: hasImplicit ? 'high' : 'medium',
                status: 'detected',
                suggestedOwner: extractOwner(segment),
                suggestedDeadline: extractDeadline(segment),
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
