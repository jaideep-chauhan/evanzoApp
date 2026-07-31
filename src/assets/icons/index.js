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
  send: require('./send.png'),

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

  // New service categories (2026-07 batch).
  photoBooth: require('./photo-booth.png'),
  choreographer: require('./choreographer.png'),
  performers: require('./performers.png'),
  florist: require('./florist.png'),
  lighting: require('./lighting.png'),
  security: require('./security.png'),
  mascot: require('./mascot.png'),
  makeupArtist: require('./makeup-artist.png'),
  cakeAndBakery: require('./cake-and-bakery.png'),
  mobileBar: require('./mobile-bar.png'),
  mehndi: require('./mehndi.png'),
  magician: require('./magician.png'),
  standUpComedy: require('./stand-up-comedy.png'),
  fireShow: require('./fire-show.png'),
  puppet: require('./puppet.png'),
  hairStylist: require('./hair-stylist.png'),
  nailPolish: require('./nail-polish.png'),
};

// Order matters — longer / more specific aliases first so "Live Music" wins
// over "Music", and "Gig Planner" wins over "Gig".
const CATEGORY_ALIASES = [
  // --- New service categories (2026-07 batch). Specific patterns first so
  //     they win over the generic aliases below (e.g. "Photo Booth" must not
  //     fall into the photography alias, "Hair stylist" not beauty-styling). ---
  [/photo\s*booth|photobooth/i, icons.photoBooth],
  [/choreograph/i, icons.choreographer],
  [/dancer/i, icons.performers],
  [/kids?\s*entertain/i, icons.performers],
  [/mascot/i, icons.mascot],
  [/magician|magic\b/i, icons.magician],
  [/puppet/i, icons.puppet],
  [/fire\s*show|fire\b/i, icons.fireShow],
  [/stand.?up|comedian|comedy/i, icons.standUpComedy],
  [/mehendi|mehndi|henna/i, icons.mehndi],
  [/nail/i, icons.nailPolish],
  [/hair/i, icons.hairStylist],
  [/make.?up/i, icons.makeupArtist],
  [/florist/i, icons.florist],
  // Lookahead so "Lighting Decoration" stays a decoration icon, "Lighting" alone → lighting.
  [/lighting\b(?!\s*decor)/i, icons.lighting],
  [/mobile\s*bar/i, icons.mobileBar],
  [/cake\s*and\s*bakery/i, icons.cakeAndBakery],
  [/security/i, icons.security],
  // --- existing aliases ---
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

export const getCategoryIcon = name => {
  if (!name) return null;
  const text = String(name);
  for (const [pattern, icon] of CATEGORY_ALIASES) {
    if (pattern.test(text)) return icon;
  }
  return null;
};

export default icons;
