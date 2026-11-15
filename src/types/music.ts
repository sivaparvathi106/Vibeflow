export type RepeatMode = 'off' | 'all' | 'one';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  durationSec: number;
  audioUrl: string;
  coverUrl: string;
  accentColor: string;
  bpm: number;
  musicalKey: string;
  /** Base frequency in Hz for seamless Web Audio synth fallback when external audio is unavailable */
  synthRootHz: number;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  accentColor: string;
  trackIds: string[];
  category: string;
  isSystem?: boolean;
  isCustom?: boolean;
}

export interface GenreCategory {
  id: string;
  name: string;
  subtitle: string;
  accentColor: string;
  coverUrl: string;
}

export type ActiveView =
  | { type: 'home' }
  | { type: 'search'; genre?: string }
  | { type: 'playlist'; playlistId: string };
