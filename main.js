import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { parseSync, stringifySync } from 'subtitle';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;

/**
 * Create the main application window
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        minWidth: 600,
        minHeight: 500,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        titleBarStyle: 'hiddenInset',
        show: false,
    });

    mainWindow.loadFile(join(__dirname, 'public', 'index.html'));

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open DevTools in development
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

// ============================================
// SRT PROCESSING FUNCTIONS
// ============================================

/**
 * Parse SRT content string into an array of cue objects
 */
function parseSRT(content) {
    const nodes = parseSync(content);
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
 */
function shiftTime(cues, offsetMs, startTimeMs = null, endTimeMs = null) {
    const isPartialShift = startTimeMs !== null && endTimeMs !== null;

    return cues.map(cue => {
        const cueInRange = !isPartialShift ||
            (cue.start >= startTimeMs && cue.start <= endTimeMs);

        if (!cueInRange) {
            return { ...cue };
        }

        const newStart = Math.max(0, cue.start + offsetMs);
        const newEnd = Math.max(0, cue.end + offsetMs);

        return {
            ...cue,
            start: newStart,
            end: Math.max(newStart, newEnd),
        };
    });
}

/**
 * Convert cue array back to SRT format string
 */
function stringifySRT(cues) {
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
 * Format milliseconds to SRT timestamp format
 */
function formatTimestamp(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * Parse timestamp string to milliseconds
 */
function parseTimestamp(timestamp) {
    if (!timestamp || typeof timestamp !== 'string') {
        return 0;
    }

    const trimmed = timestamp.trim();

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

    const hmsMatch = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (hmsMatch) {
        const [, hours, minutes, seconds] = hmsMatch;
        return (
            parseInt(hours, 10) * 3600000 +
            parseInt(minutes, 10) * 60000 +
            parseInt(seconds, 10) * 1000
        );
    }

    return 0;
}

// ============================================
// IPC HANDLERS
// ============================================

/**
 * Handle file upload/open
 */
ipcMain.handle('upload-file', async (event, fileData) => {
    try {
        let content;
        let filename;

        if (fileData) {
            // File dropped or selected via renderer
            content = fileData.content;
            filename = fileData.filename;
        } else {
            // Open file dialog
            const result = await dialog.showOpenDialog(mainWindow, {
                title: 'Open SRT File',
                filters: [{ name: 'SRT Files', extensions: ['srt'] }],
                properties: ['openFile'],
            });

            if (result.canceled || result.filePaths.length === 0) {
                return { canceled: true };
            }

            const filePath = result.filePaths[0];
            content = await readFile(filePath, 'utf-8');
            filename = filePath.split('/').pop().split('\\').pop();
        }

        const cues = parseSRT(content);

        if (cues.length === 0) {
            throw new Error('The file appears to be empty or not in valid SRT format');
        }

        const firstCue = cues[0];
        const lastCue = cues[cues.length - 1];

        return {
            success: true,
            filename,
            cueCount: cues.length,
            duration: {
                start: formatTimestamp(firstCue.start),
                end: formatTimestamp(lastCue.end),
                startMs: firstCue.start,
                endMs: lastCue.end,
            },
            cues: cues.map(cue => ({
                index: cue.index,
                start: formatTimestamp(cue.start),
                end: formatTimestamp(cue.end),
                startMs: cue.start,
                endMs: cue.end,
                text: cue.text,
            })),
        };
    } catch (error) {
        return {
            error: true,
            message: error.message || 'Failed to parse the SRT file',
        };
    }
});

/**
 * Handle subtitle shifting
 */
ipcMain.handle('shift-subtitles', async (event, { cues, offsetMs, mode, startTime, endTime }) => {
    try {
        const parsedCues = cues.map(cue => ({
            index: cue.index,
            start: cue.startMs,
            end: cue.endMs,
            text: cue.text,
        }));

        let shiftedCues;

        if (mode === 'partial') {
            const startMs = parseTimestamp(startTime);
            const endMs = parseTimestamp(endTime);

            if (startMs > endMs) {
                throw new Error('Start time must be before end time');
            }

            shiftedCues = shiftTime(parsedCues, offsetMs, startMs, endMs);
        } else {
            shiftedCues = shiftTime(parsedCues, offsetMs);
        }

        return {
            success: true,
            offsetMs,
            mode: mode || 'full',
            cues: shiftedCues.map(cue => ({
                index: cue.index,
                start: formatTimestamp(cue.start),
                end: formatTimestamp(cue.end),
                startMs: cue.start,
                endMs: cue.end,
                text: cue.text,
            })),
        };
    } catch (error) {
        return {
            error: true,
            message: error.message || 'Failed to shift subtitles',
        };
    }
});

/**
 * Handle file download/save
 */
ipcMain.handle('download-file', async (event, { cues, filename }) => {
    try {
        const parsedCues = cues.map(cue => ({
            index: cue.index,
            start: cue.startMs,
            end: cue.endMs,
            text: cue.text,
        }));

        const srtContent = stringifySRT(parsedCues);

        const outputFilename = filename
            ? filename.replace('.srt', '-shifted.srt')
            : 'shifted-subtitles.srt';

        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Save Shifted Subtitles',
            defaultPath: outputFilename,
            filters: [{ name: 'SRT Files', extensions: ['srt'] }],
        });

        if (result.canceled) {
            return { canceled: true };
        }

        await writeFile(result.filePath, srtContent, 'utf-8');

        return {
            success: true,
            filePath: result.filePath,
        };
    } catch (error) {
        return {
            error: true,
            message: error.message || 'Failed to save file',
        };
    }
});

// ============================================
// APP LIFECYCLE
// ============================================

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
