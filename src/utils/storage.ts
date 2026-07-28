import { AppSettings, AppStorageState, KnowledgeCollection, LicenseData, QuizResult, UserProfile } from '../types';
import { SAMPLE_COLLECTIONS } from '../data/sampleCollections';
import { buildLicenseData, generateLicenseKey, getOrCreateDeviceId, HARDCODED_MASTER_KEYS } from './crypto';
import { loadStateFromIndexedDB, saveStateToIndexedDB, clearIndexedDB } from './indexedDB';

const STORAGE_KEY = 'zy_vocab_hear_app_v1';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'zh',
  theme: 'light',
  fontSize: 'medium',
  speechSpeed: 1.0,
  securityEnabled: false,
  pinCode: undefined,
  dailyStudyReminder: true,
  reminderTime: '20:00',
  examTimerDefaultMinutes: 10, // 1 min per q
  defaultPassMark: 60,
};

const DEFAULT_PROFILE: UserProfile = {
  displayName: '小寶',
  avatarSeed: 'learner1',
  createdAt: new Date().toISOString(),
};

/**
 * Synchronously load app storage state from localStorage (Initial Fast Render)
 */
export function loadAppState(): AppStorageState {
  const deviceId = getOrCreateDeviceId();
  const nowMs = Date.now();

  const raw = localStorage.getItem(STORAGE_KEY);
  let state: Partial<AppStorageState> = {};

  if (raw) {
    try {
      state = JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse app state from localStorage:', e);
    }
  }

  // Update clock watermark (monotonic timestamp)
  const previousWatermark = state.clockWatermark || 0;
  const newWatermark = Math.max(previousWatermark, nowMs);

  // Default initial license: None by default. User must activate to unlock premium modules.
  let activeLicense: LicenseData | null = null;
  if (state.license?.key) {
    activeLicense = buildLicenseData(state.license.key, deviceId, newWatermark);
  }

  let collections: KnowledgeCollection[];
  if (Array.isArray(state.collections)) {
    const hasOldCollections = state.collections.some(col => col.id.includes('math') || col.id.includes('chi-02') || col.name.includes('乐园'));
    if (hasOldCollections) {
      const cleaned = state.collections.filter(col => !(col.id.includes('math') || col.id.includes('chi-02') || col.name.includes('乐园')));
      collections = cleaned.length > 0 ? cleaned : SAMPLE_COLLECTIONS;
    } else {
      collections = state.collections.map((col) => {
        const sample = SAMPLE_COLLECTIONS.find((s) => s.id === col.id);
        if (sample) {
          return { ...col, tags: sample.tags, categories: sample.categories };
        }
        return col;
      });
    }
  } else {
    collections = SAMPLE_COLLECTIONS;
  }

  const fullState: AppStorageState = {
    deviceId,
    clockWatermark: newWatermark,
    license: activeLicense,
    profile: { ...DEFAULT_PROFILE, ...state.profile },
    settings: { ...DEFAULT_SETTINGS, ...state.settings },
    collections,
    quizResults: state.quizResults || [],
    lastStudyDate: state.lastStudyDate,
    currentStreak: state.currentStreak || 0,
  };

  return fullState;
}

/**
 * Asynchronously load & hydrate state from browser IndexedDB
 */
export async function loadAppStateAsync(): Promise<AppStorageState> {
  const idbState = await loadStateFromIndexedDB();
  if (idbState && Array.isArray(idbState.collections)) {
    const hasOldCollections = idbState.collections.some(col => col.id.includes('math') || col.id.includes('chi-02') || col.name.includes('乐园'));
    if (hasOldCollections) {
      const cleaned = idbState.collections.filter(col => !(col.id.includes('math') || col.id.includes('chi-02') || col.name.includes('乐园')));
      idbState.collections = cleaned.length > 0 ? cleaned : SAMPLE_COLLECTIONS;
    }
    idbState.collections = idbState.collections.map((col) => {
      const sample = SAMPLE_COLLECTIONS.find((s) => s.id === col.id);
      if (sample) {
        return { ...col, tags: sample.tags, categories: sample.categories };
      }
      return col;
    });

    // Save to localStorage as synced cache (ignoring quota errors)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(idbState));
    } catch (e) {
      console.warn('LocalStorage quota limit reached during IDB sync:', e);
    }
    return idbState;
  }

  // Fallback to synchronous load & seed IndexedDB
  const localState = loadAppState();
  await saveStateToIndexedDB(localState);
  return localState;
}

/**
 * Save state to both IndexedDB (primary high-capacity storage) and localStorage (sync cache)
 */
export function saveAppState(state: AppStorageState): void {
  const nowMs = Date.now();
  state.clockWatermark = Math.max(state.clockWatermark || 0, nowMs);

  // 1. Persist to IndexedDB (Browser Local DB)
  saveStateToIndexedDB(state).catch((err) => {
    console.warn('IndexedDB async save failed:', err);
  });

  // 2. Save to localStorage (fast cache / legacy compatibility)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('LocalStorage quota limit reached, relying on IndexedDB:', e);
  }
}

/**
 * Reset local storage and IndexedDB, keeping the active license intact
 */
export async function resetAppState(): Promise<void> {
  const raw = localStorage.getItem(STORAGE_KEY);
  let licenseToPreserve: LicenseData | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.license) {
        licenseToPreserve = parsed.license;
      }
    } catch (e) {
      console.error('Failed to parse license from stored state during reset:', e);
    }
  }

  localStorage.removeItem(STORAGE_KEY);
  await clearIndexedDB();

  if (licenseToPreserve) {
    const deviceId = getOrCreateDeviceId();
    const nowMs = Date.now();
    const partialState = {
      deviceId,
      clockWatermark: nowMs,
      license: licenseToPreserve,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(partialState));
    await saveStateToIndexedDB(partialState as any);
  }
}

/**
 * Update learning streak when completing a session
 */
export function calculateAndUpdateStreak(state: AppStorageState, sessionQuestionCount: number): AppStorageState {
  if (sessionQuestionCount < 5) return state; // Must answer at least 5 questions for streak

  const todayStr = new Date().toISOString().split('T')[0];
  const lastDateStr = state.lastStudyDate;

  if (lastDateStr === todayStr) {
    return state;
  }

  let newStreak = state.currentStreak;

  if (!lastDateStr) {
    newStreak = 1;
  } else {
    const lastDate = new Date(lastDateStr);
    const today = new Date(todayStr);
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1; // Streak reset
    }
  }

  const updatedState: AppStorageState = {
    ...state,
    lastStudyDate: todayStr,
    currentStreak: newStreak,
  };

  saveAppState(updatedState);
  return updatedState;
}

/**
 * Robust image path resolver supporting local development and subpath deployments like GitHub Pages.
 */
export function resolveImagePath(pathStr: string | undefined): string {
  if (!pathStr) return '';
  if (
    pathStr.startsWith('http://') ||
    pathStr.startsWith('https://') ||
    pathStr.startsWith('data:')
  ) {
    return pathStr;
  }

  // Clean leading slash if any
  const cleanPath = pathStr.startsWith('/') ? pathStr.slice(1) : pathStr;

  // Map legacy /src/assets/images paths to images/
  const mappedPath = cleanPath.startsWith('src/assets/images/')
    ? cleanPath.replace('src/assets/images/', 'images/')
    : cleanPath;

  // Prepend import.meta.env.BASE_URL if available
  const baseUrl = import.meta.env.BASE_URL || '/';
  const separator = baseUrl.endsWith('/') ? '' : '/';
  return `${baseUrl}${separator}${mappedPath}`;
}

