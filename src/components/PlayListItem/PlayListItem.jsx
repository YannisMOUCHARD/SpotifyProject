import './PlayListItem.css';
import '../ListItem.css';
import { useNavigate } from 'react-router-dom';

/**
 * Playlist item component
 * @param {*}  playlist 
 * @returns JSX.Element
 */
export default function PlayListItem({ playlist }) {
  const navigate = useNavigate();
  const handleNavigate = () => navigate(`/playlist/${playlist.id}`);

  return (
    <li
      key={playlist.id}
      data-testid={`playlist-item-${playlist.id}`}
      className="list-item playlist-item"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleNavigate}
        onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(); }}
        style={{ cursor: 'pointer' }}
        className="playlist-item-content"
      >
        <img
          src={playlist.images[0]?.url}
          alt="cover"
          className="playlist-item-cover"
        />
        <div className="playlist-item-details">
          <div className="playlist-item-details-header">
            <div className="playlist-item-title">{playlist.name}</div>
            <div className="playlist-item-owner">By {playlist.owner.display_name}</div>
          </div>
          <div className="playlist-item-tracks">{playlist.tracks.total} tracks</div>
        </div>
        <a 
          href={playlist.external_urls.spotify}
          className="playlist-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          Open in Spotify
        </a>
      </div>
    </li>
  );
}