import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DEFAULT_PLAYLIST_COVER,
  LIKED_SONGS_COVER,
  SYSTEM_PLAYLISTS,
  TRACKS,
  UPLOADED_TRACKS_COVER,
} from '../data/musicData';
import type { ActiveView, Playlist, RepeatMode, Track } from '../types/music';
import {
  deleteUploadedTrackFromDB,
  loadUploadedTracksFromDB,
  processUploadedAudioFile,
  saveUploadedTrackToDB,
} from '../utils/uploadedTracksStorage';

const STORAGE_KEYS = {
  LIKED: 'vibeflow_liked_tracks_v1',
  CUSTOM_PLAYLISTS: 'vibeflow_custom_playlists_v1',
  VOLUME: 'vibeflow_volume_v1',
  MUTED: 'vibeflow_muted_v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

interface PlayerContextValue {
  tracks: Track[];
  uploadedTracks: Track[];
  systemPlaylists: Playlist[];
  customPlaylists: Playlist[];
  likedPlaylist: Playlist;
  uploadedPlaylist: Playlist;
  allPlaylists: Playlist[];
  likedTrackIds: string[];
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  currentTrack: Track;
  currentPlaylistId: string | null;
  currentContextLabel: string;
  queueIds: string[];
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  playbackError: string | null;
  clearPlaybackError: () => void;
  isUploading: boolean;
  isTrackPlayable: (track: Track) => boolean;
  getTrackById: (trackId: string) => Track | undefined;
  isNowPlayingOpen: boolean;
  setIsNowPlayingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  playTrack: (
    trackId: string,
    contextQueueIds?: string[],
    contextLabel?: string,
    contextPlaylistId?: string | null
  ) => void;
  playPlaylist: (playlistId: string, startTrackId?: string, enableShuffle?: boolean) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  toggleLike: (trackId: string) => void;
  isTrackLiked: (trackId: string) => boolean;
  createPlaylist: (title: string, description: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  uploadAudioFiles: (files: FileList | File[]) => Promise<void>;
  removeUploadedTrack: (trackId: string) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.LIKED, ['trk-01', 'trk-05', 'trk-12'])
  );
  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>(() =>
    readStorage<Playlist[]>(STORAGE_KEYS.CUSTOM_PLAYLISTS, [])
  );
  const [uploadedTracks, setUploadedTracks] = useState<Track[]>([]);
  const [unavailableTrackIds, setUnavailableTrackIds] = useState<Set<string>>(() => new Set());
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [volume, setVolumeState] = useState<number>(() =>
    readStorage<number>(STORAGE_KEYS.VOLUME, 0.78)
  );
  const [isMuted, setIsMuted] = useState<boolean>(() =>
    readStorage<boolean>(STORAGE_KEYS.MUTED, false)
  );

  const [activeView, setActiveView] = useState<ActiveView>({ type: 'home' });
  const [currentTrackId, setCurrentTrackId] = useState<string>(TRACKS[0].id);
  const [queueIds, setQueueIds] = useState<string[]>(SYSTEM_PLAYLISTS[0].trackIds);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(SYSTEM_PLAYLISTS[0].id);
  const [currentContextLabel, setCurrentContextLabel] = useState<string>(SYSTEM_PLAYLISTS[0].title);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(TRACKS[0].durationSec);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasLoadedInitialTrackRef = useRef<boolean>(false);
  const uploadedObjectUrlsRef = useRef<string[]>([]);

  const allTracks = useMemo(() => [...uploadedTracks, ...TRACKS], [uploadedTracks]);

  const getTrackById = useCallback(
    (trackId: string) => allTracks.find((t) => t.id === trackId),
    [allTracks]
  );

  const currentTrack = useMemo(
    () => getTrackById(currentTrackId) ?? TRACKS[0],
    [currentTrackId, getTrackById]
  );

  const isTrackPlayable = useCallback(
    (track: Track) =>
      Boolean(track.audioUrl) &&
      track.isAvailable !== false &&
      !unavailableTrackIds.has(track.id),
    [unavailableTrackIds]
  );

  const likedPlaylist = useMemo<Playlist>(
    () => ({
      id: 'liked-songs',
      title: 'Liked Songs',
      description: 'Your saved favorites across every mood and session.',
      coverUrl: LIKED_SONGS_COVER,
      accentColor: '#1ED760',
      trackIds: likedTrackIds,
      category: 'Personal',
      isSystem: true,
    }),
    [likedTrackIds]
  );

  const uploadedPlaylist = useMemo<Playlist>(
    () => ({
      id: 'uploaded-tracks',
      title: 'Uploaded MP3s',
      description: 'Your local MP3 files ready for instant playback.',
      coverUrl: UPLOADED_TRACKS_COVER,
      accentColor: '#1ED760',
      trackIds: uploadedTracks.map((t) => t.id),
      category: 'Local Audio',
      isSystem: true,
      isUploads: true,
    }),
    [uploadedTracks]
  );

  const allPlaylists = useMemo(
    () => [likedPlaylist, uploadedPlaylist, ...SYSTEM_PLAYLISTS, ...customPlaylists],
    [likedPlaylist, uploadedPlaylist, customPlaylists]
  );

  const clearPlaybackError = useCallback(() => setPlaybackError(null), []);

  const markTrackUnavailable = useCallback((track: Track, reason?: string) => {
    setUnavailableTrackIds((prev) => {
      const next = new Set(prev);
      next.add(track.id);
      return next;
    });
    setIsPlaying(false);
    setIsBuffering(false);
    setPlaybackError(
      reason ?? `Audio unavailable for "${track.title}" — source file missing or unsupported.`
    );
  }, []);

  // Load persisted uploaded MP3s from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;
    loadUploadedTracksFromDB(UPLOADED_TRACKS_COVER).then((loaded) => {
      if (cancelled) {
        loaded.forEach((t) => {
          if (t.audioUrl?.startsWith('blob:')) URL.revokeObjectURL(t.audioUrl);
        });
        return;
      }
      uploadedObjectUrlsRef.current = loaded
        .map((t) => t.audioUrl)
        .filter((u): u is string => Boolean(u && u.startsWith('blob:')));
      setUploadedTracks(loaded);
    });

    return () => {
      cancelled = true;
      uploadedObjectUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
    };
  }, []);

  // Refs for latest state inside audio event listeners
  const stateRef = useRef({
    currentTrack,
    queueIds,
    isPlaying,
    isShuffle,
    repeatMode,
    volume,
    isMuted,
    currentTime,
    duration,
    getTrackById,
    isTrackPlayable,
    markTrackUnavailable,
  });

  stateRef.current = {
    currentTrack,
    queueIds,
    isPlaying,
    isShuffle,
    repeatMode,
    volume,
    isMuted,
    currentTime,
    duration,
    getTrackById,
    isTrackPlayable,
    markTrackUnavailable,
  };

  // Persist user preferences
  useEffect(() => {
    writeStorage(STORAGE_KEYS.LIKED, likedTrackIds);
  }, [likedTrackIds]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.CUSTOM_PLAYLISTS, customPlaylists);
  }, [customPlaylists]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.VOLUME, volume);
  }, [volume]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.MUTED, isMuted);
  }, [isMuted]);

  const getNextTrackId = useCallback((): string | null => {
    const {
      queueIds: q,
      currentTrack: curr,
      isShuffle: shuffle,
      repeatMode: repeat,
      getTrackById: findTrack,
      isTrackPlayable: playable,
    } = stateRef.current;

    const playableQueue = q.filter((id) => {
      const t = findTrack(id);
      return t ? playable(t) : false;
    });

    if (playableQueue.length === 0) return null;

    if (shuffle && playableQueue.length > 1) {
      const candidates = playableQueue.filter((id) => id !== curr.id);
      return candidates[Math.floor(Math.random() * candidates.length)] ?? playableQueue[0];
    }

    const idx = playableQueue.indexOf(curr.id);
    if (idx === -1) return playableQueue[0];
    if (idx + 1 < playableQueue.length) {
      return playableQueue[idx + 1];
    }
    if (repeat === 'all') {
      return playableQueue[0];
    }
    return null;
  }, []);

  const loadAndPlay = useCallback((track: Track, autoPlay: boolean) => {
    const audio = audioRef.current;
    setCurrentTime(0);
    setDuration(track.durationSec);

    if (!track.audioUrl || track.isAvailable === false) {
      stateRef.current.markTrackUnavailable(
        track,
        `Audio unavailable for "${track.title}" — no audio file attached.`
      );
      return;
    }

    if (!audio) return;

    setPlaybackError(null);
    audio.src = track.audioUrl;
    audio.volume = stateRef.current.isMuted ? 0 : stateRef.current.volume;

    if (autoPlay) {
      setIsBuffering(true);
      setIsPlaying(true);
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsBuffering(false);
          })
          .catch((err: Error) => {
            if (err?.name === 'AbortError') return;
            stateRef.current.markTrackUnavailable(
              track,
              `Unable to play "${track.title}" — audio file could not be loaded.`
            );
          });
      }
    } else {
      setIsPlaying(false);
      setIsBuffering(false);
    }
  }, []);

  // Initialize single persistent <audio> instance
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };

    const handleError = () => {
      if (!audio.getAttribute('src')) return;
      const curr = stateRef.current.currentTrack;
      if (stateRef.current.isPlaying) {
        stateRef.current.markTrackUnavailable(
          curr,
          `Playback failed for "${curr.title}" — audio file is missing or corrupted.`
        );
      } else {
        setIsBuffering(false);
      }
    };

    const handleEnded = () => {
      const { repeatMode: repeat, currentTrack: curr, getTrackById: findTrack } =
        stateRef.current;
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch((err: Error) => {
          if (err?.name !== 'AbortError') {
            stateRef.current.markTrackUnavailable(curr);
          }
        });
        return;
      }
      const nextId = getNextTrackId();
      if (nextId) {
        const nextTrk = findTrack(nextId);
        if (nextTrk) {
          setCurrentTrackId(nextTrk.id);
          loadAndPlay(nextTrk, true);
          return;
        }
      }
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleDurationChange);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    if (!hasLoadedInitialTrackRef.current && TRACKS[0].audioUrl) {
      hasLoadedInitialTrackRef.current = true;
      audio.src = TRACKS[0].audioUrl;
      audio.volume = stateRef.current.isMuted ? 0 : stateRef.current.volume;
    }

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleDurationChange);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [getNextTrackId, loadAndPlay]);

  // Sync volume & mute to <audio>
  useEffect(() => {
    const effective = isMuted ? 0 : volume;
    if (audioRef.current) {
      audioRef.current.volume = effective;
    }
  }, [volume, isMuted]);

  const playTrack = useCallback(
    (
      trackId: string,
      contextQueueIds?: string[],
      contextLabel?: string,
      contextPlaylistId?: string | null
    ) => {
      const target = getTrackById(trackId);
      if (!target) return;

      if (!isTrackPlayable(target)) {
        setPlaybackError(
          `Audio unavailable for "${target.title}" — no playable audio source found.`
        );
        return;
      }

      if (contextQueueIds && contextQueueIds.length > 0) {
        setQueueIds(contextQueueIds);
      }
      if (contextLabel !== undefined) {
        setCurrentContextLabel(contextLabel);
      }
      if (contextPlaylistId !== undefined) {
        setCurrentPlaylistId(contextPlaylistId);
      }

      if (trackId === currentTrackId && audioRef.current?.getAttribute('src')) {
        setPlaybackError(null);
        if (!isPlaying) {
          setIsBuffering(true);
          setIsPlaying(true);
          audioRef.current
            .play()
            .then(() => setIsBuffering(false))
            .catch((err: Error) => {
              if (err?.name !== 'AbortError') {
                markTrackUnavailable(target);
              }
            });
        }
        return;
      }

      setCurrentTrackId(target.id);
      loadAndPlay(target, true);
    },
    [
      currentTrackId,
      getTrackById,
      isPlaying,
      isTrackPlayable,
      loadAndPlay,
      markTrackUnavailable,
    ]
  );

  const playPlaylist = useCallback(
    (playlistId: string, startTrackId?: string, enableShuffle?: boolean) => {
      const pl = allPlaylists.find((p) => p.id === playlistId);
      if (!pl || pl.trackIds.length === 0) return;

      if (enableShuffle !== undefined) {
        setIsShuffle(enableShuffle);
      }

      const playableIds = pl.trackIds.filter((id) => {
        const t = getTrackById(id);
        return t ? isTrackPlayable(t) : false;
      });

      if (playableIds.length === 0) {
        setPlaybackError(`No playable audio tracks found in "${pl.title}".`);
        return;
      }

      const firstId =
        startTrackId && playableIds.includes(startTrackId)
          ? startTrackId
          : enableShuffle
            ? playableIds[Math.floor(Math.random() * playableIds.length)]
            : playableIds[0];

      if (!startTrackId && currentPlaylistId === playlistId && enableShuffle === undefined) {
        if (isPlaying) {
          audioRef.current?.pause();
          setIsPlaying(false);
        } else {
          if (!isTrackPlayable(currentTrack)) {
            playTrack(firstId, pl.trackIds, pl.title, pl.id);
            return;
          }
          setIsBuffering(true);
          setIsPlaying(true);
          audioRef.current
            ?.play()
            .then(() => setIsBuffering(false))
            .catch((err: Error) => {
              if (err?.name !== 'AbortError') {
                markTrackUnavailable(currentTrack);
              }
            });
        }
        return;
      }

      playTrack(firstId, pl.trackIds, pl.title, pl.id);
    },
    [
      allPlaylists,
      currentPlaylistId,
      currentTrack,
      getTrackById,
      isPlaying,
      isTrackPlayable,
      markTrackUnavailable,
      playTrack,
    ]
  );

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setIsBuffering(false);
      return;
    }

    if (!isTrackPlayable(currentTrack)) {
      setPlaybackError(
        `Audio unavailable for "${currentTrack.title}" — please select another track or upload an MP3.`
      );
      return;
    }

    setPlaybackError(null);
    if (!audio.getAttribute('src') && currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl;
    }

    setIsBuffering(true);
    setIsPlaying(true);
    audio
      .play()
      .then(() => setIsBuffering(false))
      .catch((err: Error) => {
        if (err?.name !== 'AbortError') {
          markTrackUnavailable(currentTrack);
        }
      });
  }, [currentTrack, isPlaying, isTrackPlayable, markTrackUnavailable]);

  const nextTrack = useCallback(() => {
    const {
      queueIds: q,
      currentTrack: curr,
      isShuffle: shuffle,
      getTrackById: findTrack,
      isTrackPlayable: playable,
    } = stateRef.current;

    const playableQueue = q.filter((id) => {
      const t = findTrack(id);
      return t ? playable(t) : false;
    });
    if (playableQueue.length === 0) return;

    let nextId: string;
    if (shuffle && playableQueue.length > 1) {
      const candidates = playableQueue.filter((id) => id !== curr.id);
      nextId = candidates[Math.floor(Math.random() * candidates.length)] ?? playableQueue[0];
    } else {
      const idx = playableQueue.indexOf(curr.id);
      nextId = idx === -1 ? playableQueue[0] : playableQueue[(idx + 1) % playableQueue.length];
    }

    const nextTrk = findTrack(nextId);
    if (nextTrk) {
      setCurrentTrackId(nextTrk.id);
      loadAndPlay(nextTrk, true);
    }
  }, [loadAndPlay]);

  const prevTrack = useCallback(() => {
    const {
      queueIds: q,
      currentTrack: curr,
      currentTime: elapsed,
      getTrackById: findTrack,
      isTrackPlayable: playable,
    } = stateRef.current;

    if (elapsed > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const playableQueue = q.filter((id) => {
      const t = findTrack(id);
      return t ? playable(t) : false;
    });
    if (playableQueue.length === 0) return;

    const idx = playableQueue.indexOf(curr.id);
    const prevId = idx <= 0 ? playableQueue[playableQueue.length - 1] : playableQueue[idx - 1];
    const prevTrk = findTrack(prevId);
    if (prevTrk) {
      setCurrentTrackId(prevTrk.id);
      loadAndPlay(prevTrk, true);
    }
  }, [loadAndPlay]);

  const seekTo = useCallback((seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, stateRef.current.duration));
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = clamped;
      } catch {
        // ignore if media not yet seekable
      }
    }
    setCurrentTime(clamped);
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (clamped > 0 && stateRef.current.isMuted) {
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
  }, []);

  const toggleLike = useCallback((trackId: string) => {
    setLikedTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [trackId, ...prev]
    );
  }, []);

  const isTrackLiked = useCallback(
    (trackId: string) => likedTrackIds.includes(trackId),
    [likedTrackIds]
  );

  const createPlaylist = useCallback((title: string, description: string): Playlist => {
    const cleanTitle = title.trim() || 'Untitled Mix';
    const cleanDesc =
      description.trim() || 'Custom collection curated inside VibeFlow.';
    const accents = ['#1ED760', '#6366F1', '#D97706', '#059669', '#818CF8'];
    const accentColor = accents[Math.floor(Math.random() * accents.length)];
    const newPl: Playlist = {
      id: `pl-custom-${Date.now()}`,
      title: cleanTitle,
      description: cleanDesc,
      coverUrl: DEFAULT_PLAYLIST_COVER,
      accentColor,
      trackIds: [],
      category: 'Custom Playlist',
      isCustom: true,
    };
    setCustomPlaylists((prev) => [...prev, newPl]);
    setActiveView({ type: 'playlist', playlistId: newPl.id });
    return newPl;
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setCustomPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    setActiveView((prev) =>
      prev.type === 'playlist' && prev.playlistId === playlistId ? { type: 'home' } : prev
    );
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, trackId: string) => {
    setCustomPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        if (pl.trackIds.includes(trackId)) return pl;
        return { ...pl, trackIds: [...pl.trackIds, trackId] };
      })
    );
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setCustomPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        return { ...pl, trackIds: pl.trackIds.filter((id) => id !== trackId) };
      })
    );
  }, []);

  const uploadAudioFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileList = Array.from(files);
      if (fileList.length === 0) return;

      setIsUploading(true);
      setPlaybackError(null);
      const newlyAdded: Track[] = [];
      const errors: string[] = [];

      for (const file of fileList) {
        try {
          const { track, record } = await processUploadedAudioFile(
            file,
            UPLOADED_TRACKS_COVER
          );
          if (track.audioUrl?.startsWith('blob:')) {
            uploadedObjectUrlsRef.current.push(track.audioUrl);
          }
          await saveUploadedTrackToDB(record);
          newlyAdded.push(track);
        } catch (err) {
          errors.push(
            err instanceof Error ? err.message : `Failed to process "${file.name}".`
          );
        }
      }

      if (newlyAdded.length > 0) {
        setUploadedTracks((prev) => {
          const merged = [...newlyAdded, ...prev];
          const firstNew = newlyAdded[0];
          const updatedQueue = merged.map((t) => t.id);
          setQueueIds(updatedQueue);
          setCurrentPlaylistId('uploaded-tracks');
          setCurrentContextLabel('Uploaded MP3s');
          setCurrentTrackId(firstNew.id);
          loadAndPlay(firstNew, true);
          return merged;
        });
        setActiveView({ type: 'playlist', playlistId: 'uploaded-tracks' });
      }

      if (errors.length > 0) {
        setPlaybackError(errors[0]);
      }

      setIsUploading(false);
    },
    [loadAndPlay]
  );

  const removeUploadedTrack = useCallback(
    async (trackId: string) => {
      const target = uploadedTracks.find((t) => t.id === trackId);
      if (target?.audioUrl?.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(target.audioUrl);
        } catch {
          // ignore
        }
      }
      await deleteUploadedTrackFromDB(trackId);

      setUploadedTracks((prev) => prev.filter((t) => t.id !== trackId));
      setLikedTrackIds((prev) => prev.filter((id) => id !== trackId));
      setCustomPlaylists((prev) =>
        prev.map((pl) => ({
          ...pl,
          trackIds: pl.trackIds.filter((id) => id !== trackId),
        }))
      );

      if (currentTrackId === trackId) {
        audioRef.current?.pause();
        setIsPlaying(false);
        setCurrentTime(0);
        setCurrentTrackId(TRACKS[0].id);
        setQueueIds(SYSTEM_PLAYLISTS[0].trackIds);
        setCurrentPlaylistId(SYSTEM_PLAYLISTS[0].id);
        setCurrentContextLabel(SYSTEM_PLAYLISTS[0].title);
        if (audioRef.current && TRACKS[0].audioUrl) {
          audioRef.current.src = TRACKS[0].audioUrl;
          setDuration(TRACKS[0].durationSec);
        }
      }
    },
    [currentTrackId, uploadedTracks]
  );

  // Global Spacebar shortcut for Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      togglePlayPause();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause]);

  const value: PlayerContextValue = {
    tracks: allTracks,
    uploadedTracks,
    systemPlaylists: SYSTEM_PLAYLISTS,
    customPlaylists,
    likedPlaylist,
    uploadedPlaylist,
    allPlaylists,
    likedTrackIds,
    activeView,
    setActiveView,
    currentTrack,
    currentPlaylistId,
    currentContextLabel,
    queueIds,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    playbackError,
    clearPlaybackError,
    isUploading,
    isTrackPlayable,
    getTrackById,
    isNowPlayingOpen,
    setIsNowPlayingOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    playTrack,
    playPlaylist,
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
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    uploadAudioFiles,
    removeUploadedTrack,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return ctx;
}
