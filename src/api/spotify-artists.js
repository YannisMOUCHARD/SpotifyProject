import { SPOTIFY_API_BASE } from "./spotify-commons.js";

/**
 * Search for an artist by name and return the first match.
 * @param {string} token
 * @param {string} name
 * @returns {Promise<{data: object|null, error: string|null}>}
 */
export async function fetchArtistByName(token, name) {
  if (!token) return { error: 'No access token found.', data: null };
  try {
    const q = encodeURIComponent(name);
    const res = await fetch(`${SPOTIFY_API_BASE}/search?q=${q}&type=artist&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.error) return { error: data.error.message, data: null };
    const artist = data.artists && data.artists.items && data.artists.items[0] ? data.artists.items[0] : null;
    return { data: artist, error: null };
  } catch (err) {
    return { error: 'Failed to fetch artist.', data: null };
  }
}

export default fetchArtistByName;
