import { SPOTIFY_API_BASE } from "./spotify-commons.js";

/**
 * Search for an artist by name and return the best match.
 * @param {string} token
 * @param {string} name
 * @param {number} [limit=10] - Number of results to search through for best match
 * @returns {Promise<{data: object|null, error: string|null}>}
 */
export async function fetchArtistByName(token, name, limit = 10) {
  if (!token) return { error: 'No access token found.', data: null };
  try {
    const q = encodeURIComponent(name);
    const res = await fetch(`${SPOTIFY_API_BASE}/search?q=${q}&type=artist&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.error) return { error: data.error.message, data: null };
    
    // Get all artists from search results
    const artists = data.artists && data.artists.items ? data.artists.items : [];
    if (artists.length === 0) return { data: null, error: null };
    
    // Find the best match based on name similarity and popularity
    const searchName = cleanArtistName(name);
    let bestMatch = null;
    let bestScore = -1;
    
    for (const artist of artists) {
      const artistName = cleanArtistName(artist.name);
      let score = 0;
      
      // Exact match gets highest priority
      if (artistName === searchName) {
        score = 1000000 + (artist.popularity || 0);
      }
      // Name starts with search term
      else if (artistName.startsWith(searchName)) {
        score = 100000 + (artist.popularity || 0);
      }
      // Search term starts with artist name
      else if (searchName.startsWith(artistName)) {
        score = 50000 + (artist.popularity || 0);
      }
      // Name contains search term
      else if (artistName.includes(searchName)) {
        score = 10000 + (artist.popularity || 0);
      }
      // Search term contains artist name
      else if (searchName.includes(artistName)) {
        score = 5000 + (artist.popularity || 0);
      }
      // Fallback: use popularity only
      else {
        score = artist.popularity || 0;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = artist;
      }
    }
    
    return { data: bestMatch, error: null };
  } catch {
    return { error: 'Failed to fetch artist.', data: null };
  }
}

/**
 * Search for multiple artists by name and return all matches.
 * @param {string} token
 * @param {string} name
 * @param {number} [limit=20] - Number of results to return
 * @returns {Promise<{data: object[]|null, error: string|null}>}
 */
export async function searchArtists(token, name, limit = 20) {
  if (!token) return { error: 'No access token found.', data: null };
  try {
    const q = encodeURIComponent(name);
    const res = await fetch(`${SPOTIFY_API_BASE}/search?q=${q}&type=artist&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.error) return { error: data.error.message, data: null };
    
    const artists = data.artists && data.artists.items ? data.artists.items : [];
    return { data: artists, error: null };
  } catch {
    return { error: 'Failed to search artists.', data: null };
  }
}

/**
 * Clean artist name by removing common variations and special characters.
 * @param {string} name - The artist name to clean
 * @returns {string} - The cleaned name
 */
export function cleanArtistName(name) {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    // Remove feat./ft./featuring patterns
    .replace(/\s+(feat\.?|ft\.?|featuring)\s+.*/i, '')
    // Remove parentheses and content
    .replace(/\s*\([^)]*\)/g, '')
    // Remove special characters but keep spaces and basic punctuation
    .replace(/[^\w\s\-&']/g, '')
    // Normalize multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

export default fetchArtistByName;
