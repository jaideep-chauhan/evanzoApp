import api from './api';
import { Platform } from 'react-native';

/**
 * Upload Service
 *
 * Handles all file upload operations including:
 * - Image uploads with compression and thumbnails
 * - Video uploads
 * - Audio uploads
 * - Generic file uploads
 * - Multiple file uploads
 * - File management (delete, info, search)
 * - Storage statistics
 */
class UploadService {
    constructor() {
        this.uploadingFiles = new Map(); // Track ongoing uploads
    }

    // ==================== SINGLE FILE UPLOADS ====================

    /**
     * Upload a single image with optional compression and thumbnail
     * @param {object} imageFile - Image file object {uri, type, name}
     * @param {object} options - Upload options
     * @param {function} onProgress - Progress callback (percent)
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async uploadImage(imageFile, options = {}, onProgress = null) {
        try {
            const formData = new FormData();
            formData.append('image', {
                uri: imageFile.uri,
                type: imageFile.type || 'image/jpeg',
                name: imageFile.name || 'image.jpg',
            });

            // Add optional parameters
            if (options.generateThumbnail !== undefined) {
                formData.append('generateThumbnail', options.generateThumbnail);
            }
            if (options.thumbnailWidth) {
                formData.append('thumbnailWidth', options.thumbnailWidth);
            }
            if (options.thumbnailHeight) {
                formData.append('thumbnailHeight', options.thumbnailHeight);
            }
            if (options.compress !== undefined) {
                formData.append('compress', options.compress);
            }
            if (options.quality) {
                formData.append('quality', options.quality);
            }
            if (options.resize) {
                formData.append('resize', JSON.stringify(options.resize));
            }

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            // Add progress tracking
            if (onProgress) {
                config.onUploadProgress = (progressEvent) => {
                    if (progressEvent.total && progressEvent.total > 0) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percent);
                    }
                };
            }

            const response = await api.post('/upload/image', formData, config);

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to upload image',
            };
        } catch (error) {
            console.error('[UploadService] Error uploading image:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to upload image',
            };
        }
    }

    /**
     * Upload a single video
     * @param {object} videoFile - Video file object {uri, type, name}
     * @param {object} options - Upload options
     * @param {function} onProgress - Progress callback (percent)
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async uploadVideo(videoFile, options = {}, onProgress = null) {
        try {
            const formData = new FormData();
            formData.append('video', {
                uri: videoFile.uri,
                type: videoFile.type || 'video/mp4',
                name: videoFile.name || 'video.mp4',
            });

            if (options.generateThumbnail !== undefined) {
                formData.append('generateThumbnail', options.generateThumbnail);
            }

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            if (onProgress) {
                config.onUploadProgress = (progressEvent) => {
                    if (progressEvent.total && progressEvent.total > 0) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percent);
                    }
                };
            }

            const response = await api.post('/upload/video', formData, config);

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to upload video',
            };
        } catch (error) {
            console.error('[UploadService] Error uploading video:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to upload video',
            };
        }
    }

    /**
     * Upload a single audio file
     * @param {object} audioFile - Audio file object {uri, type, name}
     * @param {function} onProgress - Progress callback (percent)
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async uploadAudio(audioFile, onProgress = null) {
        try {
            const formData = new FormData();
            formData.append('audio', {
                uri: audioFile.uri,
                type: audioFile.type || 'audio/mpeg',
                name: audioFile.name || 'audio.mp3',
            });

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            if (onProgress) {
                config.onUploadProgress = (progressEvent) => {
                    if (progressEvent.total && progressEvent.total > 0) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percent);
                    }
                };
            }

            const response = await api.post('/upload/audio', formData, config);

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to upload audio',
            };
        } catch (error) {
            console.error('[UploadService] Error uploading audio:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to upload audio',
            };
        }
    }

    /**
     * Upload a generic file (PDF, documents, etc.)
     * @param {object} file - File object {uri, type, name}
     * @param {function} onProgress - Progress callback (percent)
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async uploadFile(file, onProgress = null) {
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.type || 'application/octet-stream',
                name: file.name || 'file',
            });

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            if (onProgress) {
                config.onUploadProgress = (progressEvent) => {
                    if (progressEvent.total && progressEvent.total > 0) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percent);
                    }
                };
            }

            const response = await api.post('/upload/file', formData, config);

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to upload file',
            };
        } catch (error) {
            console.error('[UploadService] Error uploading file:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to upload file',
            };
        }
    }

    // ==================== MULTIPLE FILE UPLOADS ====================

    /**
     * Upload multiple files at once (max 10)
     * @param {array} files - Array of file objects [{uri, type, name}, ...]
     * @param {object} options - Upload options
     * @param {function} onProgress - Progress callback (percent)
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async uploadMultiple(files, options = {}, onProgress = null) {
        try {
            if (!Array.isArray(files) || files.length === 0) {
                return {
                    success: false,
                    message: 'No files provided',
                };
            }

            if (files.length > 10) {
                return {
                    success: false,
                    message: 'Maximum 10 files allowed per upload',
                };
            }

            const formData = new FormData();

            // Add all files
            files.forEach((file) => {
                formData.append('files', {
                    uri: file.uri,
                    type: file.type || 'application/octet-stream',
                    name: file.name || 'file',
                });
            });

            // Add optional parameters
            if (options.generateThumbnail !== undefined) {
                formData.append('generateThumbnail', options.generateThumbnail);
            }

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            if (onProgress) {
                config.onUploadProgress = (progressEvent) => {
                    if (progressEvent.total && progressEvent.total > 0) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percent);
                    }
                };
            }

            const response = await api.post('/upload/multiple', formData, config);

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to upload files',
            };
        } catch (error) {
            console.error('[UploadService] Error uploading multiple files:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to upload files',
            };
        }
    }

    // ==================== FILE MANAGEMENT ====================

    /**
     * Delete a single file
     * @param {string} filename - Filename to delete
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async deleteFile(filename) {
        try {
            const response = await api.delete(`/upload/${filename}`);

            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to delete file',
            };
        } catch (error) {
            console.error('[UploadService] Error deleting file:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to delete file',
            };
        }
    }

    /**
     * Bulk delete multiple files (max 50)
     * @param {array} files - Array of file objects [{filename, type?}, ...]
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async bulkDeleteFiles(files) {
        try {
            if (!Array.isArray(files) || files.length === 0) {
                return {
                    success: false,
                    message: 'No files provided',
                };
            }

            if (files.length > 50) {
                return {
                    success: false,
                    message: 'Maximum 50 files allowed per bulk delete',
                };
            }

            const response = await api.delete('/upload/bulk/delete', {
                data: { files },
            });

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to delete files',
            };
        } catch (error) {
            console.error('[UploadService] Error bulk deleting files:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to delete files',
            };
        }
    }

    /**
     * Get information about a file
     * @param {string} filename - Filename to get info for
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async getFileInfo(filename) {
        try {
            const response = await api.get(`/upload/info/${filename}`);

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to get file info',
            };
        } catch (error) {
            console.error('[UploadService] Error getting file info:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to get file info',
            };
        }
    }

    /**
     * Check if a file exists
     * @param {string} filename - Filename to check
     * @returns {Promise<{success: boolean, exists?: boolean}>}
     */
    async checkFileExists(filename) {
        try {
            const response = await api.get(`/upload/exists/${filename}`);

            if (response.data.success) {
                return {
                    success: true,
                    exists: response.data.data?.exists || false,
                };
            }

            return {
                success: false,
                exists: false,
            };
        } catch (error) {
            console.error('[UploadService] Error checking file exists:', error);
            return {
                success: false,
                exists: false,
            };
        }
    }

    // ==================== FILE BROWSING & SEARCH ====================

    /**
     * Get files by type
     * @param {string} type - File type (image, video, audio, file)
     * @param {object} params - Query parameters {page, limit}
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async getFilesByType(type, params = {}) {
        try {
            const response = await api.get(`/upload/type/${type}`, {
                params: {
                    page: params.page || 1,
                    limit: params.limit || 20,
                },
            });

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to get files',
                data: { files: [], total: 0 },
            };
        } catch (error) {
            console.error('[UploadService] Error getting files by type:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to get files',
                data: { files: [], total: 0 },
            };
        }
    }

    /**
     * Search files by filename
     * @param {string} query - Search query
     * @param {object} params - Search parameters
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async searchFiles(query, params = {}) {
        try {
            if (!query || query.trim() === '') {
                return {
                    success: false,
                    message: 'Search query is required',
                    data: { files: [], total: 0 },
                };
            }

            const response = await api.get('/upload/search', {
                params: {
                    query: query.trim(),
                    limit: params.limit || 20,
                    offset: params.offset || 0,
                    type: params.type || undefined,
                    sortBy: params.sortBy || 'created_at',
                    sortOrder: params.sortOrder || 'desc',
                },
            });

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to search files',
                data: { files: [], total: 0 },
            };
        } catch (error) {
            console.error('[UploadService] Error searching files:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to search files',
                data: { files: [], total: 0 },
            };
        }
    }

    // ==================== STORAGE STATISTICS ====================

    /**
     * Get storage usage statistics
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async getStorageStats() {
        try {
            const response = await api.get('/upload/stats');

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to get storage stats',
            };
        } catch (error) {
            console.error('[UploadService] Error getting storage stats:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to get storage stats',
            };
        }
    }

    // ==================== PRESIGNED URL (CLOUD STORAGE) ====================

    /**
     * Generate pre-signed URL for direct cloud upload
     * @param {object} fileInfo - File information {filename, type, mimetype}
     * @returns {Promise<{success: boolean, data?: object}>}
     */
    async generatePresignedUrl(fileInfo) {
        try {
            const response = await api.post('/upload/presigned-url', {
                filename: fileInfo.filename,
                type: fileInfo.type || 'file',
                mimetype: fileInfo.mimetype,
            });

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to generate pre-signed URL',
            };
        } catch (error) {
            console.error('[UploadService] Error generating pre-signed URL:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to generate pre-signed URL',
            };
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * Validate file size against limits
     * @param {number} size - File size in bytes
     * @param {string} type - File type (image, video, audio, file)
     * @returns {boolean} True if valid, false if exceeds limit
     */
    validateFileSize(size, type) {
        const limits = {
            image: 10 * 1024 * 1024,      // 10MB
            video: 100 * 1024 * 1024,     // 100MB
            audio: 20 * 1024 * 1024,      // 20MB
            file: 20 * 1024 * 1024,       // 20MB
        };

        const limit = limits[type] || limits.file;
        return size <= limit;
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size (e.g., "2.5 MB")
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Get file type from mimetype
     * @param {string} mimetype - File mimetype
     * @returns {string} File type (image, video, audio, file)
     */
    getFileTypeFromMimetype(mimetype) {
        if (mimetype.startsWith('image/')) return 'image';
        if (mimetype.startsWith('video/')) return 'video';
        if (mimetype.startsWith('audio/')) return 'audio';
        return 'file';
    }

    /**
     * Cancel ongoing upload
     * @param {string} uploadId - Upload identifier
     */
    cancelUpload(uploadId) {
        if (this.uploadingFiles.has(uploadId)) {
            const abortController = this.uploadingFiles.get(uploadId);
            abortController.abort();
            this.uploadingFiles.delete(uploadId);
            console.log(`[UploadService] Upload ${uploadId} cancelled`);
        }
    }
}

const uploadService = new UploadService();
export default uploadService;
