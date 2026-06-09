// Audio Manager - ensures only one audio plays at a time (WhatsApp-style)
// Uses event emitter pattern to notify all AudioPlayer instances

class AudioManager {
    constructor() {
        this.currentPlayingId = null;
        this.listeners = new Map(); // Map of audioId -> stopCallback
    }

    // Register an audio player instance
    register(audioId, stopCallback) {
        this.listeners.set(audioId, stopCallback);
    }

    // Unregister when component unmounts
    unregister(audioId) {
        this.listeners.delete(audioId);
        if (this.currentPlayingId === audioId) {
            this.currentPlayingId = null;
        }
    }

    // Called when an audio starts playing
    // Stops any other currently playing audio
    onPlay(audioId) {
        // Stop the previously playing audio if different
        if (this.currentPlayingId && this.currentPlayingId !== audioId) {
            const stopCallback = this.listeners.get(this.currentPlayingId);
            if (stopCallback) {
                stopCallback();
            }
        }
        this.currentPlayingId = audioId;
    }

    // Called when an audio stops/pauses
    onStop(audioId) {
        if (this.currentPlayingId === audioId) {
            this.currentPlayingId = null;
        }
    }

    // Check if a specific audio is currently playing
    isPlaying(audioId) {
        return this.currentPlayingId === audioId;
    }

    // Stop all audio
    stopAll() {
        if (this.currentPlayingId) {
            const stopCallback = this.listeners.get(this.currentPlayingId);
            if (stopCallback) {
                stopCallback();
            }
            this.currentPlayingId = null;
        }
    }
}

// Export singleton instance
export default new AudioManager();
