// Photon geocoding service (https://photon.komoot.io)
// Free, no API key, OpenStreetMap-based. Good for autocomplete.
//
// A "place" returned by this service has the shape:
// {
//   id, name, city, state, country, country_code,
//   lat, lon, display_name, type
// }

const PHOTON_BASE = 'https://photon.komoot.io/api/';

const buildDisplayParts = (props) => {
  const name = props.name || props.city || props.county || '';
  const region = props.state || props.county || '';
  const country = props.country || '';
  const main = name;
  const secondary = [region, country].filter(Boolean).join(', ');
  const display = [name, region, country].filter(Boolean).join(', ');
  return { main, secondary, display };
};

const normalizePhotonFeature = (feature) => {
  const props = feature.properties || {};
  const [lon, lat] = feature.geometry?.coordinates || [null, null];
  const { main, secondary, display } = buildDisplayParts(props);
  return {
    id: props.osm_id ? `${props.osm_type}-${props.osm_id}` : `${lat},${lon}`,
    name: main,
    city: props.city || props.name || null,
    state: props.state || null,
    country: props.country || null,
    country_code: (props.countrycode || '').toUpperCase() || null,
    lat,
    lon,
    display_name: display,
    main_text: main,
    secondary_text: secondary,
    type: props.osm_value || props.type || null,
    raw: feature,
  };
};

export const searchLocations = async (query, { limit = 8, lang = 'en' } = {}) => {
  if (!query || query.trim().length < 2) return [];
  const url = `${PHOTON_BASE}?q=${encodeURIComponent(query)}&limit=${limit}&lang=${lang}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`Photon search failed: ${res.status}`);
  const data = await res.json();
  return (data.features || []).map(normalizePhotonFeature);
};

export const reverseLookup = async (lat, lon, { lang = 'en' } = {}) => {
  if (lat == null || lon == null) return null;
  const url = `${PHOTON_BASE}reverse?lat=${lat}&lon=${lon}&lang=${lang}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`Photon reverse failed: ${res.status}`);
  const data = await res.json();
  const first = (data.features || [])[0];
  return first ? normalizePhotonFeature(first) : null;
};

export default { searchLocations, reverseLookup };
