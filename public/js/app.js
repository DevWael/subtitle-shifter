/**
 * Subtitle Shifter - Frontend Application
 * Handles file upload, shift operations, and UI state management
 */

// State management
const state = {
    file: null,
    filename: null,
    cues: [],
    shiftedCues: [],
    mode: 'full',
    hasPreview: false,
};

// DOM Elements
const elements = {
    // Theme
    themeToggle: document.getElementById('themeToggle'),
    sunIcon: document.getElementById('sunIcon'),
    moonIcon: document.getElementById('moonIcon'),

    // Upload
    uploadZone: document.getElementById('uploadZone'),
    fileInput: document.getElementById('fileInput'),
    uploadContent: document.getElementById('uploadContent'),
    uploadLoading: document.getElementById('uploadLoading'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    cueCount: document.getElementById('cueCount'),
    duration: document.getElementById('duration'),
    removeFile: document.getElementById('removeFile'),

    // Controls
    controlsSection: document.getElementById('controlsSection'),
    modeOptions: document.querySelectorAll('.mode-option'),
    timeRangeSection: document.getElementById('timeRangeSection'),
    startTime: document.getElementById('startTime'),
    endTime: document.getElementById('endTime'),
    offsetInput: document.getElementById('offsetInput'),
    quickMinus500: document.getElementById('quickMinus500'),
    quickPlus500: document.getElementById('quickPlus500'),
    previewBtn: document.getElementById('previewBtn'),
    downloadBtn: document.getElementById('downloadBtn'),

    // Preview
    previewSection: document.getElementById('previewSection'),
    previewContainer: document.getElementById('previewContainer'),
    shiftedCount: document.getElementById('shiftedCount'),

    // Toast
    toast: document.getElementById('toast'),
    toastIcon: document.getElementById('toastIcon'),
    toastMessage: document.getElementById('toastMessage'),
};

// ============================================
// THEME MANAGEMENT
// ============================================

function initTheme() {
    // Check localStorage for saved preference
    const savedTheme = localStorage.getItem('theme');

    // Default to dark mode if no saved preference
    // Only use light mode if explicitly saved as 'light'
    const isDark = savedTheme !== 'light';

    document.documentElement.classList.toggle('dark', isDark);
    updateThemeIcons(isDark);
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcons(isDark);
}

function updateThemeIcons(isDark) {
    elements.sunIcon.classList.toggle('hidden', isDark);
    elements.moonIcon.classList.toggle('hidden', !isDark);
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'success') {
    elements.toast.className = `toast ${type}`;
    elements.toastIcon.textContent = type === 'success' ? '✓' : '✕';
    elements.toastMessage.textContent = message;

    // Force reflow for animation
    elements.toast.offsetHeight;
    elements.toast.classList.remove('hidden');

    setTimeout(() => {
        elements.toast.classList.add('hidden');
    }, 3000);
}

// ============================================
// FILE UPLOAD
// ============================================

function setupUploadZone() {
    // Click to upload
    elements.uploadZone.addEventListener('click', () => {
        elements.fileInput.click();
    });

    // Keyboard accessibility
    elements.uploadZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            elements.fileInput.click();
        }
    });

    // File input change
    elements.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Drag and drop
    elements.uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadZone.classList.add('drag-over');
    });

    elements.uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        elements.uploadZone.classList.remove('drag-over');
    });

    elements.uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    // Remove file button
    elements.removeFile.addEventListener('click', (e) => {
        e.stopPropagation();
        resetState();
    });
}

async function handleFileUpload(file) {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.srt')) {
        showToast('Please upload an SRT file (.srt)', 'error');
        return;
    }

    // Show loading state
    elements.uploadContent.classList.add('hidden');
    elements.uploadLoading.classList.remove('hidden');

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }

        // Update state
        state.file = file;
        state.filename = data.filename;
        state.cues = data.cues;
        state.shiftedCues = [];
        state.hasPreview = false;

        // Update UI
        updateFileInfo(data);
        showControlsSection();

        showToast(`Loaded ${data.cueCount} subtitles`);

    } catch (error) {
        console.error('Upload error:', error);
        showToast(error.message || 'Failed to process file', 'error');
    } finally {
        elements.uploadContent.classList.remove('hidden');
        elements.uploadLoading.classList.add('hidden');
    }
}

function updateFileInfo(data) {
    elements.fileName.textContent = data.filename;
    elements.cueCount.textContent = data.cueCount;
    elements.duration.textContent = data.duration.end;
    elements.fileInfo.classList.remove('hidden');

    // Update time range defaults
    elements.startTime.value = data.duration.start;
    elements.endTime.value = data.duration.end;
}

function showControlsSection() {
    elements.controlsSection.classList.remove('hidden');
    elements.downloadBtn.disabled = true;
}

function resetState() {
    state.file = null;
    state.filename = null;
    state.cues = [];
    state.shiftedCues = [];
    state.hasPreview = false;

    // Reset UI
    elements.fileInput.value = '';
    elements.fileInfo.classList.add('hidden');
    elements.controlsSection.classList.add('hidden');
    elements.previewSection.classList.add('hidden');
    elements.downloadBtn.disabled = true;
    elements.offsetInput.value = '';
}

// ============================================
// MODE SELECTION
// ============================================

function setupModeSelection() {
    elements.modeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const mode = option.dataset.mode;
            state.mode = mode;

            // Update active state
            elements.modeOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            // Toggle time range section
            elements.timeRangeSection.classList.toggle('hidden', mode !== 'partial');
        });
    });
}

// ============================================
// QUICK OFFSET BUTTONS
// ============================================

function setupQuickButtons() {
    elements.quickMinus500.addEventListener('click', () => {
        const current = parseInt(elements.offsetInput.value) || 0;
        elements.offsetInput.value = current - 500;
    });

    elements.quickPlus500.addEventListener('click', () => {
        const current = parseInt(elements.offsetInput.value) || 0;
        elements.offsetInput.value = current + 500;
    });
}

// ============================================
// PREVIEW & SHIFT
// ============================================

async function handlePreview() {
    const offset = parseInt(elements.offsetInput.value);

    if (isNaN(offset) || offset === 0) {
        showToast('Please enter a valid offset value', 'error');
        return;
    }

    if (state.cues.length === 0) {
        showToast('No subtitles loaded', 'error');
        return;
    }

    // Validate time range for partial shift
    if (state.mode === 'partial') {
        const startTime = elements.startTime.value.trim();
        const endTime = elements.endTime.value.trim();

        if (!startTime || !endTime) {
            showToast('Please enter start and end times', 'error');
            return;
        }
    }

    // Disable button and show loading
    elements.previewBtn.disabled = true;
    const originalText = elements.previewBtn.innerHTML;
    elements.previewBtn.innerHTML = '<span class="spinner"></span> Processing...';

    try {
        const response = await fetch('/api/shift', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cues: state.cues,
                offsetMs: offset,
                mode: state.mode,
                startTime: elements.startTime.value,
                endTime: elements.endTime.value,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Shift failed');
        }

        state.shiftedCues = data.cues;
        state.hasPreview = true;

        renderPreview();
        elements.downloadBtn.disabled = false;

        showToast(`Preview generated (${offset > 0 ? '+' : ''}${offset}ms)`);

    } catch (error) {
        console.error('Preview error:', error);
        showToast(error.message || 'Failed to generate preview', 'error');
    } finally {
        elements.previewBtn.disabled = false;
        elements.previewBtn.innerHTML = originalText;
    }
}

function renderPreview() {
    elements.previewSection.classList.remove('hidden');

    // Count actually shifted items
    const shiftedCount = state.shiftedCues.filter((cue, index) => {
        const original = state.cues[index];
        return cue.startMs !== original.startMs;
    }).length;

    elements.shiftedCount.textContent = shiftedCount;

    // Render preview items (limit to 50 for performance)
    const itemsToShow = state.shiftedCues.slice(0, 50);

    elements.previewContainer.innerHTML = itemsToShow.map((cue, index) => {
        const original = state.cues[index];
        const isShifted = cue.startMs !== original.startMs;

        return `
      <div class="preview-item fade-in" style="animation-delay: ${index * 20}ms">
        <div class="flex items-start gap-4">
          <span class="text-sm text-[var(--text-secondary)] font-mono w-8">#${cue.index}</span>
          <div class="flex-1">
            <div class="flex flex-wrap items-center gap-2 mb-2">
              ${isShifted ? `<span class="timestamp original">${original.start}</span>` : ''}
              <span class="timestamp">${cue.start}</span>
              <span class="text-[var(--text-secondary)]">→</span>
              <span class="timestamp">${cue.end}</span>
              ${isShifted ? '<span class="text-xs text-[var(--accent)]">✓ shifted</span>' : ''}
            </div>
            <p class="text-sm text-[var(--text-secondary)]">${escapeHtml(cue.text).replace(/\n/g, '<br>')}</p>
          </div>
        </div>
      </div>
    `;
    }).join('');

    // Add "more items" indicator if needed
    if (state.shiftedCues.length > 50) {
        elements.previewContainer.innerHTML += `
      <div class="preview-item text-center text-[var(--text-secondary)]">
        ... and ${state.shiftedCues.length - 50} more subtitles
      </div>
    `;
    }

    // Scroll to preview section
    elements.previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// DOWNLOAD
// ============================================

async function handleDownload() {
    if (!state.hasPreview || state.shiftedCues.length === 0) {
        showToast('Please generate a preview first', 'error');
        return;
    }

    // Disable button and show loading
    elements.downloadBtn.disabled = true;
    const originalText = elements.downloadBtn.innerHTML;
    elements.downloadBtn.innerHTML = '<span class="spinner"></span> Generating...';

    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cues: state.shiftedCues,
                filename: state.filename,
            }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Download failed');
        }

        // Get the blob and trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = state.filename
            ? state.filename.replace('.srt', '-shifted.srt')
            : 'shifted-subtitles.srt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showToast('Download started!');

    } catch (error) {
        console.error('Download error:', error);
        showToast(error.message || 'Failed to download file', 'error');
    } finally {
        elements.downloadBtn.disabled = false;
        elements.downloadBtn.innerHTML = originalText;
    }
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
    initTheme();
    setupUploadZone();
    setupModeSelection();
    setupQuickButtons();

    // Event listeners
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.previewBtn.addEventListener('click', handlePreview);
    elements.downloadBtn.addEventListener('click', handleDownload);

    // Handle enter key in offset input
    elements.offsetInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handlePreview();
        }
    });
}

// Start the app
init();
