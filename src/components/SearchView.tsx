import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Search, X } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { GENRE_CATEGORIES } from '../data/musicData';
import { CoverImage } from './CoverImage';
import { TrackRow } from './TrackRow';

interface SearchViewProps {
  initialGenre?: string;
}

export function SearchView({ initialGenre }: SearchViewProps) {
  const {
    tracks,
    allPlaylists,
    currentPlaylistId,
    isPlaying,
    playPlaylist,
    setActiveView,
  } = usePlayer();

  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(initialGenre ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedGenre(initialGenre ?? null);
  }, [initialGenre]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0 || selectedGenre !== null;

  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      const matchesGenre =
        !selectedGenre || track.genre.toLowerCase() === selectedGenre.toLowerCase();
      if (!matchesGenre) return false;

      if (!normalizedQuery) return true;
      return (
        track.title.toLowerCase().includes(normalizedQuery) ||
        track.artist.toLowerCase().includes(normalizedQuery) ||
        track.album.toLowerCase().includes(normalizedQuery) ||
        track.genre.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [tracks, normalizedQuery, selectedGenre]);

  const filteredPlaylists = useMemo(() => {
    if (!normalizedQuery) return [];
    return allPlaylists.filter(
      (pl) =>
        pl.title.toLowerCase().includes(normalizedQuery) ||
        pl.description.toLowerCase().includes(normalizedQuery) ||
        pl.category.toLowerCase().includes(normalizedQuery)
    );
  }, [allPlaylists, normalizedQuery]);

  const filteredTrackIds = useMemo(
    () => filteredTracks.map((t) => t.id),
    [filteredTracks]
  );

  const resetFilters = () => {
    setQuery('');
    setSelectedGenre(null);
    inputRef.current?.focus();
  };

  return (
    <div className="px-6 md:px-8 pt-4 pb-12 space-y-8">
      {/* Search Header & Input */}
      <section aria-label="Search music">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-5">
          Search
        </h1>

        <div className="relative max-w-xl">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA] pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to listen to? Search songs, artists, genres..."
            aria-label="Search songs, artists, albums, or genres"
            className="w-full pl-12 pr-11 py-3 rounded-full bg-[#201F22] border border-white/10 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#1ED760] focus:bg-[#2A2A2C] transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search query"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Genre Quick Filter Strip */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setSelectedGenre(null)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              selectedGenre === null
                ? 'bg-white text-[#09090B]'
                : 'bg-[#201F22] text-[#A1A1AA] hover:text-white hover:bg-[#2A2A2C]'
            }`}
          >
            All Genres
          </button>
          {GENRE_CATEGORIES.map((genre) => {
            const active = selectedGenre?.toLowerCase() === genre.id.toLowerCase();
            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => setSelectedGenre(active ? null : genre.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#1ED760] text-[#003913]'
                    : 'bg-[#201F22] text-[#A1A1AA] hover:text-white hover:bg-[#2A2A2C]'
                }`}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Genre Browse Grid (when not actively filtering) */}
      {!isFiltering && (
        <section aria-labelledby="browse-genres-heading">
          <h2
            id="browse-genres-heading"
            className="font-display text-xl font-semibold tracking-tight text-white mb-4"
          >
            Browse Genres
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {GENRE_CATEGORIES.map((genre) => (
              <button
                key={genre.id}
                type="button"
                onClick={() => setSelectedGenre(genre.id)}
                className="group relative rounded-xl overflow-hidden bg-[#1C1B1D] border border-white/[0.06] p-4 text-left h-36 flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[#1ED760]"
                style={{
                  backgroundImage: `radial-gradient(circle at 100% 100%, ${genre.accentColor}40, transparent 70%)`,
                }}
              >
                <div>
                  <div className="font-display text-base font-bold text-white">
                    {genre.name}
                  </div>
                  <div className="text-xs text-[#A1A1AA] mt-0.5">{genre.subtitle}</div>
                </div>
                <div className="self-end w-12 h-12 rounded-md overflow-hidden rotate-6 shadow-lg opacity-85 group-hover:opacity-100 group-hover:rotate-3 transition-all">
                  <CoverImage
                    src={genre.coverUrl}
                    alt={genre.name}
                    accentColor={genre.accentColor}
                    className="w-full h-full"
                  />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Matching Playlists */}
      {filteredPlaylists.length > 0 && (
        <section aria-labelledby="search-playlists-heading">
          <h2
            id="search-playlists-heading"
            className="font-display text-lg font-semibold text-white mb-3"
          >
            Playlists
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPlaylists.map((playlist) => {
              const isThisPlaying = currentPlaylistId === playlist.id && isPlaying;
              return (
                <div
                  key={playlist.id}
                  onClick={() => setActiveView({ type: 'playlist', playlistId: playlist.id })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setActiveView({ type: 'playlist', playlistId: playlist.id });
                    }
                  }}
                  className="group p-3.5 rounded-xl bg-[#1C1B1D] hover:bg-[#2A2A2C] border border-white/[0.05] transition-colors cursor-pointer"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                    <CoverImage
                      src={playlist.coverUrl}
                      alt={playlist.title}
                      accentColor={playlist.accentColor}
                      className="w-full h-full"
                    />
                    {playlist.trackIds.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playPlaylist(playlist.id);
                        }}
                        aria-label={`${isThisPlaying ? 'Pause' : 'Play'} ${playlist.title}`}
                        className="absolute right-2 bottom-2 w-10 h-10 rounded-full flex items-center justify-center bg-[#1ED760] text-[#003913] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {isThisPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    {playlist.title}
                  </div>
                  <div className="text-xs text-[#A1A1AA] truncate">
                    {playlist.trackIds.length} songs
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Matching Tracks */}
      <section aria-labelledby="search-tracks-heading">
        <div className="flex items-baseline justify-between mb-3">
          <h2
            id="search-tracks-heading"
            className="font-display text-lg font-semibold text-white"
          >
            {selectedGenre ? `${selectedGenre} Tracks` : isFiltering ? 'Songs' : 'All Tracks'}
          </h2>
          <span className="text-xs text-[#A1A1AA] tabular-nums">
            {filteredTracks.length} {filteredTracks.length === 1 ? 'result' : 'results'}
          </span>
        </div>

        {filteredTracks.length === 0 ? (
          <div className="rounded-xl bg-[#1C1B1D] border border-white/[0.06] py-12 px-6 text-center">
            <p className="text-base font-medium text-white mb-1">
              No matching tracks found
            </p>
            <p className="text-sm text-[#A1A1AA] mb-4">
              Try a different song title, artist name, or clear your genre filter.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-white text-[#09090B] hover:bg-white/90 transition-colors"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredTracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                contextQueueIds={filteredTrackIds}
                contextLabel={selectedGenre ? `${selectedGenre} Mix` : 'Search Results'}
                contextPlaylistId={null}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
