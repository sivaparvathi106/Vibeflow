import React, { useRef } from 'react';
import {
  AudioWaveform,
  Heart,
  Home,
  Library,
  Plus,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { CoverImage } from './CoverImage';
import { EqualizerIcon } from './EqualizerIcon';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const {
    activeView,
    setActiveView,
    allPlaylists,
    currentPlaylistId,
    isPlaying,
    isUploading,
    setIsCreateModalOpen,
    uploadAudioFiles,
  } = usePlayer();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigateTo = (view: Parameters<typeof setActiveView>[0]) => {
    setActiveView(view);
    onCloseMobile();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void uploadAudioFiles(e.target.files);
      e.target.value = '';
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0E0E10] border-r border-white/[0.06] select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,audio/mpeg,audio/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload MP3 files"
      />

      {/* Brand Wordmark */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <button
          type="button"
          onClick={() => navigateTo({ type: 'home' })}
          className="flex items-center gap-2.5 text-left group focus-visible:outline-2 focus-visible:outline-[#1ED760] rounded-md"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1ED760] text-[#003913] shrink-0">
            <AudioWaveform className="w-4 h-4 stroke-[2.4]" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap">
            VibeFlow
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Navigation */}
      <nav aria-label="Primary Navigation" className="px-3 space-y-1">
        <button
          type="button"
          onClick={() => navigateTo({ type: 'home' })}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#1ED760] ${
            activeView.type === 'home'
              ? 'bg-[#201F22] text-white'
              : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Home className="w-5 h-5 shrink-0" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo({ type: 'search' })}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#1ED760] ${
            activeView.type === 'search'
              ? 'bg-[#201F22] text-white'
              : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Search className="w-5 h-5 shrink-0" />
          <span>Search</span>
        </button>
      </nav>

      {/* Library Section */}
      <div className="mt-5 flex-1 flex flex-col min-h-0 border-t border-white/[0.06] pt-4">
        <div className="flex items-center justify-between px-5 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#A1A1AA] uppercase">
            <Library className="w-4 h-4" />
            <span>Your Library</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload MP3 file"
              title="Upload MP3"
              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#1ED760] hover:bg-white/10 disabled:opacity-40 transition-colors focus-visible:outline-2 focus-visible:outline-[#1ED760]"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              aria-label="Create new playlist"
              title="Create playlist"
              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-[#1ED760]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Playlists List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {allPlaylists.map((playlist) => {
            const isSelected =
              activeView.type === 'playlist' && activeView.playlistId === playlist.id;
            const isCurrentPlayingContext = currentPlaylistId === playlist.id;
            const isLikedPlaylist = playlist.id === 'liked-songs';
            const isUploadsPlaylist = playlist.id === 'uploaded-tracks';

            return (
              <button
                key={playlist.id}
                type="button"
                onClick={() => navigateTo({ type: 'playlist', playlistId: playlist.id })}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors group focus-visible:outline-2 focus-visible:outline-[#1ED760] ${
                  isSelected
                    ? 'bg-[#201F22]'
                    : 'hover:bg-white/[0.05]'
                }`}
              >
                {isLikedPlaylist ? (
                  <div className="w-10 h-10 rounded-md shrink-0 flex items-center justify-center bg-gradient-to-br from-[#6366F1] to-[#1ED760]">
                    <Heart className="w-4 h-4 text-white fill-current" />
                  </div>
                ) : isUploadsPlaylist ? (
                  <div className="w-10 h-10 rounded-md shrink-0 flex items-center justify-center bg-gradient-to-br from-[#1ED760]/30 to-[#201F22] border border-[#1ED760]/30">
                    <Upload className="w-4 h-4 text-[#1ED760]" />
                  </div>
                ) : (
                  <CoverImage
                    src={playlist.coverUrl}
                    alt={playlist.title}
                    accentColor={playlist.accentColor}
                    className="w-10 h-10 rounded-md shrink-0"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm font-medium truncate ${
                      isCurrentPlayingContext ? 'text-[#1ED760]' : 'text-white'
                    }`}
                  >
                    {playlist.title}
                  </div>
                  <div className="text-xs text-[#A1A1AA] truncate tabular-nums">
                    {playlist.isCustom
                      ? 'Custom'
                      : isUploadsPlaylist
                        ? 'Local MP3s'
                        : 'Playlist'}{' '}
                    · {playlist.trackIds.length}{' '}
                    {playlist.trackIds.length === 1 ? 'song' : 'songs'}
                  </div>
                </div>

                {isCurrentPlayingContext && isPlaying && (
                  <EqualizerIcon isPlaying={true} className="mr-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
