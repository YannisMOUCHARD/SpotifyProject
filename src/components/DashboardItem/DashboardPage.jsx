import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserTopArtists, fetchUserTopTracks } from '../../api/spotify-me.js';
import { KEY_ACCESS_TOKEN } from '../../constants/storageKeys.js';
import { buildTitle } from '../../constants/appMeta.js';
import { handleTokenError } from '../../utils/handleTokenError.js';
import './DashboardPage.css';

/**
 * Dashboard component showing top artist and top track
 * @returns {JSX.Element}
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [loadingArtists, setLoadingArtists] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [errorArtists, setErrorArtists] = useState(null);
  const [errorTracks, setErrorTracks] = useState(null);
  const [topArtist, setTopArtist] = useState(null);
  const [topTrack, setTopTrack] = useState(null);

  useEffect(() => {
    document.title = buildTitle('Dashboard');
    
    const fetchTopArtists = async () => {
      const token = localStorage.getItem(KEY_ACCESS_TOKEN);
      if (!token) {
        setLoadingArtists(false);
        return;
      }

      try {
        setLoadingArtists(true);
        
        const artistResponse = await fetchUserTopArtists(token, 1);
        if (artistResponse.error) {
          if (handleTokenError(artistResponse.error, navigate)) {
            return;
          }
          setErrorArtists(artistResponse.error);
          return;
        }

        setTopArtist(artistResponse.data?.items?.[0] || null);
      } catch (err) {
        setErrorArtists(err.message);
      } finally {
        setLoadingArtists(false);
      }
    };

    const fetchTopTracks = async () => {
      const token = localStorage.getItem(KEY_ACCESS_TOKEN);
      if (!token) {
        setLoadingTracks(false);
        return;
      }

      try {
        setLoadingTracks(true);
        
        const trackResponse = await fetchUserTopTracks(token, 1);
        if (trackResponse.error) {
          if (handleTokenError(trackResponse.error, navigate)) {
            return;
          }
          setErrorTracks(trackResponse.error);
          return;
        }

        setTopTrack(trackResponse.data?.items?.[0] || null);
      } catch (err) {
        setErrorTracks(err.message);
      } finally {
        setLoadingTracks(false);
      }
    };

    fetchTopArtists();
    fetchTopTracks();
  }, [navigate]);

  return (
    <section 
      className="dashboard-container page-container"
      aria-labelledby="dashboard-title"
    >
      <h1 id="dashboard-title" className="dashboard-title page-title">
        Dashboard
      </h1>
      <h2 className="dashboard-subtitle">
        Your top artist and track
      </h2>

      <div className="dashboard-content">
        <div className="dashboard-item">
          {loadingArtists && (
            <div data-testid="loading-artists-indicator">
              Loading artists...
            </div>
          )}
          
          {errorArtists && (
            <div data-testid="error-artists-indicator" role="alert">
              {errorArtists}
            </div>
          )}
          
          {!loadingArtists && !errorArtists && topArtist && (
            <div className="top-artist-card" data-testid="top-artist-card">
              {topArtist.images?.[0] && (
                <img
                  src={topArtist.images[0].url}
                  alt={topArtist.name}
                  className="artist-image"
                />
              )}
              <h3 className="artist-name">{topArtist.name}</h3>
              {topArtist.external_urls?.spotify && (
                <a
                  href={topArtist.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="spotify-link"
                >
                  Open in Spotify
                </a>
              )}
            </div>
          )}
          
          {!loadingArtists && !errorArtists && !topArtist && (
            <p className="no-data">No top artist data available</p>
          )}
        </div>

        <div className="dashboard-item">
          {loadingTracks && (
            <div data-testid="loading-tracks-indicator">
              Loading tracks...
            </div>
          )}
          
          {errorTracks && (
            <div data-testid="error-tracks-indicator" role="alert">
              {errorTracks}
            </div>
          )}
          
          {!loadingTracks && !errorTracks && topTrack && (
            <div className="top-track-card" data-testid="top-track-card">
              {topTrack.album?.images?.[0] && (
                <img
                  src={topTrack.album.images[0].url}
                  alt={topTrack.album.name}
                  className="track-image"
                />
              )}
              <div className="track-info">
                <h3 className="track-name">{topTrack.name}</h3>
                {topTrack.external_urls?.spotify && (
                  <a
                    href={topTrack.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="spotify-link"
                  >
                    Open in Spotify
                  </a>
                )}
              </div>
            </div>
          )}
          
          {!loadingTracks && !errorTracks && !topTrack && (
            <p className="no-data">No top track data available</p>
          )}
        </div>
      </div>
    </section>
  );
}