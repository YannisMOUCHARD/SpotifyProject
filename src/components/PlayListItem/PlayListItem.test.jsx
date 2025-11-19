// src/components/PlayListItem.test.jsx

import { describe, expect, test } from '@jest/globals'
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlayListItem from './PlayListItem';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('PlayListItem component', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    test('renders playlist information correctly', () => {
        // Arrange
        const playlist = {
            id: 'playlist1',
            name: 'Test Playlist',
            images: [{ url: 'test.jpg' }],
            owner: { display_name: 'Test Owner' },
            tracks: { total: 15 },
            external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' }
        };
        // Act
        render(
            <MemoryRouter>
                <PlayListItem playlist={playlist} />
            </MemoryRouter>
        );

        // Assert
        // items are rendered correctly
        expect(screen.getByTestId(`playlist-item-${playlist.id}`)).toBeInTheDocument();
        // image is rendered correctly
        expect(screen.getByAltText('cover')).toHaveAttribute('src', playlist.images[0].url);
        // text content is rendered correctly
        expect(screen.getByText(playlist.name)).toBeInTheDocument();
        // owner name is rendered correctly
        expect(screen.getByText(`By ${playlist.owner.display_name}`)).toBeInTheDocument();
        // track count is rendered correctly
        expect(screen.getByText(`${playlist.tracks.total} tracks`)).toBeInTheDocument();
        // link is rendered correctly
        expect(screen.getByRole('link')).toHaveAttribute('href', playlist.external_urls.spotify);
    });

    test('navigates to playlist detail page on click', () => {
        const playlist = {
            id: 'playlist1',
            name: 'Test Playlist',
            images: [{ url: 'test.jpg' }],
            owner: { display_name: 'Test Owner' },
            tracks: { total: 15 },
            external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' }
        };

        render(
            <MemoryRouter>
                <PlayListItem playlist={playlist} />
            </MemoryRouter>
        );

        const playlistItem = screen.getByTestId(`playlist-item-${playlist.id}`);
        fireEvent.click(playlistItem);

        expect(mockNavigate).toHaveBeenCalledWith(`/playlist/${playlist.id}`);
    });

    test('navigates to playlist detail page on Enter key press', () => {
        const playlist = {
            id: 'playlist1',
            name: 'Test Playlist',
            images: [{ url: 'test.jpg' }],
            owner: { display_name: 'Test Owner' },
            tracks: { total: 15 },
            external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' }
        };

        render(
            <MemoryRouter>
                <PlayListItem playlist={playlist} />
            </MemoryRouter>
        );

        const playlistItem = screen.getByTestId(`playlist-item-${playlist.id}`);
        fireEvent.keyDown(playlistItem, { key: 'Enter' });

        expect(mockNavigate).toHaveBeenCalledWith(`/playlist/${playlist.id}`);
    });

    test('does not navigate on other key presses', () => {
        const playlist = {
            id: 'playlist1',
            name: 'Test Playlist',
            images: [{ url: 'test.jpg' }],
            owner: { display_name: 'Test Owner' },
            tracks: { total: 15 },
            external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' }
        };

        render(
            <MemoryRouter>
                <PlayListItem playlist={playlist} />
            </MemoryRouter>
        );

        const playlistItem = screen.getByTestId(`playlist-item-${playlist.id}`);
        fireEvent.keyDown(playlistItem, { key: 'Space' });

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('prevents event propagation when clicking Spotify link', () => {
        const playlist = {
            id: 'playlist1',
            name: 'Test Playlist',
            images: [{ url: 'test.jpg' }],
            owner: { display_name: 'Test Owner' },
            tracks: { total: 15 },
            external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' }
        };

        render(
            <MemoryRouter>
                <PlayListItem playlist={playlist} />
            </MemoryRouter>
        );

        const spotifyLink = screen.getByRole('link');
        fireEvent.click(spotifyLink);

        // Should not navigate to playlist detail when clicking Spotify link
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});