const ADDRESS_SEARCH_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

export const fetchAddressSuggestions = async (query, { signal } = {}) => {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: trimmed,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
  });

  const response = await fetch(`${ADDRESS_SEARCH_ENDPOINT}?${params.toString()}`, {
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Address lookup failed with status ${response.status}`);
  }

  const results = await response.json();
  return (results || []).map((result) => ({
    id: result.place_id,
    label: result.display_name,
    lat: result.lat,
    lon: result.lon,
  }));
};

export const getMapsUrl = (address) => {
  const trimmed = address?.trim();
  if (!trimmed) return '#';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
};
