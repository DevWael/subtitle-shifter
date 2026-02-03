import { Router } from 'express';
import multer from 'multer';
import {
    parseSRT,
    shiftTime,
    stringifySRT,
    parseTimestamp,
    formatTimestamp,
} from '../utils/srt-shifter.js';

const router = Router();

// Configure multer for memory storage (no disk writes)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only .srt files
        if (file.originalname.toLowerCase().endsWith('.srt')) {
            cb(null, true);
        } else {
            cb(new Error('Only .srt files are allowed'), false);
        }
    },
});

/**
 * POST /api/upload
 * Upload and parse an SRT file
 * Returns parsed cues with metadata
 */
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded',
                message: 'Please select an SRT file to upload',
            });
        }

        const content = req.file.buffer.toString('utf-8');
        const cues = parseSRT(content);

        if (cues.length === 0) {
            return res.status(400).json({
                error: 'Invalid SRT file',
                message: 'The file appears to be empty or not in valid SRT format',
            });
        }

        // Calculate file metadata
        const firstCue = cues[0];
        const lastCue = cues[cues.length - 1];

        res.json({
            success: true,
            filename: req.file.originalname,
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
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Parse error',
            message: 'Failed to parse the SRT file. Please check the file format.',
        });
    }
});

/**
 * POST /api/shift
 * Shift subtitle timings and return preview
 * Body: { cues, offsetMs, mode, startTime?, endTime? }
 */
router.post('/shift', (req, res) => {
    try {
        const { cues, offsetMs, mode, startTime, endTime } = req.body;

        // Validate required fields
        if (!cues || !Array.isArray(cues) || cues.length === 0) {
            return res.status(400).json({
                error: 'Invalid cues',
                message: 'No subtitle data provided',
            });
        }

        if (typeof offsetMs !== 'number' || isNaN(offsetMs)) {
            return res.status(400).json({
                error: 'Invalid offset',
                message: 'Please enter a valid time offset in milliseconds',
            });
        }

        // Reconstruct cue objects with ms values
        const parsedCues = cues.map(cue => ({
            index: cue.index,
            start: cue.startMs,
            end: cue.endMs,
            text: cue.text,
        }));

        let shiftedCues;

        if (mode === 'partial') {
            // Validate partial shift range
            const startMs = parseTimestamp(startTime);
            const endMs = parseTimestamp(endTime);

            if (startMs > endMs) {
                return res.status(400).json({
                    error: 'Invalid range',
                    message: 'Start time must be before end time',
                });
            }

            shiftedCues = shiftTime(parsedCues, offsetMs, startMs, endMs);
        } else {
            // Full shift
            shiftedCues = shiftTime(parsedCues, offsetMs);
        }

        // Return shifted cues with formatted timestamps
        res.json({
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
        });
    } catch (error) {
        console.error('Shift error:', error);
        res.status(500).json({
            error: 'Processing error',
            message: 'Failed to shift subtitles',
        });
    }
});

/**
 * POST /api/download
 * Generate downloadable SRT file from shifted cues
 * Body: { cues, filename? }
 */
router.post('/download', (req, res) => {
    try {
        const { cues, filename } = req.body;

        if (!cues || !Array.isArray(cues) || cues.length === 0) {
            return res.status(400).json({
                error: 'Invalid cues',
                message: 'No subtitle data provided',
            });
        }

        // Reconstruct cue objects for stringification
        const parsedCues = cues.map(cue => ({
            index: cue.index,
            start: cue.startMs,
            end: cue.endMs,
            text: cue.text,
        }));

        const srtContent = stringifySRT(parsedCues);

        // Generate filename
        const outputFilename = filename
            ? filename.replace('.srt', '-shifted.srt')
            : 'shifted-subtitles.srt';

        res.setHeader('Content-Type', 'application/x-subrip');
        res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
        res.send(srtContent);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            error: 'Generation error',
            message: 'Failed to generate SRT file',
        });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: 'File size must be less than 10MB',
            });
        }
        return res.status(400).json({
            error: 'Upload error',
            message: error.message,
        });
    }

    if (error.message === 'Only .srt files are allowed') {
        return res.status(400).json({
            error: 'Invalid file type',
            message: 'Please upload an SRT file (.srt)',
        });
    }

    next(error);
});

export default router;
