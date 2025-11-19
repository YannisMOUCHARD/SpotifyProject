import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PlaylistsPage, { limit } from './PlaylistsPage.jsx';
import * as spotifyApi from '../../api/spotify-me.js';
import { KEY_ACCESS_TOKEN } from '../../constants/storageKeys.js';
import { buildTitle } from '../../constants/appMeta.js';
import * as handleTokenErrorModule from '../../utils/handleTokenError.js';

const mockPlaylists = {
  items: [
    {
      id: 'playlist1',
      name: 'My Playlist 1',
      images: [{ url: 'https://via.placeholder.com/56' }],
      owner: { display_name: 'User1' },
      tracks: { total: 5 },
      external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' }
    },
    {
      id: 'playlist2',
      name: 'My Playlist 2', 
      images: [{ url: 'https://via.placeholder.com/56' }],
      owner: { display_name: 'User2' },
      tracks: { total: 10 },
      external_urls: { spotify: 'https://open.spotify.com/playlist/playlist2' }
    }
  ],
  total: 2
};

const tokenValue = 'test-token';

describe('PlaylistsPage', () => {
  beforeEach(() => {
    document.title = '';
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => 
      key === KEY_ACCESS_TOKEN ? tokenValue : null
    );
    jest.spyOn(spotifyApi, 'fetchUserPlaylists').mockResolvedValue({
      data: mockPlaylists,
      error: null
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderPlaylistsPage = () => {
    return render(
      <MemoryRouter initialEntries={['/playlists']}>
        <Routes>
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  test('sets document title on mount', () => {
    renderPlaylistsPage();
    expect(document.title).toBe(buildTitle('Playlists'));
  });

  test('displays loading state initially', () => {
    renderPlaylistsPage();
    const loadingElement = screen.getByTestId('loading-indicator');
    expect(loadingElement).toHaveTextContent('Loading playlists…');
    expect(loadingElement).toHaveClass('playlists-loading');
  });

  test('renders page structure correctly', () => {
    renderPlaylistsPage();

    const section = screen.getByRole('region', { name: 'Your Playlists' });
    expect(section).toHaveClass('playlists-container', 'page-container');
    expect(section).toHaveAttribute('aria-labelledby', 'playlists-title');

    const title = screen.getByRole('heading', { level: 1, name: 'Your Playlists' });
    expect(title).toHaveAttribute('id', 'playlists-title');
    expect(title).toHaveClass('playlists-title', 'page-title');

    const countHeading = screen.getByRole('heading', { level: 2 });
    expect(countHeading).toHaveTextContent(`${limit} Playlists`);
    expect(countHeading).toHaveClass('playlists-count');
  });

  test('fetches and renders playlists successfully', async () => {
    renderPlaylistsPage();

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    expect(spotifyApi.fetchUserPlaylists).toHaveBeenCalledWith(tokenValue, limit);
    expect(spotifyApi.fetchUserPlaylists).toHaveBeenCalledTimes(1);

    const list = screen.getByRole('list');
    expect(list).toHaveClass('playlists-list');

    for (const playlist of mockPlaylists.items) {
      expect(screen.getByTestId(`playlist-item-${playlist.id}`)).toBeInTheDocument();
    }

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('does not fetch when token is not available', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    renderPlaylistsPage();

    expect(spotifyApi.fetchUserPlaylists).not.toHaveBeenCalled();
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('displays error when fetchUserPlaylists returns error', async () => {
    jest.spyOn(spotifyApi, 'fetchUserPlaylists').mockResolvedValue({
      data: { items: [], total: 0 },
      error: 'Failed to fetch playlists'
    });

    renderPlaylistsPage();

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toHaveTextContent('Failed to fetch playlists');
    expect(errorAlert).toHaveClass('playlists-error');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  test('displays error when fetchUserPlaylists throws exception', async () => {
    jest.spyOn(spotifyApi, 'fetchUserPlaylists').mockRejectedValue(
      new Error('Network error')
    );

    renderPlaylistsPage();

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toHaveTextContent('Network error');
    expect(errorAlert).toHaveClass('playlists-error');
  });

  test('calls handleTokenError when token is expired', async () => {
    const handleTokenErrorSpy = jest.spyOn(handleTokenErrorModule, 'handleTokenError')
      .mockReturnValue(true);

    jest.spyOn(spotifyApi, 'fetchUserPlaylists').mockResolvedValue({
      data: { items: [], total: 0 },
      error: 'The access token expired'
    });

    renderPlaylistsPage();

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    expect(handleTokenErrorSpy).toHaveBeenCalledWith(
      'The access token expired',
      expect.any(Function)
    );
  });

  test('does not show error when handleTokenError returns true', async () => {
    jest.spyOn(handleTokenErrorModule, 'handleTokenError').mockReturnValue(true);

    jest.spyOn(spotifyApi, 'fetchUserPlaylists').mockResolvedValue({
      data: { items: [], total: 0 },
      error: 'Token expired'
    });

    renderPlaylistsPage();

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('shows error when handleTokenError returns false', async () => {
    jest.spyOn(handleTokenErrorModule, 'handleTokenError').mockReturnValue(false);

    jest.spyOn(spotifyApi, 'fetchUserPlaylists').mockResolvedValue({
      data: { items: [], total: 0 },
      error: 'Some other error'
    });

    renderPlaylistsPage();

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Some other error');
  });

  test('renders empty list when no playlists available', async () => {
    jest.spyOn(spotifyApi, 'fetchUserPlaylists').mockResolvedValue({
      data: { items: [], total: 0 },
      error: null
    });

    renderPlaylistsPage();

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(list).toBeEmptyDOMElement();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('does not show list or error during loading', () => {
    jest.spyOn(spotifyApi, 'fetchUserPlaylists').mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderPlaylistsPage();

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('shows playlists list only when not loading and no error', async () => {
    renderPlaylistsPage();

    // Initially loading, no list shown
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    // After loading finishes, list is shown
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('exports limit constant correctly', () => {
    expect(limit).toBe(10);
    expect(typeof limit).toBe('number');
  });
});