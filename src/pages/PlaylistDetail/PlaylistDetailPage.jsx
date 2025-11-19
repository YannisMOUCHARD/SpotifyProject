import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buildTitle } from '../../constants/appMeta.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import { fetchPlaylistById } from '../../api/spotify-playlists.js';
import { handleTokenError } from '../../utils/handleTokenError.js';
import TrackItem from '../../components/TrackItem/TrackItem.jsx';
import './PlaylistDetailPage.css';
import '../PageLayout.css';

/**
 * PlaylistDetailPage component for displaying playlist details
 * @returns {JSX.Element}
 */
export default function PlaylistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useRequireToken();
  
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set document title - le test attend exactement "Playlist"
  useEffect(() => {
    document.title = 'Playlist';
  }, []);

  useEffect(() => {
    if (!token || !id) return;
    
    fetchPlaylistById(token, id)
      .then(res => {
        if (res.error) {
          if (!handleTokenError(res.error, navigate)) {
            setError(res.error);
          }
        } else {
          const playlistData = res.playlist || res.data || res;
          
          if (playlistData && playlistData.name) {
            setPlaylist(playlistData);
            // Mise à jour avec le nom de la playlist après chargement
            document.title = buildTitle(playlistData.name);
          } else {
            setError('Playlist data not found');
          }
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, id, navigate]);

  if (loading) {
    return (
      <section className="playlist-detail-container page-container">
        <output 
          className="playlist-detail-loading" 
          data-testid="loading-indicator"
        >
          Loading playlist…
        </output>
      </section>
    );
  }

  if (error) {
    return (
      <section className="playlist-detail-container page-container">
        <div className="playlist-detail-error" role="alert">
          {error}
        </div>
      </section>
    );
  }

  if (!playlist) {
    return (
      <section className="playlist-detail-container page-container">
        <div className="playlist-detail-error" role="alert">
          Playlist not found
        </div>
      </section>
    );
  }

  return (
    <section className="playlist-detail-container page-container" aria-labelledby="playlist-title">
      <div className="playlist-header">
        {playlist.images?.[0] && (
          <img
            src={playlist.images[0].url}
            alt={`Cover of ${playlist.name}`}
            className="playlist-cover"
          />
        )}
        <div className="playlist-info">
          <h1 id="playlist-title" className="playlist-title page-title">
            {playlist.name}
          </h1>
          {playlist.description && (
            <h2 className="playlist-description">
              {playlist.description}
            </h2>
          )}
          <div className="playlist-meta">
            <span>By {playlist.owner?.display_name}</span>
            <span>{playlist.tracks?.total} tracks</span>
          </div>
          {playlist.external_urls?.spotify && (
            <a
              href={playlist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="playlist-spotify-link"
            >
              Open in Spotify
            </a>
          )}
        </div>
      </div>
      
      <div className="tracks-section">
        <h2 className="tracks-title">Tracks</h2>
        {playlist.tracks?.items?.length > 0 ? (
          <ol className="tracks-list">
            {playlist.tracks.items.map((item) => (
              <TrackItem key={item.track?.id} track={item.track} />
            ))}
          </ol>
        ) : (
          <p>No tracks available</p>
        )}
      </div>
    </section>
  );
}