// Per-message upload progress for chat media, kept outside React state so a
// progress tick re-renders only that bubble's overlay — not the whole message
// list (and not the messages → cache mirror).
import { useEffect, useState } from 'react';

const progress = new Map(); // tempId → { state: 'queued' | 'uploading', percent }
const listeners = new Map(); // tempId → Set<fn>

const notify = (id) => {
    listeners.get(id)?.forEach((fn) => fn(progress.get(id) || null));
};

export const setUploadProgress = (id, value) => {
    progress.set(id, value);
    notify(id);
};

export const clearUploadProgress = (id) => {
    progress.delete(id);
    notify(id);
};

export const useUploadProgress = (id) => {
    const [value, setValue] = useState(() => progress.get(id) || null);
    useEffect(() => {
        setValue(progress.get(id) || null);
        if (!listeners.has(id)) listeners.set(id, new Set());
        const set = listeners.get(id);
        set.add(setValue);
        return () => {
            set.delete(setValue);
            if (set.size === 0) listeners.delete(id);
        };
    }, [id]);
    return value;
};
