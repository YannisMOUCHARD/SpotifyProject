const { generateAccessToken } = require("./utils.cjs");
const { fetchPlaylistById } = require("../src/api/spotify-playlists");

/**
 * Main function to demonstrate fetching a Spotify playlist.
 */
const main = async () => {
  var playlistId = "2IgPkhcHbgQ4s4PdCxljAx";

  const token = await generateAccessToken();
  // Fetch playlist (first page) and then paginate tracks to compute artist counts
  try {
    const res = await fetchPlaylistById(token, playlistId);
    if (res.error) {
      console.error("Error fetching playlist:", res.error);
      return;
    }
    const data = res.data;
    console.log(`Playlist: ${data.name} by ${data.owner && data.owner.display_name}`);

    const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
    const limit = 100;
    let allItems = (data.tracks && data.tracks.items) || [];
    let next = data.tracks && data.tracks.next;

    while (next) {
      const r = await fetch(next, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) {
        const text = await r.text();
        console.error(`Spotify page fetch error: ${r.status} ${text}`);
        break;
      }
      const page = await r.json();
      allItems = allItems.concat(page.items || []);
      next = page.next;
    }

    // Count artists across all items
    const counts = {};
    for (const item of allItems) {
      const track = item && item.track ? item.track : null;
      if (!track) continue;
      const artists = Array.isArray(track.artists) ? track.artists : [];
      for (const artist of artists) {
        const name = (artist && artist.name) || "Unknown";
        counts[name] = (counts[name] || 0) + 1;
      }
    }

    const top5 = Object.entries(counts)
      .map(([artist, count]) => ({ Artist: artist, Tracks: count }))
      .sort((a, b) => b.Tracks - a.Tracks)
      .slice(0, 5);

    console.log("\nTop 5 Artists by number of tracks in playlist:");
    console.table(top5);
  } catch (err) {
    console.error("Error computing artist counts:", err && err.message ? err.message : err);
  }
};

main();
