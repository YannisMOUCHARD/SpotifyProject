import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// mocks
jest.mock('../../services/artist-count-for-playlist.js', () => ({
  artistTopForPlaylist: jest.fn(),
}));
jest.mock('../../api/spotify-artists.js', () => ({
  fetchArtistByName: jest.fn(),
}));
jest.mock('../../hooks/useRequireToken.js', () => ({
  useRequireToken: jest.fn(),
}));

import { artistTopForPlaylist } from '../../services/artist-count-for-playlist.js';
import { fetchArtistByName } from '../../api/spotify-artists.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';

// component under test
import TopArtistPage from './TopArtistPlaylistPage';

describe('TopArtistPlaylistPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // default token available
    useRequireToken.mockReturnValue({ token: 'tok-1', checking: false });
  });

  test('renders controls and title, button disabled when no playlist id', () => {
    render(<TopArtistPage />);
    expect(screen.getByRole('heading', { name: /Top Artist/i })).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Top artists/i });
    expect(btn).toBeDisabled();
    const input = screen.getByPlaceholderText(/Enter playlist id/i);
    expect(input).toBeInTheDocument();
  });

  test('displays loading indicator and then shows enriched artist list', async () => {
    // mock artistTopForPlaylist to return counts
    artistTopForPlaylist.mockResolvedValue([
      { Artist: 'Artist A', Tracks: 3 },
      { Artist: 'Artist B', Tracks: 1 },
    ]);

    // mock fetchArtistByName to return artist objects (with images and external_urls)
    fetchArtistByName
      .mockResolvedValueOnce({ data: { images: [{ url: 'i1' }, { url: 'i2' }], external_urls: { spotify: 'https://sptfy/a' } }, error: null })
      .mockResolvedValueOnce({ data: { images: [], external_urls: { spotify: 'https://sptfy/b' } }, error: null });

    render(<TopArtistPage />);

    // provide playlist id and click
    fireEvent.change(screen.getByPlaceholderText(/Enter playlist id/i), { target: { value: 'pl-123' } });
    fireEvent.click(screen.getByRole('button', { name: /Top artists/i }));

    // loading indicator shown
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

    // wait for list to render
    await waitFor(() => expect(artistTopForPlaylist).toHaveBeenCalledWith('tok-1', 'pl-123', 5));

    // wait for loading indicator to be removed, then verify enriched items
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);

    // first item contains image, name and tracks and link
    const first = items[0];
    expect(first).toHaveTextContent('1. Artist A');
    expect(first).toHaveTextContent('3 tracks');
    expect(first.querySelector('img')).toHaveAttribute('src', 'i2');
    expect(first.querySelector('a.artist-link')).toHaveAttribute('href', 'https://sptfy/a');

    const second = items[1];
    expect(second).toHaveTextContent('2. Artist B');
    expect(second).toHaveTextContent('1 track');
    // second has no image (images empty), so img absent
    expect(second.querySelector('img')).toBeNull();
  });

  test('shows error when artistTopForPlaylist throws', async () => {
    artistTopForPlaylist.mockRejectedValue(new Error('boom'));
    render(<TopArtistPage />);
    fireEvent.change(screen.getByPlaceholderText(/Enter playlist id/i), { target: { value: 'p' } });
    fireEvent.click(screen.getByRole('button', { name: /Top artists/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/boom/);
  });

  test('button disabled when token missing', () => {
    useRequireToken.mockReturnValue({ token: null, checking: false });
    render(<TopArtistPage />);
    fireEvent.change(screen.getByPlaceholderText(/Enter playlist id/i), { target: { value: 'pl' } });
    const btn = screen.getByRole('button', { name: /Top artists/i });
    expect(btn).toBeDisabled();
  });
});
