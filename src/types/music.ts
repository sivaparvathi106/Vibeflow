export type RepeatMode = 'off' | 'all' | 'one';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  durationSec: number;
  audioUrl: string | null;
  coverUrl: string;
  accentColor: string;
  bpm?: number;
  musicalKey?: string;
  isUploaded?: boolean;
  isAvailable?: boolean;
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
  isUploads?: boolean;
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
