import { afterEach, describe, expect, jest, test } from "@jest/globals";

import { fetchArtistByName } from "./spotify-artists";
import { SPOTIFY_API_BASE } from "./spotify-commons";

describe("spotify-artists API", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.clearAllMocks();
  });

  test("returns error if no token is provided", async () => {
    const result = await fetchArtistByName("");
    expect(result).toEqual({
      error: "No access token found.",
      data: null,
    });
  });

  test("returns artist on successful fetch", async () => {
    const mockArtist = { id: "artist1", name: "Artist One" };
    const response = { artists: { items: [mockArtist] } };
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(response),
    });

    const result = await fetchArtistByName("valid_token", "Artist One");

    const q = encodeURIComponent("Artist One");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${SPOTIFY_API_BASE}/search?q=${q}&type=artist&limit=1`,
      { headers: { Authorization: "Bearer valid_token" } }
    );

    expect(result).toEqual({ data: mockArtist, error: null });
  });

  test("returns error if Spotify API returns error in response", async () => {
    const mockError = { error: { message: "Invalid token" } };
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockError),
    });

    const result = await fetchArtistByName("invalid_token", "X");
    expect(result).toEqual({ error: "Invalid token", data: null });
  });

  test("returns error if fetch throws", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    const result = await fetchArtistByName("any_token", "X");
    expect(result).toEqual({ error: "Failed to fetch artist.", data: null });
  });
});
