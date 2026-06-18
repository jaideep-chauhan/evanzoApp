// Flat-style PNG icon set used across vendor cards, event cards, profile,
// and the create-ad form. Each entry is a Metro `require()` so React Native
// can resolve the asset at bundle time.
//
// Two things are exported:
//   1. `icons` — direct name → asset map for explicit lookups (e.g. icons.location).
//   2. `getCategoryIcon(name)` — resolves a free-text category / service name
//      ("Photography", "DJ / Music", "Beauty & Styling", "Birthday Cake", …)
//      to the closest icon in the set. Returns `null` if nothing matches so
//      callers can fall back to an emoji / Ionicon.

export const icons = {
    // Utility
    location: require('./location.png'),
    calendar: require('./calendar.png'),
    calendarAlt: require('./calendar-alt.png'),
    clock: require('./clock.png'),
    giftbox: require('./giftbox.png'),

    // Vendor / service categories
    bakery: require('./bakery.png'),
    bartender: require('./bartender.png'),
    beautyStyling: require('./beauty-styling.png'),
    carRental: require('./car-rental.png'),
    catering: require('./catering.png'),
    decoration: require('./decoration.png'),
    desserts: require('./desserts.png'),
    dj: require('./dj.png'),
    entertainers: require('./entertainers.png'),
    eventPlanner: require('./event-planner.png'),
    facePainting: require('./face-painting.png'),
    guard: require('./guard.png'),
    host: require('./host.png'),
    invitation: require('./invitation.png'),
    liveMusic: require('./live-music.png'),
    photography: require('./photography.png'),
    regionalFolk: require('./regional-folk.png'),
    venues: require('./venues.png'),
    attire: require('./attire.png'),
    valetParking: require('./valet-parking.png'),
};

// Order matters — longer / more specific aliases first so "Live Music" wins
// over "Music", and "Event Planner" wins over "Event".
const CATEGORY_ALIASES = [
    [/photograph|photo|camera/i, icons.photography],
    [/videograph|video/i, icons.photography],
    [/live\s*music|band/i, icons.liveMusic],
    [/regional|folk/i, icons.regionalFolk],
    [/dj|music/i, icons.dj],
    [/event\s*plan|planner|coordinator/i, icons.eventPlanner],
    [/cater/i, icons.catering],
    [/decor|d[ée]cor/i, icons.decoration],
    [/bartend|bar\b|drink/i, icons.bartender],
    [/bakery|cake/i, icons.bakery],
    [/dessert|sweet|deserts/i, icons.desserts],
    [/beaut|makeup|styling|hair|salon/i, icons.beautyStyling],
    [/face\s*paint/i, icons.facePainting],
    [/host|emcee|anchor|mc\b/i, icons.host],
    [/invitation|invite|card/i, icons.invitation],
    [/gift|favor|hamper/i, icons.giftbox],
    [/security|guard|bouncer/i, icons.guard],
    // Valet first — "Valet Service" should hit this, not the generic
    // car-rental fallback below.
    [/valet|parking/i, icons.valetParking],
    [/car\s*rent|transport|limo|chauffeur|vehicle/i, icons.carRental],
    // Wedding attire / bridal wear — matches "Bridal & Groom Wear",
    // "Wedding Wear" without catching "Wedding Photography" etc.
    [/wear\b|attire|bridal/i, icons.attire],
    // Venues — Hotel Venue, Beachfront Venues, Club Venue, Rooftop Venues.
    // Placed AFTER decoration so "Entry Area / Venue Decoration" stays
    // decoration-themed instead of jumping to the castle icon.
    [/venue/i, icons.venues],
    [/entertain|magician|clown|games/i, icons.entertainers],
];

export const getCategoryIcon = (name) => {
    if (!name) return null;
    const text = String(name);
    for (const [pattern, icon] of CATEGORY_ALIASES) {
        if (pattern.test(text)) return icon;
    }
    return null;
};

export default icons;
