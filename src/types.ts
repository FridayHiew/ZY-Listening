/**
 * Core Data Models for Offline Knowledge Training Platform
 */

export type LicenseType = 'USER' | 'ADMIN' | 'VIP';

export interface LicensePayload {
  licenseId: string;
  deviceId: string;
  licenseType: LicenseType;
  issuedAt: string; // ISO date string
  expiresAt: string; // ISO date string
  version: number;
  holderName?: string;
}

export interface LicenseData {
  key: string;
  payload: LicensePayload;
  activatedAt: string;
  isValid: boolean;
  isExpired: boolean;
  isInGracePeriod: boolean;
  daysRemaining: number;
}

export interface Question {
  id: string;
  category: string;
  questionText: string;
  options: [string, string, string, string]; // Exactly 4 options A, B, C, D
  correctIndex: number; // 0, 1, 2, or 3
  explanation?: string;
  image?: string; // Data URL or relative image path
  difficulty?: string;
  knowledgeLevel?: string;
  questionType?: string;
  tags?: string[];
  statements?: Record<string, string>;
  sourceReference?: string;
}

export interface KnowledgeCollection {
  id: string;
  name: string;
  description?: string;
  group?: string;
  language?: LanguageCode;
  version: number;
  difficulty?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  questionCount: number;
  categories: string[];
  questions: Question[];
}

export type QuizMode = 'PRACTICE' | 'EXAM' | 'MISTAKE_REVIEW' | 'WEAK_TOPICS';

export interface QuizConfig {
  collectionId?: string; // Optional if cross-collection (e.g. mistake review or weak topics)
  collectionName?: string;
  mode: QuizMode;
  questionCount: number;
  timeLimitMinutes?: number; // 0 or undefined for no timer
  passMarkPercentage?: number; // Default 70%
  categoryFilter?: string;
}

export interface UserAnswerRecord {
  questionId: string;
  questionText: string;
  category: string;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  shuffledOptions?: string[];
  originalCorrectText?: string;
}

export interface QuizResult {
  id: string;
  collectionId?: string;
  collectionName: string;
  mode: QuizMode;
  date: string; // ISO string
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  answerRecords: UserAnswerRecord[];
}

export interface CategoryMetric {
  category: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number; // 0 to 100
  weightedAccuracy: number; // calculated with recency decay
  isWeak: boolean; // weightedAccuracy < 60% and attempts >= 5
}

export interface UserProfile {
  displayName: string;
  avatarSeed: string;
  createdAt: string;
}

export type LanguageCode = 'en' | 'zh' | 'ms';
export type AppTheme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';

export type SpeechSpeed = 1.25 | 1.0 | 0.8 | 0.75 | 0.6 | 0.5 | number;

export interface AppSettings {
  language: LanguageCode;
  theme: AppTheme;
  fontSize: FontSize;
  speechSpeed?: SpeechSpeed;
  voiceMode?: 'online' | 'offline';
  useSupertonic3?: boolean;
  preferredVoiceEn?: string;
  preferredVoiceZh?: string;
  preferredVoiceMs?: string;
  securityEnabled: boolean;
  pinCode?: string; // 4-digit PIN code if enabled
  dailyStudyReminder: boolean;
  reminderTime: string; // "20:00"
  examTimerDefaultMinutes: number; // 1 min per q or fixed 20
  defaultPassMark: number; // 70%
}

export interface AppStorageState {
  deviceId: string;
  clockWatermark: number; // Highest observed timestamp in ms
  license: LicenseData | null;
  profile: UserProfile;
  settings: AppSettings;
  collections: KnowledgeCollection[];
  quizResults: QuizResult[];
  lastStudyDate?: string;
  currentStreak: number;
}

export interface ImportConflictOption {
  type: 'SKIP' | 'OVERWRITE' | 'IMPORT_NEW';
}

export interface ValidationReport {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: { row: number; field: string; message: string }[];
  warnings: string[];
  extractedQuestions: Question[];
  collectionName: string;
  collectionDescription?: string;
  collectionDifficulty?: string;
  collectionGroup?: string;
  collectionLanguage?: LanguageCode;
  collectionTags?: string[];
}

export interface GeneratedLicenseRecord {
  id: string;
  key: string;
  deviceId: string;
  licenseType: LicenseType;
  issuedAt: string;
  expiresAt: string;
  holderName?: string;
}
