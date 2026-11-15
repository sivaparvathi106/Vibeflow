import { Heart, Play, X } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { getTrackById } from '../data/musicData';
import type { Track } from '../types/music';
import { formatTime } from '../utils/formatTime';
import { CoverImage } from './CoverImage';

export function NowPlayingPanel() {
  const {
    currentTrack,
    currentContextLabel,
    currentPlaylistId,
    queueIds,
    isNowPlayingOpen,
    setIsNowPlayingOpen,
    isTrackLiked,
    toggleLike,
    playTrack,
    setActiveView,
  } = usePlayer();

  if (!isNowPlayingOpen) return null;

  const liked = isTrackLiked(currentTrack.id);

  // Build upcoming queue after current track
  const currentIdx = queueIds.indexOf(currentTrack.id);
  const orderedUpcomingIds =
    currentIdx >= 0
      ? [...queueIds.slice(currentIdx + 1), ...queueIds.slice(0, currentIdx)]
      : queueIds.filter((id) => id !== currentTrack.id);

  const upcomingTracks = orderedUpcomingIds
    .map((id) => getTrackById(id))
    .filter((t): t is Track => Boolean(t))
    .slice(0, 6);

  const panelContent = (
    <div className="flex flex-col h-full bg-[#0E0E10] border-l border-white/[0.06] overflow-y-auto">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (currentPlaylistId) {
              setActiveView({ type: 'playlist', playlistId: currentPlaylistId });
            }
          }}
          className={`text-xs font-semibold tracking-wide uppercase truncate text-left ${
            currentPlaylistId
              ? 'text-[#E5E1E4] hover:text-[#1ED760] transition-colors'
              : 'text-[#A1A1AA] cursor-default'
          }`}
        >
          {currentContextLabel}
        </button>

        <button
          type="button"
          onClick={() => setIsNowPlayingOpen(false)}
          aria-label="Close Now Playing panel"
          className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Track Artwork & Details */}
      <div className="px-5 pb-6 space-y-4">
        <div
          className="relative aspect-square w-full rounded-xl overflow-hidden shadow-2xl border border-white/10"
          style={{
            boxShadow: `0 20px 45px -16px ${currentTrack.accentColor}55`,
          }}
        >
          <CoverImage
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            accentColor={currentTrack.accentColor}
            className="w-full h-full"
          />
        </div>

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-white truncate">
              {currentTrack.title}
            </h2>
            <p className="text-sm text-[#A1A1AA] truncate">
              {currentTrack.artist}
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggleLike(currentTrack.id)}
            aria-label={liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
            className={`p-2 rounded-full transition-colors shrink-0 ${
              liked
                ? 'text-[#1ED760]'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/10'
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Clean Unboxed Track Telemetry */}
        <div className="flex items-center gap-2 text-xs text-[#A1A1AA] tabular-nums pt-1 border-t border-white/[0.06]">
          <span>{currentTrack.genre}</span>
          <span aria-hidden="true">·</span>
          <span>{currentTrack.bpm} BPM</span>
          <span aria-hidden="true">·</span>
          <span>{currentTrack.musicalKey}</span>
        </div>
      </div>

      {/* Up Next Queue */}
      <div className="px-5 pb-6 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
            Up Next
          </h3>
          <span className="text-xs text-[#A1A1AA] tabular-nums">
            {upcomingTracks.length} queued
          </span>
        </div>

        {upcomingTracks.length === 0 ? (
          <p className="text-xs text-[#A1A1AA] py-4">
            End of current queue.
          </p>
        ) : (
          <div className="space-y-1.5">
            {upcomingTracks.map((trk) => (
              <button
                key={trk.id}
                type="button"
                onClick={() =>
                  playTrack(trk.id, queueIds, currentContextLabel, currentPlaylistId)
                }
                className="group w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-left"
              >
                <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0">
                  <CoverImage
                    src={trk.coverUrl}
                    alt={trk.title}
                    accentColor={trk.accentColor}
                    className="w-full h-full"
                  />
                  <span className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-white truncate">
                    {trk.title}
                  </div>
                  <div className="text-[11px] text-[#A1A1AA] truncate">
                    {trk.artist}
                  </div>
                </div>

                <span className="text-[11px] text-[#A1A1AA] tabular-nums shrink-0">
                  {formatTime(trk.durationSec)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Docked Right Panel */}
      <aside className="hidden xl:block w-80 shrink-0 h-full">
        {panelContent}
      </aside>

      {/* Tablet / Mobile Slide-Over Panel */}
      <div className="fixed inset-0 z-40 xl:hidden flex justify-end">
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          onClick={() => setIsNowPlayingOpen(false)}
          aria-hidden="true"
        />
        <aside className="relative w-80 max-w-[90vw] h-[calc(100%-88px)] z-10 shadow-2xl">
          {panelContent}
        </aside>
      </div>
    </>
  );
}
