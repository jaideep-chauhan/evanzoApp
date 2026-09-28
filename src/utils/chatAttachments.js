// Classify chat attachments for Chat Info / Media, Links & Docs.
//
// The backend stores each attachment with a `type` ('image' | 'video' |
// 'audio' | 'document'…) and `mimetype`, and the message has `message_type`.
// Those are the source of truth; the URL extension is only a fallback for old
// messages (many real files — HEIC photos, 3GP/M4V videos — weren't in the
// old extension lists, so they never showed up).

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'heif'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', '3gp'];
const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'amr', 'opus'];

export const getFileExtension = (urlOrName) => {
    if (!urlOrName || typeof urlOrName !== 'string') return '';
    const match = urlOrName.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
    return match ? match[1].toLowerCase() : '';
};

export const getAttachmentUrl = (attachment) =>
    (attachment && (attachment.url || attachment.uri)) || null;

// → 'image' | 'video' | 'audio' | 'document' | null
export const classifyAttachment = (attachment, message) => {
    if (!attachment) return null;
    const type = String(attachment.type || '').toLowerCase();
    if (['image', 'video', 'audio'].includes(type)) return type;
    if (['document', 'file'].includes(type)) return 'document';

    const mime = String(attachment.mimetype || attachment.mime || '').toLowerCase();
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime) return 'document';

    const ext = getFileExtension(getAttachmentUrl(attachment) || attachment.filename || attachment.name);
    if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
    if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
    if (AUDIO_EXTENSIONS.includes(ext)) return 'audio';

    const messageType = String(message?.message_type || message?.messageType || '').toLowerCase();
    if (['image', 'video', 'audio'].includes(messageType)) return messageType;
    if (['document', 'file'].includes(messageType)) return 'document';
    return ext ? 'document' : null;
};
