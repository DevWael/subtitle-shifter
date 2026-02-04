const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - Secure bridge between renderer and main process
 * Exposes safe APIs to the renderer process via contextBridge
 */
contextBridge.exposeInMainWorld('electronAPI', {
    /**
     * Upload/parse an SRT file
     * @param {Object} fileData - Optional { content: string, filename: string }
     */
    uploadFile: (fileData) => ipcRenderer.invoke('upload-file', fileData),

    /**
     * Shift subtitle timings
     * @param {Object} data - { cues, offsetMs, mode, startTime?, endTime? }
     */
    shiftSubtitles: (data) => ipcRenderer.invoke('shift-subtitles', data),

    /**
     * Save shifted subtitles to file (triggers native save dialog)
     * @param {Object} data - { cues, filename }
     */
    downloadFile: (data) => ipcRenderer.invoke('download-file', data),

    /**
     * Check if running in Electron
     */
    isElectron: true,
});
