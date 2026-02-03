import { parseSync, stringifySync } from 'subtitle';

/**
 * Parse SRT content string into an array of cue objects
 * @param {string} content - Raw SRT file content
 * @returns {Array} Array of cue objects with start, end, and text
 */
export function parseSRT(content) {
    const nodes = parseSync(content);

    // Filter only cue nodes (skip header/style nodes if any)
    return nodes
        .filter(node => node.type === 'cue')
        .map((node, index) => ({
            index: index + 1,
            start: node.data.start,
            end: node.data.end,
            text: node.data.text,
        }));
}

/**
 * Shift subtitle timings by specified offset
 * @param {Array} cues - Array of cue objects
 * @param {number} offsetMs - Offset in milliseconds (positive = delay, negative = advance)
 * @param {number|null} startTimeMs - Optional start of range for partial shift (ms)
 * @param {number|null} endTimeMs - Optional end of range for partial shift (ms)
 * @returns {Array} New array of cues with shifted timings
 */
export function shiftTime(cues, offsetMs, startTimeMs = null, endTimeMs = null) {
    const isPartialShift = startTimeMs !== null && endTimeMs !== null;

    return cues.map(cue => {
        // Check if cue is within the shift range (for partial shift)
        const cueInRange = !isPartialShift ||
            (cue.start >= startTimeMs && cue.start <= endTimeMs);

        if (!cueInRange) {
            return { ...cue };
        }

        // Apply offset, clamp to 0 minimum
        const newStart = Math.max(0, cue.start + offsetMs);
        const newEnd = Math.max(0, cue.end + offsetMs);

        // Ensure end is always >= start
        return {
            ...cue,
            start: newStart,
            end: Math.max(newStart, newEnd),
        };
    });
}

/**
 * Convert cue array back to SRT format string
 * @param {Array} cues - Array of cue objects
 * @returns {string} SRT formatted string
 */
export function stringifySRT(cues) {
    const nodes = cues.map(cue => ({
        type: 'cue',
        data: {
            start: cue.start,
            end: cue.end,
            text: cue.text,
        },
    }));

    return stringifySync(nodes, { format: 'SRT' });
}

/**
 * Parse timestamp string to milliseconds
 * Supports formats: "HH:MM:SS,mmm", "HH:MM:SS.mmm", "MM:SS", "SS"
 * @param {string} timestamp - Timestamp string
 * @returns {number} Time in milliseconds
 */
export function parseTimestamp(timestamp) {
    if (!timestamp || typeof timestamp !== 'string') {
        return 0;
    }

    const trimmed = timestamp.trim();

    // Handle HH:MM:SS,mmm or HH:MM:SS.mmm format
    const fullMatch = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})$/);
    if (fullMatch) {
        const [, hours, minutes, seconds, ms] = fullMatch;
        return (
            parseInt(hours, 10) * 3600000 +
            parseInt(minutes, 10) * 60000 +
            parseInt(seconds, 10) * 1000 +
            parseInt(ms, 10)
        );
    }

    // Handle HH:MM:SS format
    const hmsMatch = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (hmsMatch) {
        const [, hours, minutes, seconds] = hmsMatch;
        return (
            parseInt(hours, 10) * 3600000 +
            parseInt(minutes, 10) * 60000 +
            parseInt(seconds, 10) * 1000
        );
    }

    // Handle MM:SS format
    const msMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (msMatch) {
        const [, minutes, seconds] = msMatch;
        return parseInt(minutes, 10) * 60000 + parseInt(seconds, 10) * 1000;
    }

    // Handle plain seconds
    const secondsMatch = trimmed.match(/^(\d+)$/);
    if (secondsMatch) {
        return parseInt(secondsMatch[1], 10) * 1000;
    }

    return 0;
}

/**
 * Format milliseconds to SRT timestamp format
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted timestamp "HH:MM:SS,mmm"
 */
export function formatTimestamp(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}
