import type { Track } from '../types/music';

const DB_NAME = 'vibeflow_uploads_v1';
const STORE_NAME = 'tracks';

export interface StoredUploadedTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  durationSec: number;
  coverUrl: string;
  accentColor: string;
  blob: Blob;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

export async function loadUploadedTracksFromDB(
  defaultCoverUrl: string
): Promise<Track[]> {
  try {
    const db = await openDB();
    const records = await new Promise<StoredUploadedTrack[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as StoredUploadedTrack[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error('Failed to read uploads'));
    });

    records.sort((a, b) => b.createdAt - a.createdAt);

    return records.map((rec) => ({
      id: rec.id,
      title: rec.title,
      artist: rec.artist,
      album: rec.album,
      genre: rec.genre,
      durationSec: rec.durationSec,
      audioUrl: URL.createObjectURL(rec.blob),
      coverUrl: rec.coverUrl || defaultCoverUrl,
      accentColor: rec.accentColor || '#1ED760',
      isUploaded: true,
      isAvailable: true,
    }));
  } catch {
    return [];
  }
}

export async function saveUploadedTrackToDB(record: StoredUploadedTrack): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to save upload'));
    });
  } catch {
    // Graceful fallback: keep track playable in memory for current session
  }
}

export async function deleteUploadedTrackFromDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to delete upload'));
    });
  } catch {
    // Ignore storage error
  }
}

function parseFilenameMetadata(filename: string): { title: string; artist: string } {
  const withoutExt = filename.replace(/\.[^/.]+$/, '').trim();
  const parts = withoutExt.split(' - ');
  if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim(),
    };
  }
  return {
    title: withoutExt || 'Uploaded Track',
    artist: 'Local Upload',
  };
}

export async function processUploadedAudioFile(
  file: File,
  defaultCoverUrl: string
): Promise<{ track: Track; record: StoredUploadedTrack }> {
  const isMp3OrAudio =
    file.type === 'audio/mpeg' ||
    file.type === 'audio/mp3' ||
    file.type.startsWith('audio/') ||
    /\.mp3$/i.test(file.name);

  if (!isMp3OrAudio) {
    throw new Error(`"${file.name}" is not a supported audio/MP3 file.`);
  }

  const objectUrl = URL.createObjectURL(file);

  const durationSec = await new Promise<number>((resolve, reject) => {
    const probe = new Audio();
    let settled = false;

    const cleanup = () => {
      probe.removeEventListener('loadedmetadata', onMeta);
      probe.removeEventListener('error', onError);
      probe.src = '';
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(0);
    }, 5000);

    const onMeta = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      const dur = Number.isFinite(probe.duration) && probe.duration > 0 ? probe.duration : 0;
      cleanup();
      resolve(dur);
    };

    const onError = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      cleanup();
      reject(new Error(`Unable to decode "${file.name}". Please choose a valid MP3 file.`));
    };

    probe.preload = 'metadata';
    probe.addEventListener('loadedmetadata', onMeta);
    probe.addEventListener('error', onError);
    probe.src = objectUrl;
  }).catch((err) => {
    URL.revokeObjectURL(objectUrl);
    throw err;
  });

  const { title, artist } = parseFilenameMetadata(file.name);
  const id = `trk-upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const accentColors = ['#1ED760', '#6366F1', '#D97706', '#059669'];
  const accentColor = accentColors[Math.floor(Math.random() * accentColors.length)];

  const record: StoredUploadedTrack = {
    id,
    title,
    artist,
    album: 'Uploaded MP3s',
    genre: 'Local MP3',
    durationSec: durationSec > 0 ? Math.round(durationSec) : 0,
    coverUrl: defaultCoverUrl,
    accentColor,
    blob: file,
    createdAt: Date.now(),
  };

  const track: Track = {
    id: record.id,
    title: record.title,
    artist: record.artist,
    album: record.album,
    genre: record.genre,
    durationSec: record.durationSec,
    audioUrl: objectUrl,
    coverUrl: record.coverUrl,
    accentColor: record.accentColor,
    isUploaded: true,
    isAvailable: true,
  };

  return { track, record };
}
