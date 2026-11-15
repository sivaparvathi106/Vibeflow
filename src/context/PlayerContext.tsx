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
  getTrackById,
} from '../data/musicData';
import type { ActiveView, Playlist, RepeatMode, Track } from '../types/music';

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
  systemPlaylists: Playlist[];
  customPlaylists: Playlist[];
  likedPlaylist: Playlist;
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
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.LIKED, ['trk-01', 'trk-05', 'trk-12'])
  );
  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>(() =>
    readStorage<Playlist[]>(STORAGE_KEYS.CUSTOM_PLAYLISTS, [])
  );
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
  const synthFallbackActiveRef = useRef<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);
  const synthOscsRef = useRef<OscillatorNode[]>([]);
  const synthTimerRef = useRef<number | null>(null);
  const hasLoadedInitialTrackRef = useRef<boolean>(false);

  const currentTrack = useMemo(
    () => getTrackById(currentTrackId) ?? TRACKS[0],
    [currentTrackId]
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

  const allPlaylists = useMemo(
    () => [likedPlaylist, ...SYSTEM_PLAYLISTS, ...customPlaylists],
    [likedPlaylist, customPlaylists]
  );

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

  const stopSynthFallback = useCallback(() => {
    if (synthTimerRef.current !== null) {
      window.clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    synthOscsRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore already stopped
      }
    });
    synthOscsRef.current = [];
    if (synthGainRef.current) {
      try {
        synthGainRef.current.disconnect();
      } catch {
        // ignore
      }
      synthGainRef.current = null;
    }
  }, []);

  const startSynthFallback = useCallback(
    (track: Track) => {
      stopSynthFallback();
      synthFallbackActiveRef.current = true;
      setIsBuffering(false);

      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioCtxRef.current && AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx) {
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
          const masterGain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 620;

          const effectiveVol = stateRef.current.isMuted ? 0 : stateRef.current.volume;
          masterGain.gain.setValueAtTime(effectiveVol * 0.08, ctx.currentTime);
          filter.connect(masterGain);
          masterGain.connect(ctx.destination);
          synthGainRef.current = masterGain;

          // Warm ambient triad pad (root, fifth, ninth)
          const ratios = [1, 1.498, 2.245];
          const oscs = ratios.map((ratio, idx) => {
            const osc = ctx.createOscillator();
            osc.type = idx === 0 ? 'sine' : 'triangle';
            osc.frequency.value = track.synthRootHz * ratio;
            osc.detune.value = (idx - 1) * 4;
            osc.connect(filter);
            osc.start();
            return osc;
          });
          synthOscsRef.current = oscs;
        }
      } catch {
        // Silent timer fallback if AudioContext is unavailable
      }

      synthTimerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.5;
          if (next >= track.durationSec) {
            return track.durationSec;
          }
          return next;
        });
      }, 500);
    },
    [stopSynthFallback]
  );

  // Compute next track index/id
  const getNextTrackId = useCallback((): string | null => {
    const { queueIds: q, currentTrack: curr, isShuffle: shuffle, repeatMode: repeat } =
      stateRef.current;
    if (q.length === 0) return curr.id;

    if (shuffle && q.length > 1) {
      const candidates = q.filter((id) => id !== curr.id);
      return candidates[Math.floor(Math.random() * candidates.length)] ?? q[0];
    }

    const idx = q.indexOf(curr.id);
    if (idx === -1) return q[0];
    if (idx + 1 < q.length) {
      return q[idx + 1];
    }
    if (repeat === 'all') {
      return q[0];
    }
    return null;
  }, []);

  const loadAndPlay = useCallback(
    (track: Track, autoPlay: boolean) => {
      const audio = audioRef.current;
      stopSynthFallback();
      synthFallbackActiveRef.current = false;
      setCurrentTime(0);
      setDuration(track.durationSec);

      if (!audio) return;

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
              // Network/CORS or sandbox blocked -> seamless ambient synth fallback
              startSynthFallback(track);
            });
        }
      } else {
        setIsPlaying(false);
        setIsBuffering(false);
      }
    },
    [startSynthFallback, stopSynthFallback]
  );

  // Initialize single <audio> instance
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!synthFallbackActiveRef.current) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
      setIsBuffering(false);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handleError = () => {
      if (stateRef.current.isPlaying) {
        startSynthFallback(stateRef.current.currentTrack);
      } else {
        setIsBuffering(false);
      }
    };

    const handleEnded = () => {
      const { repeatMode: repeat, currentTrack: curr } = stateRef.current;
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => startSynthFallback(curr));
        return;
      }
      const nextId = getNextTrackId();
      if (nextId) {
        const nextTrk = getTrackById(nextId);
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
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    // Preload initial track silently without auto-playing
    if (!hasLoadedInitialTrackRef.current) {
      hasLoadedInitialTrackRef.current = true;
      audio.src = TRACKS[0].audioUrl;
      audio.volume = stateRef.current.isMuted ? 0 : stateRef.current.volume;
    }

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      stopSynthFallback();
    };
  }, [getNextTrackId, loadAndPlay, startSynthFallback, stopSynthFallback]);

  // Handle synth fallback end-of-track transitions
  useEffect(() => {
    if (!synthFallbackActiveRef.current || !isPlaying) return;
    if (currentTime >= duration) {
      if (repeatMode === 'one') {
        setCurrentTime(0);
        return;
      }
      const nextId = getNextTrackId();
      if (nextId) {
        const nextTrk = getTrackById(nextId);
        if (nextTrk) {
          setCurrentTrackId(nextTrk.id);
          loadAndPlay(nextTrk, true);
          return;
        }
      }
      stopSynthFallback();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [currentTime, duration, getNextTrackId, isPlaying, loadAndPlay, repeatMode, stopSynthFallback]);

  // Sync volume & mute to audio + synth
  useEffect(() => {
    const effective = isMuted ? 0 : volume;
    if (audioRef.current) {
      audioRef.current.volume = effective;
    }
    if (synthGainRef.current && audioCtxRef.current) {
      synthGainRef.current.gain.setValueAtTime(effective * 0.08, audioCtxRef.current.currentTime);
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

      if (contextQueueIds && contextQueueIds.length > 0) {
        setQueueIds(contextQueueIds);
      }
      if (contextLabel !== undefined) {
        setCurrentContextLabel(contextLabel);
      }
      if (contextPlaylistId !== undefined) {
        setCurrentPlaylistId(contextPlaylistId);
      }

      if (trackId === currentTrackId) {
        // Resume if paused, or restart if ended
        if (!isPlaying) {
          setIsPlaying(true);
          if (synthFallbackActiveRef.current) {
            startSynthFallback(target);
          } else {
            audioRef.current?.play().catch(() => startSynthFallback(target));
          }
        }
        return;
      }

      setCurrentTrackId(target.id);
      loadAndPlay(target, true);
    },
    [currentTrackId, isPlaying, loadAndPlay, startSynthFallback]
  );

  const playPlaylist = useCallback(
    (playlistId: string, startTrackId?: string, enableShuffle?: boolean) => {
      const pl = allPlaylists.find((p) => p.id === playlistId);
      if (!pl || pl.trackIds.length === 0) return;

      if (enableShuffle !== undefined) {
        setIsShuffle(enableShuffle);
      }

      const firstId =
        startTrackId && pl.trackIds.includes(startTrackId)
          ? startTrackId
          : enableShuffle
            ? pl.trackIds[Math.floor(Math.random() * pl.trackIds.length)]
            : pl.trackIds[0];

      // If clicking play on already active playlist without specifying track, toggle play/pause
      if (!startTrackId && currentPlaylistId === playlistId && enableShuffle === undefined) {
        if (isPlaying) {
          audioRef.current?.pause();
          stopSynthFallback();
          setIsPlaying(false);
        } else {
          setIsPlaying(true);
          if (synthFallbackActiveRef.current) {
            startSynthFallback(currentTrack);
          } else {
            audioRef.current?.play().catch(() => startSynthFallback(currentTrack));
          }
        }
        return;
      }

      playTrack(firstId, pl.trackIds, pl.title, pl.id);
    },
    [
      allPlaylists,
      currentPlaylistId,
      currentTrack,
      isPlaying,
      playTrack,
      startSynthFallback,
      stopSynthFallback,
    ]
  );

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      audioRef.current?.pause();
      stopSynthFallback();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (synthFallbackActiveRef.current) {
        startSynthFallback(currentTrack);
      } else {
        setIsBuffering(true);
        audioRef.current
          ?.play()
          .then(() => setIsBuffering(false))
          .catch((err: Error) => {
            if (err?.name === 'AbortError') return;
            startSynthFallback(currentTrack);
          });
      }
    }
  }, [currentTrack, isPlaying, startSynthFallback, stopSynthFallback]);

  const nextTrack = useCallback(() => {
    const { queueIds: q, currentTrack: curr, isShuffle: shuffle } = stateRef.current;
    if (q.length === 0) return;

    let nextId: string;
    if (shuffle && q.length > 1) {
      const candidates = q.filter((id) => id !== curr.id);
      nextId = candidates[Math.floor(Math.random() * candidates.length)] ?? q[0];
    } else {
      const idx = q.indexOf(curr.id);
      nextId = idx === -1 ? q[0] : q[(idx + 1) % q.length];
    }

    const nextTrk = getTrackById(nextId);
    if (nextTrk) {
      setCurrentTrackId(nextTrk.id);
      loadAndPlay(nextTrk, true);
    }
  }, [loadAndPlay]);

  const prevTrack = useCallback(() => {
    const { queueIds: q, currentTrack: curr, currentTime: elapsed } = stateRef.current;
    if (elapsed > 3) {
      if (audioRef.current && !synthFallbackActiveRef.current) {
        audioRef.current.currentTime = 0;
      }
      setCurrentTime(0);
      return;
    }

    if (q.length === 0) return;
    const idx = q.indexOf(curr.id);
    const prevId = idx <= 0 ? q[q.length - 1] : q[idx - 1];
    const prevTrk = getTrackById(prevId);
    if (prevTrk) {
      setCurrentTrackId(prevTrk.id);
      loadAndPlay(prevTrk, true);
    }
  }, [loadAndPlay]);

  const seekTo = useCallback((seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, stateRef.current.duration));
    if (audioRef.current && !synthFallbackActiveRef.current) {
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

  const deletePlaylist = useCallback(
    (playlistId: string) => {
      setCustomPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
      setActiveView((prev) =>
        prev.type === 'playlist' && prev.playlistId === playlistId ? { type: 'home' } : prev
      );
    },
    []
  );

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
    tracks: TRACKS,
    systemPlaylists: SYSTEM_PLAYLISTS,
    customPlaylists,
    likedPlaylist,
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
