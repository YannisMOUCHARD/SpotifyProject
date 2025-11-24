import { fetchPlaylistById } from "../api/spotify-playlists.js";

export async function artistCountForPlaylist(token, playlistId) {
  try {
    const result = await fetchPlaylistById(token, playlistId);
    const { data, error } = result || {};
    if (error || !data) {
      throw new Error(error || "Failed to fetch playlist.");
    }

    // Start with first page items
    let items = (data.tracks && data.tracks.items) || [];
    let next = data.tracks && data.tracks.next;

    // Follow paging links if present
    while (next) {
      try {
        const res = await fetch(next, { headers: { Authorization: `Bearer ${token}` } });
        const page = await res.json();
        if (page && page.error) {
          throw new Error(page.error.message || "Spotify page error");
        }
        items = items.concat(page.items || []);
        next = page.next;
      } catch (pageErr) {
        // Log paging error and stop paging; continue with collected items
        // eslint-disable-next-line no-console
        console.error("artistCountForPlaylist paging error:", pageErr && pageErr.message ? pageErr.message : pageErr);
        break;
      }
    }

    // Group by artist name
    const counts = {};
    for (const item of items) {
      const track = item && item.track ? item.track : null;
      if (!track) continue;
      const artists = Array.isArray(track.artists) ? track.artists : [];
      for (const artist of artists) {
        const name = (artist && artist.name) || "Unknown";
        counts[name] = (counts[name] || 0) + 1;
      }
    }

    return counts;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("artistCountForPlaylist error:", err && err.message ? err.message : err);
    return undefined;
  }
}

export default artistCountForPlaylist;

/**
 * Returns the top N artists (sorted by number of tracks) for a playlist.
 * @param {string} token
 * @param {string} playlistId
 * @param {number} topN
 * @returns {Promise<Array<{Artist:string,Tracks:number}>>}
 */
export async function artistTopForPlaylist(token, playlistId, topN = 5, countsOverride = null) {
  const counts = countsOverride || (await artistCountForPlaylist(token, playlistId));
  if (!counts || typeof counts !== 'object') return [];
  return Object.entries(counts)
    .map(([artist, count]) => ({ Artist: artist, Tracks: count }))
    .sort((a, b) => b.Tracks - a.Tracks)
    .slice(0, topN);
}

