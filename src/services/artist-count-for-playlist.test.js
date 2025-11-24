import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { artistCountForPlaylist } from "./artist-count-for-playlist";

jest.mock("../api/spotify-playlists", () => ({
  fetchPlaylistById: jest.fn(),
}));

import { fetchPlaylistById } from "../api/spotify-playlists";

describe("artist-count-for-playlist service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("artistCountForPlaylist calls fetchPlaylistById with token and playlistId and returns counts", async () => {
    const mockData = {
      tracks: {
        items: [
          { track: { artists: [{ name: "A" }, { name: "B" }] } },
          { track: { artists: [{ name: "A" }] } },
          { track: { artists: [{ name: "C" }] } },
        ],
        next: null,
      },
    };

    fetchPlaylistById.mockResolvedValue({ data: mockData, error: null });

    const result = await artistCountForPlaylist("token123", "playlistX");

    expect(fetchPlaylistById).toHaveBeenCalledWith("token123", "playlistX");
    expect(result).toEqual({ A: 2, B: 1, C: 1 });
  });

  test("artistCountForPlaylist returns undefined and logs error when fetchPlaylistById rejects", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    fetchPlaylistById.mockRejectedValue(new Error("network"));

    const result = await artistCountForPlaylist("t", "p");

    expect(result).toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("artistCountForPlaylist follows pagination and aggregates counts from pages", async () => {
    const firstPage = {
      tracks: {
        items: [
          { track: { artists: [{ name: 'A' }] } },
          { track: { artists: [{ name: 'B' }] } },
        ],
        next: 'https://api.spotify.com/v1/playlists/playlistX/tracks?offset=2',
      },
    };

    // simulate fetchPlaylistById returning first page data
    fetchPlaylistById.mockResolvedValue({ data: firstPage, error: null });

    // mock global fetch for the paging URL
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ items: [ { track: { artists: [{ name: 'A' }] } } ], next: null }),
    });

    const result = await artistCountForPlaylist('token', 'playlistX');

    expect(result).toEqual({ A: 2, B: 1 });

    globalThis.fetch = originalFetch;
  });

  test('returns undefined and logs error when fetchPlaylistById returns error in response', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetchPlaylistById.mockResolvedValue({ data: null, error: 'Some error' });

    const result = await artistCountForPlaylist('token', 'playlistX');

    expect(result).toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('logs paging error when page fetch rejects and continues with first page items', async () => {
    const firstPage = {
      tracks: {
        items: [ { track: { artists: [{ name: 'A' }] } }, { track: { artists: [{ name: 'B' }] } } ],
        next: 'https://api.spotify.com/v1/playlists/playlistX/tracks?offset=2',
      },
    };
    fetchPlaylistById.mockResolvedValue({ data: firstPage, error: null });

    const originalFetch = globalThis.fetch;
    // make fetch reject to trigger paging catch branch
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('network')); 

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await artistCountForPlaylist('token', 'playlistX');

    // should return counts from first page only
    expect(result).toEqual({ A: 1, B: 1 });
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
    globalThis.fetch = originalFetch;
  });

  test('counts artist with missing name as Unknown', async () => {
    const mockData = {
      tracks: {
        items: [ { track: { artists: [ {} ] } }, { track: { artists: [ { name: 'X' } ] } } ],
        next: null,
      },
    };
    fetchPlaylistById.mockResolvedValue({ data: mockData, error: null });

    const result = await artistCountForPlaylist('token', 'playlistX');
    expect(result).toEqual({ Unknown: 1, X: 1 });
  });

  test('handles page response containing error object (throws then caught) and continues', async () => {
    const firstPage = {
      tracks: {
        items: [ { track: { artists: [{ name: 'P' }] } } ],
        next: 'https://api.spotify.com/v1/playlists/playlistX/tracks?offset=1',
      },
    };

    fetchPlaylistById.mockResolvedValue({ data: firstPage, error: null });

    const originalFetch = globalThis.fetch;
    // mock fetch to return a page that contains an error property
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ error: { message: 'Bad page' } }),
    });

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await artistCountForPlaylist('token', 'playlistX');

    // it should return counts from the first page and log a paging error
    expect(result).toEqual({ P: 1 });
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
    globalThis.fetch = originalFetch;
  });

  test("artistTopForPlaylist returns top N sorted artists", async () => {
    const mod = await import('./artist-count-for-playlist');
    const mockCounts = { A: 4, B: 2, C: 3 };

    // Pass countsOverride to avoid spying on same-module bindings
    const top2 = await mod.artistTopForPlaylist('token', 'playlistX', 2, mockCounts);
    expect(top2).toEqual([
      { Artist: 'A', Tracks: 4 },
      { Artist: 'C', Tracks: 3 },
    ]);
  });

  test('returns empty counts when data.tracks is missing', async () => {
    fetchPlaylistById.mockResolvedValue({ data: {}, error: null });
    const result = await artistCountForPlaylist('token', 'playlistX');
    expect(result).toEqual({});
  });

  test('skips items without track property', async () => {
    const mockData = { tracks: { items: [ {}, { track: null }, { track: { artists: [{ name: 'Y' }] } } ], next: null } };
    fetchPlaylistById.mockResolvedValue({ data: mockData, error: null });
    const result = await artistCountForPlaylist('token', 'playlistX');
    expect(result).toEqual({ Y: 1 });
  });

  test('artistTopForPlaylist returns empty array when no counts', async () => {
    const mod = await import('./artist-count-for-playlist');
    // countsOverride null and fetch returns no tracks => counts {}
    fetchPlaylistById.mockResolvedValue({ data: {}, error: null });
    const top = await mod.artistTopForPlaylist('token', 'playlistX', 5);
    expect(top).toEqual([]);
  });
});
