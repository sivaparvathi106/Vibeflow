import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Heart,
  ListMusic,
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from '../utils/formatTime';
import { CoverImage } from './CoverImage';

export function PlayerBar() {
  const {
    currentTrack,
    currentPlaylistId,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    isNowPlayingOpen,
    setIsNowPlayingOpen,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    toggleLike,
    isTrackLiked,
    setActiveView,
  } = usePlayer();

  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [dragProgressTime, setDragProgressTime] = useState<number | null>(null);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  const liked = isTrackLiked(currentTrack.id);
  const displayedTime = dragProgressTime !== null ? dragProgressTime : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (displayedTime / duration) * 100)) : 0;
  const effectiveVolume = isMuted ? 0 : volume;
  const volumePercent = Math.round(effectiveVolume * 100);

  const calcRatioFromClientX = (el: HTMLDivElement | null, clientX: number) => {
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  // Drag seeking handlers
  useEffect(() => {
    if (!isSeeking) return;
    const handleMove = (e: PointerEvent) => {
      const ratio = calcRatioFromClientX(progressBarRef.current, e.clientX);
      setDragProgressTime(ratio * duration);
    };
    const handleUp = (e: PointerEvent) => {
      const ratio = calcRatioFromClientX(progressBarRef.current, e.clientX);
      seekTo(ratio * duration);
      setIsSeeking(false);
      setDragProgressTime(null);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [duration, isSeeking, seekTo]);

  // Drag volume handlers
  useEffect(() => {
    if (!isDraggingVolume) return;
    const handleMove = (e: PointerEvent) => {
      const ratio = calcRatioFromClientX(volumeBarRef.current, e.clientX);
      setVolume(ratio);
    };
    const handleUp = (e: PointerEvent) => {
      const ratio = calcRatioFromClientX(volumeBarRef.current, e.clientX);
      setVolume(ratio);
      setIsDraggingVolume(false);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDraggingVolume, setVolume]);

  const handleProgressPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const ratio = calcRatioFromClientX(progressBarRef.current, e.clientX);
    setDragProgressTime(ratio * duration);
    setIsSeeking(true);
  };

  const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const ratio = calcRatioFromClientX(volumeBarRef.current, e.clientX);
    setVolume(ratio);
    setIsDraggingVolume(true);
  };

  const handleProgressKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        seekTo(currentTime + 5);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seekTo(currentTime - 5);
      }
    },
    [currentTime, seekTo]
  );

  const VolumeIcon =
    effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;

  return (
    <footer
      aria-label="Audio player controls"
      className="h-[88px] shrink-0 bg-[#09090B]/95 backdrop-blur-xl border-t border-white/[0.08] px-3 sm:px-5 flex items-center justify-between gap-3 sm:gap-6 z-30 select-none"
    >
      {/* Left: Active Track Identity */}
      <div className="flex items-center gap-3 min-w-0 w-[30%] max-w-[280px]">
        <button
          type="button"
          onClick={() => {
            if (currentPlaylistId) {
              setActiveView({ type: 'playlist', playlistId: currentPlaylistId });
            }
          }}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 border border-white/10 hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-[#1ED760]"
          aria-label={`View playlist for ${currentTrack.title}`}
        >
          <CoverImage
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            accentColor={currentTrack.accentColor}
            className="w-full h-full"
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white truncate">
            {currentTrack.title}
          </div>
          <div className="text-xs text-[#A1A1AA] truncate">
            {currentTrack.artist}
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleLike(currentTrack.id)}
          aria-label={liked ? 'Unlike current track' : 'Like current track'}
          className={`hidden sm:flex p-1.5 rounded-full transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-[#1ED760] ${
            liked ? 'text-[#1ED760]' : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Center: Playback Controls & Progress Seek Bar */}
      <div className="flex flex-col items-center justify-center flex-1 max-w-xl gap-1.5">
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label={isShuffle ? 'Disable shuffle' : 'Enable shuffle'}
            aria-pressed={isShuffle}
            className={`relative p-1.5 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-[#1ED760] ${
              isShuffle ? 'text-[#1ED760]' : 'text-[#A1A1AA] hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={prevTrack}
            aria-label="Previous track"
            className="p-1.5 rounded-full text-[#E5E1E4] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[#1ED760]"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white text-[#09090B] hover:scale-105 active:scale-95 transition-transform focus-visible:outline-2 focus-visible:outline-[#1ED760]"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isBuffering && isPlaying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={nextTrack}
            aria-label="Next track"
            className="p-1.5 rounded-full text-[#E5E1E4] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[#1ED760]"
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            type="button"
            onClick={cycleRepeatMode}
            aria-label={`Repeat mode: ${repeatMode}`}
            className={`relative p-1.5 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-[#1ED760] ${
              repeatMode !== 'off'
                ? 'text-[#1ED760]'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Interactive Scrub Bar */}
        <div className="w-full flex items-center gap-2.5">
          <span className="text-[11px] text-[#A1A1AA] tabular-nums w-9 text-right shrink-0">
            {formatTime(displayedTime)}
          </span>

          <div
            ref={progressBarRef}
            role="slider"
            tabIndex={0}
            aria-label="Playback progress"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(displayedTime)}
            onPointerDown={handleProgressPointerDown}
            onKeyDown={handleProgressKeyDown}
            className="group relative flex-1 h-4 flex items-center cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1ED760] rounded-full"
          >
            <div className="w-full h-1 rounded-full bg-white/15 overflow-hidden">
              <div
                className={`h-full rounded-full transition-colors ${
                  isSeeking ? 'bg-[#4cf479]' : 'bg-white group-hover:bg-[#1ED760]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-md transition-opacity ${
                isSeeking ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'
              }`}
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          <span className="text-[11px] text-[#A1A1AA] tabular-nums w-9 shrink-0">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Now Playing Toggle & Volume Controls */}
      <div className="hidden sm:flex items-center justify-end gap-3 w-[30%] max-w-[260px]">
        <button
          type="button"
          onClick={() => setIsNowPlayingOpen((prev) => !prev)}
          aria-label="Toggle Now Playing queue panel"
          aria-pressed={isNowPlayingOpen}
          title="Now Playing & Queue"
          className={`p-2 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[#1ED760] ${
            isNowPlayingOpen
              ? 'text-[#1ED760] bg-[#1ED760]/10'
              : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
          }`}
        >
          <ListMusic className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 w-28 md:w-32">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-[#1ED760]"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon className="w-4 h-4" />
          </button>

          <div
            ref={volumeBarRef}
            role="slider"
            tabIndex={0}
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={volumePercent}
            onPointerDown={handleVolumePointerDown}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                setVolume(effectiveVolume + 0.08);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                setVolume(effectiveVolume - 0.08);
              }
            }}
            className="group relative flex-1 h-4 flex items-center cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1ED760] rounded-full"
          >
            <div className="w-full h-1 rounded-full bg-white/15 overflow-hidden">
              <div
                className={`h-full rounded-full transition-colors ${
                  isDraggingVolume ? 'bg-[#4cf479]' : 'bg-white group-hover:bg-[#1ED760]'
                }`}
                style={{ width: `${volumePercent}%` }}
              />
            </div>
            <div
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md transition-opacity ${
                isDraggingVolume
                  ? 'opacity-100 scale-110'
                  : 'opacity-0 group-hover:opacity-100'
              }`}
              style={{ left: `${volumePercent}%` }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
