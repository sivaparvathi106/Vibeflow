import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export function CreatePlaylistModal() {
  const { isCreateModalOpen, setIsCreateModalOpen, createPlaylist } = usePlayer();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreateModalOpen) {
      setTitle('');
      setDescription('');
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
      return () => window.clearTimeout(timer);
    }
  }, [isCreateModalOpen]);

  useEffect(() => {
    if (!isCreateModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCreateModalOpen, setIsCreateModalOpen]);

  if (!isCreateModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createPlaylist(title, description);
    setIsCreateModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={() => setIsCreateModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-playlist-heading"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#1C1B1D] border border-white/10 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            id="create-playlist-heading"
            className="font-display text-xl font-bold text-white"
          >
            Create Playlist
          </h2>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(false)}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="playlist-name"
              className="block text-xs font-medium text-[#A1A1AA] mb-1.5"
            >
              Playlist name
            </label>
            <input
              ref={inputRef}
              id="playlist-name"
              type="text"
              maxLength={60}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Late Night Coding"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#131315] border border-white/10 text-sm text-white placeholder:text-[#A1A1AA]/50 focus:outline-none focus:border-[#1ED760] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="playlist-description"
              className="block text-xs font-medium text-[#A1A1AA] mb-1.5"
            >
              Description (optional)
            </label>
            <textarea
              id="playlist-description"
              rows={3}
              maxLength={160}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ambient electronics and warm keys for deep work."
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#131315] border border-white/10 text-sm text-white placeholder:text-[#A1A1AA]/50 focus:outline-none focus:border-[#1ED760] transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 rounded-full text-sm font-semibold bg-[#1ED760] text-[#003913] hover:bg-[#4cf479] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
