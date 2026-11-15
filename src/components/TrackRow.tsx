import { useEffect, useRef, useState } from 'react';
import { Check, Heart, ListPlus, Pause, Play, Plus, Trash2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import type { Track } from '../types/music';
import { formatTime } from '../utils/formatTime';
import { CoverImage } from './CoverImage';
import { EqualizerIcon } from './EqualizerIcon';

interface TrackRowProps {
  track: Track;
  index: number;
  contextQueueIds: string[];
  contextLabel: string;
  contextPlaylistId?: string | null;
  showAlbum?: boolean;
  removablePlaylistId?: string;
}

export function TrackRow({
  track,
  index,
  contextQueueIds,
  contextLabel,
  contextPlaylistId = null,
  showAlbum = true,
  removablePlaylistId,
}: TrackRowProps) {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlayPause,
    toggleLike,
    isTrackLiked,
    customPlaylists,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    setIsCreateModalOpen,
  } = usePlayer();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = currentTrack.id === track.id;
  const liked = isTrackLiked(track.id);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleRowAction = () => {
    if (isActive) {
      togglePlayPause();
    } else {
      playTrack(track.id, contextQueueIds, contextLabel, contextPlaylistId);
    }
  };

  return (
    <div
      onClick={handleRowAction}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleRowAction();
        }
      }}
      className={`group grid items-center gap-4 px-3 py-2.5 rounded-lg transition-colors duration-150 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#1ED760] ${
        showAlbum
          ? 'grid-cols-[28px_minmax(0,2fr)_minmax(0,1.2fr)_auto]'
          : 'grid-cols-[28px_minmax(0,1fr)_auto]'
      } ${
        isActive
          ? 'bg-white/[0.08]'
          : 'hover:bg-white/[0.05]'
      }`}
      aria-label={`${isActive && isPlaying ? 'Pause' : 'Play'} ${track.title} by ${track.artist}`}
    >
      {/* Index / Equalizer / Play-Pause Hover Control */}
      <div className="flex items-center justify-center w-7 h-7">
        {isActive ? (
          <>
            <span className="group-hover:hidden flex items-center justify-center">
              <EqualizerIcon isPlaying={isPlaying} />
            </span>
            <span className="hidden group-hover:flex items-center justify-center text-white">
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </span>
          </>
        ) : (
          <>
            <span className="text-sm text-[#A1A1AA] tabular-nums group-hover:hidden">
              {index + 1}
            </span>
            <span className="hidden group-hover:flex items-center justify-center text-white">
              <Play className="w-4 h-4 fill-current" />
            </span>
          </>
        )}
      </div>

      {/* Cover + Title + Artist */}
      <div className="flex items-center gap-3 min-w-0">
        <CoverImage
          src={track.coverUrl}
          alt={track.title}
          accentColor={track.accentColor}
          className="w-10 h-10 rounded-md shrink-0"
        />
        <div className="min-w-0">
          <div
            className={`text-sm font-medium truncate transition-colors ${
              isActive ? 'text-[#1ED760]' : 'text-white group-hover:text-white'
            }`}
          >
            {track.title}
          </div>
          <div className="text-xs text-[#A1A1AA] truncate">
            {track.artist}
          </div>
        </div>
      </div>

      {/* Album & Genre */}
      {showAlbum && (
        <div className="hidden md:block min-w-0 text-sm text-[#A1A1AA] truncate">
          {track.album}
        </div>
      )}

      {/* Actions & Duration */}
      <div
        className="flex items-center justify-end gap-2 sm:gap-3 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => toggleLike(track.id)}
          aria-label={liked ? `Remove ${track.title} from Liked Songs` : `Save ${track.title} to Liked Songs`}
          className={`p-1.5 rounded-md transition-all focus-visible:outline-2 focus-visible:outline-[#1ED760] ${
            liked
              ? 'text-[#1ED760] opacity-100'
              : 'text-[#A1A1AA] opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
        </button>

        {/* Add to custom playlist or remove from current custom playlist */}
        <div className="relative" ref={menuRef}>
          {removablePlaylistId ? (
            <button
              type="button"
              onClick={() => removeTrackFromPlaylist(removablePlaylistId, track.id)}
              aria-label={`Remove ${track.title} from playlist`}
              className="p-1.5 rounded-md text-[#A1A1AA] opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-[#ffb4ab] transition-all focus-visible:outline-2 focus-visible:outline-[#1ED760]"
              title="Remove from playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={`Add ${track.title} to playlist`}
              className="p-1.5 rounded-md text-[#A1A1AA] opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-white transition-all focus-visible:outline-2 focus-visible:outline-[#1ED760]"
              title="Add to playlist"
            >
              <ListPlus className="w-4 h-4" />
            </button>
          )}

          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1.5 w-52 rounded-xl bg-[#201F22] border border-white/10 shadow-2xl py-1.5 z-40">
              <div className="px-3 py-1.5 text-xs font-medium text-[#A1A1AA] border-b border-white/5">
                Add to playlist
              </div>
              {customPlaylists.length === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white hover:bg-white/10 transition-colors text-left"
                >
                  <Plus className="w-3.5 h-3.5 text-[#1ED760]" />
                  Create new playlist
                </button>
              ) : (
                <div className="max-h-44 overflow-y-auto py-1">
                  {customPlaylists.map((pl) => {
                    const alreadyIn = pl.trackIds.includes(track.id);
                    return (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => {
                          if (!alreadyIn) {
                            addTrackToPlaylist(pl.id, track.id);
                          }
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-[#E5E1E4] hover:bg-white/10 transition-colors text-left"
                      >
                        <span className="truncate">{pl.title}</span>
                        {alreadyIn && <Check className="w-3.5 h-3.5 text-[#1ED760] shrink-0" />}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setIsCreateModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1ED760] hover:bg-white/10 transition-colors text-left border-t border-white/5 mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New playlist
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <span className="w-11 text-right text-xs text-[#A1A1AA] tabular-nums">
          {formatTime(track.durationSec)}
        </span>
      </div>
    </div>
  );
}
