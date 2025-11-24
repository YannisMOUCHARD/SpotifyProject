import { useState, useEffect } from 'react';
import { artistTopForPlaylist } from '../../services/artist-count-for-playlist.js';
import { fetchArtistByName } from '../../api/spotify-artists.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import { buildTitle } from '../../constants/appMeta.js';
import './TopArtistPlaylistPage.css';

export default function TopArtistPage() {
  const [playlistId, setPlaylistId] = useState('');
  const [top, setTop] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { token } = useRequireToken();

  const onClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await artistTopForPlaylist(token, playlistId, 5);
      const list = result || [];

      // Enrich each artist entry with image and spotify link by searching the artist
      const enriched = await Promise.all(
        list.map(async (entry) => {
          try {
            const res = await fetchArtistByName(token, entry.Artist);
            const artist = res && res.data ? res.data : null;
            const image = artist && Array.isArray(artist.images) && artist.images.length > 0
              ? (artist.images[1] ? artist.images[1].url : artist.images[0].url)
              : null;
            const external = artist && artist.external_urls ? artist.external_urls.spotify : null;
            return { ...entry, image, external };
          } catch {
            return { ...entry, image: null, external: null };
          }
        })
      );

      setTop(enriched);
    } catch (err) {
      setError(err && err.message ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { document.title = buildTitle('Top Artists (playlist)'); }, []);

  return (
    <section className="top-artist-page page-container" aria-labelledby="top-artist-title">
      <h1 id="top-artist-title" className="page-title">Top Artist (by Playlist)</h1>

      <div className="top-artist-controls">
        <label htmlFor="playlist-id">Playlist ID</label>
        <input id="playlist-id" value={playlistId} onChange={(e) => setPlaylistId(e.target.value)} placeholder="Enter playlist id" />
        <button onClick={onClick} disabled={loading || !playlistId || !token}>Top artists</button>
      </div>

      {loading && <output className="artists-loading" data-testid="loading-indicator">Loading top artists…</output>}
      {error && !loading && <div className="artists-error" role="alert">{error}</div>}

      {!loading && !error && top && top.length > 0 && (
        <ol className="artists-list">
          {top.map((r, i) => (
            <li key={r.Artist} className="artist-list-item">
              {r.image && <img src={r.image} alt={r.Artist} className="artist-cover" />}
              <div className="artist-info">
                <div className="artist-name">{i + 1}. {r.Artist}</div>
                <div className="artist-tracks">{r.Tracks} track{r.Tracks > 1 ? 's' : ''}</div>
              </div>
              {r.external && (
                <a href={r.external} target="_blank" rel="noopener noreferrer" className="artist-link">View</a>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
