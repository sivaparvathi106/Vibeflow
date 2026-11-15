import { Heart, Pause, Play, Upload } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { CoverImage } from './CoverImage';
import { TrackRow } from './TrackRow';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomeView() {
  const {
    allPlaylists,
    systemPlaylists,
    tracks,
    currentPlaylistId,
    isPlaying,
    playPlaylist,
    setActiveView,
  } = usePlayer();

  const quickPicks = allPlaylists.slice(0, 6);
  const featuredTracks = tracks.slice(0, 8);
  const featuredTrackIds = featuredTracks.map((t) => t.id);

  return (
    <div className="px-6 md:px-8 pt-4 pb-12 space-y-10">
      {/* Greeting & Quick-Pick Grid */}
      <section aria-labelledby="home-greeting">
        <h1
          id="home-greeting"
          className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-5"
        >
          {getGreeting()}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {quickPicks.map((playlist) => {
            const isThisPlaying = currentPlaylistId === playlist.id && isPlaying;
            const isLiked = playlist.id === 'liked-songs';
            const isUploads = Boolean(playlist.isUploads);

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
                className="group relative flex items-center gap-3.5 rounded-lg bg-[#201F22]/75 hover:bg-[#2A2A2C] border border-white/[0.05] overflow-hidden pr-3 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1ED760]"
              >
                {isLiked ? (
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-gradient-to-br from-[#6366F1] to-[#1ED760]">
                    <Heart className="w-6 h-6 text-white fill-current" />
                  </div>
                ) : isUploads ? (
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-gradient-to-br from-[#1ED760]/30 to-[#201F22] border-r border-white/[0.06]">
                    <Upload className="w-6 h-6 text-[#1ED760]" />
                  </div>
                ) : (
                  <CoverImage
                    src={playlist.coverUrl}
                    alt={playlist.title}
                    accentColor={playlist.accentColor}
                    className="w-16 h-16 shrink-0"
                  />
                )}

                <div className="min-w-0 flex-1 py-2">
                  <div className="text-sm font-semibold text-white truncate">
                    {playlist.title}
                  </div>
                  <div className="text-xs text-[#A1A1AA] truncate tabular-nums">
                    {playlist.trackIds.length}{' '}
                    {playlist.trackIds.length === 1 ? 'track' : 'tracks'}
                  </div>
                </div>

                {playlist.trackIds.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playPlaylist(playlist.id);
                    }}
                    aria-label={`${isThisPlaying ? 'Pause' : 'Play'} ${playlist.title}`}
                    className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#1ED760] text-[#003913] shadow-lg transition-all duration-150 hover:scale-105 hover:bg-[#4cf479] focus-visible:outline-2 focus-visible:outline-white ${
                      isThisPlaying
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 focus:opacity-100'
                    }`}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Curated Playlists */}
      <section aria-labelledby="curated-playlists-heading">
        <div className="flex items-baseline justify-between mb-4">
          <h2
            id="curated-playlists-heading"
            className="font-display text-xl font-semibold tracking-tight text-white"
          >
            Curated Playlists
          </h2>
          <button
            type="button"
            onClick={() => setActiveView({ type: 'search' })}
            className="text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors"
          >
            Browse all
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {systemPlaylists.map((playlist) => {
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
                className="group p-3.5 rounded-xl bg-[#1C1B1D] hover:bg-[#2A2A2C]/90 border border-white/[0.04] transition-colors duration-150 cursor-pointer flex flex-col focus-visible:outline-2 focus-visible:outline-[#1ED760]"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3.5 shadow-md">
                  <CoverImage
                    src={playlist.coverUrl}
                    alt={playlist.title}
                    accentColor={playlist.accentColor}
                    className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]"
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playPlaylist(playlist.id);
                    }}
                    aria-label={`${isThisPlaying ? 'Pause' : 'Play'} ${playlist.title}`}
                    className={`absolute right-2.5 bottom-2.5 w-11 h-11 rounded-full flex items-center justify-center bg-[#1ED760] text-[#003913] shadow-xl transition-all duration-200 hover:scale-105 hover:bg-[#4cf479] focus-visible:outline-2 focus-visible:outline-white ${
                      isThisPlaying
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus:opacity-100'
                    }`}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>
                </div>

                <div className="text-sm font-semibold text-white truncate mb-1">
                  {playlist.title}
                </div>
                <p className="text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed">
                  {playlist.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Popular Tracks */}
      <section aria-labelledby="popular-tracks-heading">
        <div className="flex items-baseline justify-between mb-3">
          <h2
            id="popular-tracks-heading"
            className="font-display text-xl font-semibold tracking-tight text-white"
          >
            Popular Right Now
          </h2>
          <span className="text-xs text-[#A1A1AA] tabular-nums">
            {featuredTracks.length} tracks
          </span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {featuredTracks.map((track, idx) => (
            <TrackRow
              key={track.id}
              track={track}
              index={idx}
              contextQueueIds={featuredTrackIds}
              contextLabel="Popular Right Now"
              contextPlaylistId={null}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
