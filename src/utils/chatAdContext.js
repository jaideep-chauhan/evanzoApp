// Which ad a chat message is about. Stored on the message as
// metadata.ad = { type: 'vendor' | 'event', id, title } so the chat can show
// "About: <ad>" (tappable) and the push notification can name the ad — two
// users share one chat across all their ads, so the text alone isn't enough.

export const buildAdContext = (type, id, title) => {
    if (!id) return null;
    return { type, id: String(id), title: String(title || '').trim() || (type === 'event' ? 'Gig' : 'Service') };
};

// Message metadata for sendMessage, or null when there's no ad.
export const adMetadata = (adContext) => (adContext ? { ad: adContext } : null);

// Read it back from a message (API / socket shape).
export const getMessageAd = (message) => {
    const ad = message?.metadata?.ad;
    return ad && ad.id ? ad : null;
};

// Navigation target for tapping the "About" tag.
export const adRoute = (ad) =>
    ad.type === 'event'
        ? { name: 'EventDetailView', params: { eventId: ad.id } }
        : { name: 'VendorAddDetail', params: { vendorId: ad.id } };
