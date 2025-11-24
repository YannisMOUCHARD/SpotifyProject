// src/components/TopArtistItem/TopArtistItem.test.jsx

import { describe, expect, test } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import TopArtistItem from './TopArtistItem';

describe('TopArtistItem component', () => {
    test('renders artist information correctly', () => {
        const artist = {
            id: 'artist1',
            name: 'Test Artist',
            images: [{ url: 'test.jpg' }, { url: 'test-medium.jpg' }, { url: 'test-small.jpg' }],
            genres: ['pop', 'rock'],
            followers: { total: 100 },
            popularity: 85,
            external_urls: { spotify: 'https://open.spotify.com/artist/artist1' }
        };
        render(<TopArtistItem artist={artist} index={0} />);

        // Verify list item rendering and having expected content
        const listItem = screen.getByTestId(`top-artist-item-${artist.id}`);
        expect(listItem).toBeInTheDocument();

        // should contain artist image (use alt text)
        const img = within(listItem).getByAltText(artist.name);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', artist.images[1].url);

        // details assertions - verify with index + 1 format
        expect(listItem).toHaveTextContent('1. Test Artist');
        expect(listItem).toHaveTextContent(`Genres: ${artist.genres.join(', ')}`);
        // assert followers label and the raw number appear (formatting may vary by locale)
        expect(listItem).toHaveTextContent(/Followers:/);
        const digitsPattern = String(artist.followers.total).split('').join('\\D*');
        expect(listItem).toHaveTextContent(new RegExp(digitsPattern));
        expect(listItem).toHaveTextContent(`Popularity: ${artist.popularity}`);

        // link to artist page
        const link = within(listItem).getByRole('link', { name: /view artist/i });
        expect(link).toHaveAttribute('href', artist.external_urls.spotify);
    });

    test('handles missing artist image gracefully', () => {
        const artist = {
            id: 'artist2',
            name: 'No Image Artist',
            genres: ['jazz'],
            images: [], // Empty array to test line 13 condition
            followers: { total: 500 },
            external_urls: { spotify: 'https://open.spotify.com/artist/artist2' }
        };
        render(<TopArtistItem artist={artist} index={1} />);

        // Verify list item rendering and having expected content
        const listItem = screen.getByTestId(`top-artist-item-${artist.id}`);
        expect(listItem).toBeInTheDocument();

        // should not contain artist image (query by alt)
        expect(within(listItem).queryByAltText(artist.name)).not.toBeInTheDocument();

        // details assertions - verify with index + 1 format
        expect(listItem).toHaveTextContent('2. No Image Artist');
        expect(listItem).toHaveTextContent(`Genres: ${artist.genres.join(', ')}`);
        // assert followers label and the raw number appear (formatting may vary by locale)
        expect(listItem).toHaveTextContent(/Followers:/);
        const digitsPattern2 = String(artist.followers.total).split('').join('\\D*');
        expect(listItem).toHaveTextContent(new RegExp(digitsPattern2));

        // link to artist page
        const link = within(listItem).getByRole('link', { name: /view artist/i });
        expect(link).toHaveAttribute('href', artist.external_urls.spotify);
    });

    test('handles missing external URLs gracefully', () => {
        const artist = {
            id: 'artist3',
            name: 'No URL Artist',
            images: [{ url: 'test.jpg' }, { url: 'test-medium.jpg' }],
            genres: ['rock'],
            followers: { total: 1000 },
            popularity: 75,
            external_urls: null // Test line 32 condition
        };
        render(<TopArtistItem artist={artist} index={2} />);

        const listItem = screen.getByTestId(`top-artist-item-${artist.id}`);
        expect(listItem).toBeInTheDocument();

        // should not contain spotify link
        expect(within(listItem).queryByRole('link')).not.toBeInTheDocument();

        // verify other content is still rendered
        expect(listItem).toHaveTextContent('3. No URL Artist');
    });

    test('handles zero followers correctly', () => {
        const artist = {
            id: 'artist4',
            name: 'Zero Followers Artist',
            images: [{ url: 'test.jpg' }, { url: 'test-medium.jpg' }],
            genres: ['indie'],
            followers: { total: 0 }, // Test formatFollowers with 0
            popularity: 50,
            external_urls: { spotify: 'https://open.spotify.com/artist/artist4' }
        };
        render(<TopArtistItem artist={artist} index={3} />);

        const listItem = screen.getByTestId(`top-artist-item-${artist.id}`);
        expect(listItem).toHaveTextContent('Followers: 0');
    });

    test('handles null followers correctly', () => {
        const artist = {
            id: 'artist5',
            name: 'Null Followers Artist',
            images: [{ url: 'test.jpg' }, { url: 'test-medium.jpg' }],
            genres: ['classical'],
            followers: null, // Test formatFollowers with null
            popularity: 60,
            external_urls: { spotify: 'https://open.spotify.com/artist/artist5' }
        };
        render(<TopArtistItem artist={artist} index={4} />);

        const listItem = screen.getByTestId(`top-artist-item-${artist.id}`);
        expect(listItem).toHaveTextContent('Followers: 0');
    });
});