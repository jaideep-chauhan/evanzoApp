// Canonical option lists for event ads, shared so the create-ad form and the
// events filter use the SAME vocabulary. The event filter matches by these
// exact strings (events store event_type / service_needed as names), so any
// drift between "what you can post" and "what you can filter by" would make a
// filter silently match nothing. Keep this the single source of truth.

// Vendor types an event can need — stored on the ad as `service_needed`.
export const SERVICE_OPTIONS = [
    'Photographer',
    'Videographer',
    'Caterer',
    'Decorator',
    'DJ',
    'Event Planner',
    'Florist',
    'Makeup Artist',
    'Venue',
    'Transport',
    'Security',
    'Sound System',
    'Lighting',
    'Entertainment',
];

// Event types — stored on the ad as `event_type`.
export const EVENT_TYPE_OPTIONS = [
    'Wedding',
    'Engagement',
    'Birthday',
    'Baby Shower',
    'Corporate Event',
    'Product Launch',
    'Pre-Wedding Shoot',
    'Anniversary',
    'Festival Celebration',
    'Housewarming',
    'College Fest',
    'Farewell Party',
    'Music Concert',
    'Religious Ceremony',
    'Workshop or Seminar',
    'Brand Promotion',
    'Cultural Event',
    'Proposal Setup',
    'Bachelor/Bachelorette',
    'Other',
];
