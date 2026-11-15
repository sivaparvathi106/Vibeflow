import React, { useRef, useState } from 'react';
import { Clock, Heart, Pause, Play, Shuffle, Trash2, Upload } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import type { Track } from '../types/music';
import { formatTotalDuration } from '../utils/formatTime';
import { CoverImage } from './CoverImage';
import { TrackRow } from './TrackRow';

interface PlaylistViewProps {
  playlistId: string;
}

export function PlaylistView({ playlistId }: PlaylistViewProps) {
  const {
    allPlaylists,
    currentPlaylistId,
    isPlaying,
    isUploading,
    getTrackById,
    isTrackPlayable,
    playPlaylist,
    deletePlaylist,
    uploadAudioFiles,
    setActiveView,
  } = usePlayer();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const playlist = allPlaylists.find((p) => p.id === playlistId);

  if (!playlist) {
    return (
      <div className="px-8 py-16 text-center">
        <h2 className="font-display text-xl font-semibold text-white mb-2">
          Playlist not found
        </h2>
        <button
          type="button"
          onClick={() => setActiveView({ type: 'home' })}
          className="px-4 py-2 rounded-full text-xs font-semibold bg-[#1ED760] text-[#003913]"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const playlistTracks = playlist.trackIds
    .map((id) => getTrackById(id))
    .filter((t): t is Track => Boolean(t));

  const playableTracksCount = playlistTracks.filter((t) => isTrackPlayable(t)).length;
  const totalSeconds = playlistTracks.reduce((sum, t) => sum + t.durationSec, 0);
  const isThisPlaying = currentPlaylistId === playlist.id && isPlaying;
  const isLikedCollection = playlist.id === 'liked-songs';
  const isUploadsCollection = Boolean(playlist.isUploads);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void uploadAudioFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isUploadsCollection) return;
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void uploadAudioFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      className="pb-12"
      onDragOver={(e) => {
        if (isUploadsCollection) {
          e.preventDefault();
          setIsDragOver(true);
        }
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,audio/mpeg,audio/*"
        multiple
        onChange={handleFileInput}
        className="hidden"
        aria-label="Select MP3 files to upload"
      />

      {/* Playlist Ambient Hero */}
      <div
        className="px-6 md:px-8 pt-6 pb-8"
        style={{
          backgroundImage: `linear-gradient(180deg, ${playlist.accentColor}30 0%, rgba(19, 19, 21, 0) 100%)`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-6">
          {isLikedCollection ? (
            <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br from-[#6366F1] via-[#3131c0] to-[#1ED760] shadow-2xl">
              <Heart className="w-16 h-16 text-white fill-current" />
            </div>
          ) : isUploadsCollection ? (
            <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br from-[#1ED760]/30 via-[#201F22] to-[#0E0E10] border border-[#1ED760]/30 shadow-2xl">
              <Upload className="w-16 h-16 text-[#1ED760]" />
            </div>
          ) : (
            <CoverImage
              src={playlist.coverUrl}
              alt={playlist.title}
              accentColor={playlist.accentColor}
              className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl shrink-0 shadow-2xl border border-white/10"
            />
          )}

          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="text-xs font-semibold tracking-wider uppercase text-[#E5E1E4]/80">
              {playlist.category}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              {playlist.title}
            </h1>
            <p className="text-sm text-[#A1A1AA] max-w-2xl leading-relaxed">
              {playlist.description}
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-[#E5E1E4] tabular-nums pt-1">
              <span>VibeFlow</span>
              <span aria-hidden="true">·</span>
              <span>
                {playlistTracks.length}{' '}
                {playlistTracks.length === 1 ? 'song' : 'songs'}
              </span>
              {totalSeconds > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#A1A1AA]">
                    {formatTotalDuration(totalSeconds)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-7">
          <button
            type="button"
            disabled={playableTracksCount === 0}
            onClick={() => playPlaylist(playlist.id)}
            aria-label={isThisPlaying ? `Pause ${playlist.title}` : `Play ${playlist.title}`}
            className="w-13 h-13 rounded-full flex items-center justify-center bg-[#1ED760] text-[#003913] hover:bg-[#4cf479] hover:scale-105 disabled:opacity-35 disabled:pointer-events-none transition-all shadow-lg focus-visible:outline-2 focus-visible:outline-white"
          >
            {isThisPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            disabled={playableTracksCount === 0}
            onClick={() => playPlaylist(playlist.id, undefined, true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-white disabled:opacity-35 disabled:pointer-events-none transition-colors"
          >
            <Shuffle className="w-4 h-4 text-[#1ED760]" />
            <span>Shuffle Play</span>
          </button>

          {isUploadsCollection && (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1ED760]/15 hover:bg-[#1ED760]/25 border border-[#1ED760]/40 text-xs font-semibold text-[#1ED760] disabled:opacity-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Processing MP3...' : 'Upload MP3 Files'}</span>
            </button>
          )}

          {playlist.isCustom && (
            <button
              type="button"
              onClick={() => deletePlaylist(playlist.id)}
              aria-label={`Delete playlist ${playlist.title}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.04] hover:bg-[#93000a]/40 border border-white/10 text-xs font-medium text-[#A1A1AA] hover:text-[#ffb4ab] transition-colors ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Playlist</span>
            </button>
          )}
        </div>
      </div>

      {/* Tracklist Table */}
      <div className="px-6 md:px-8">
        {playlistTracks.length === 0 ? (
          <div
            className={`rounded-xl border py-12 px-6 text-center mt-2 transition-colors ${
              isDragOver
                ? 'bg-[#1ED760]/10 border-[#1ED760]'
                : 'bg-[#1C1B1D] border-white/[0.06]'
            }`}
          >
            <h2 className="font-display text-lg font-semibold text-white mb-1.5">
              {isLikedCollection
                ? 'No liked songs yet'
                : isUploadsCollection
                  ? 'Upload your own MP3 files'
                  : 'This playlist is empty'}
            </h2>
            <p className="text-sm text-[#A1A1AA] mb-5 max-w-md mx-auto">
              {isLikedCollection
                ? 'Tap the heart icon on any track while listening to collect your favorite songs here.'
                : isUploadsCollection
                  ? 'Drag and drop MP3 files here or choose files from your computer to play them right inside VibeFlow.'
                  : 'Use the playlist button on any track row to add songs to this mix.'}
            </p>
            {isUploadsCollection ? (
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#1ED760] text-[#003913] hover:bg-[#4cf479] transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Processing...' : 'Choose MP3 Files'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveView({ type: 'search' })}
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white text-[#09090B] hover:bg-white/90 transition-colors"
              >
                Find Tracks
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="grid grid-cols-[28px_minmax(0,2fr)_minmax(0,1.2fr)_auto] items-center gap-4 px-3 py-2 text-xs font-medium text-[#A1A1AA] border-b border-white/[0.08] mb-2">
              <span className="text-center">#</span>
              <span>Title</span>
              <span className="hidden md:block">Album</span>
              <span className="flex items-center justify-end pr-1" aria-label="Duration">
                <Clock className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-0.5">
              {playlistTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  contextQueueIds={playlist.trackIds}
                  contextLabel={playlist.title}
                  contextPlaylistId={playlist.id}
                  removablePlaylistId={playlist.isCustom ? playlist.id : undefined}
                  isUploadsPlaylist={isUploadsCollection}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
