import React, { useState, useEffect } from 'react';
import { AppSettings, AppStorageState, KnowledgeCollection, LicenseData, QuizConfig, QuizResult } from './types';
import { calculateAndUpdateStreak, loadAppState, loadAppStateAsync, resetAppState, saveAppState } from './utils/storage';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { SplashScreen } from './components/SplashScreen';
import { LicenseGate } from './components/LicenseGate';
import { PinLockModal } from './components/PinLockModal';
import { LicenseRequiredPlaceholder } from './components/LicenseRequiredPlaceholder';
import { getTranslation } from './utils/i18n';

import { DashboardView } from './views/DashboardView';
import { LibraryView } from './views/LibraryView';
import { ImportView } from './views/ImportView';
import { QuizView } from './views/QuizView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { BackupRestoreView } from './views/BackupRestoreView';
import { AdminLicenseGeneratorView } from './views/AdminLicenseGeneratorView';
import { X, User } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppStorageState>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [activeQuizConfig, setActiveQuizConfig] = useState<QuizConfig | null>(null);

  // Splash Screen State
  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(true);

  // Security Lock
  const [isLocked, setIsLocked] = useState<boolean>(() => appState.settings.securityEnabled);

  // Modals
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Auto-hydrate state from IndexedDB on startup
  useEffect(() => {
    loadAppStateAsync().then((hydratedState) => {
      setAppState(hydratedState);
    }).catch((err) => {
      console.warn('IndexedDB initial load error:', err);
    });
  }, []);

  // Apply theme and font size scale to documentElement
  useEffect(() => {
    const root = document.documentElement;

    // Theme handling
    const applyDark = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (appState.settings.theme === 'dark') {
      applyDark(true);
    } else if (appState.settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyDark(mediaQuery.matches);
      
      const listener = (e: MediaQueryListEvent) => applyDark(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyDark(false);
    }
  }, [appState.settings.theme]);

  useEffect(() => {
    const root = document.documentElement;
    const fontScale = appState.settings.fontSize || 'medium';
    root.classList.remove('font-scale-small', 'font-scale-medium', 'font-scale-large');
    root.classList.add(`font-scale-${fontScale}`);

    if (fontScale === 'small') {
      root.style.fontSize = '14px';
    } else if (fontScale === 'large') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }
  }, [appState.settings.fontSize]);

  // Always scroll to top when changing tabs or entering/exiting quiz
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab, activeQuizConfig]);

  // Handler: Update Settings
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const updated: AppStorageState = {
      ...appState,
      settings: { ...appState.settings, ...newSettings },
    };
    setAppState(updated);
    saveAppState(updated);
  };

  // Handler: Update Collections
  const handleUpdateCollections = (collections: KnowledgeCollection[]) => {
    const updated: AppStorageState = {
      ...appState,
      collections,
    };
    setAppState(updated);
    saveAppState(updated);
  };

  // Handler: Activate License
  const handleActivateLicense = (license: LicenseData) => {
    const updated: AppStorageState = {
      ...appState,
      license,
    };
    setAppState(updated);
    saveAppState(updated);
  };

  // Handler: Delete Current License
  const handleDeleteLicense = () => {
    const updated: AppStorageState = {
      ...appState,
      license: null,
    };
    setAppState(updated);
    saveAppState(updated);
  };

  // Handler: Start Quiz
  const handleStartQuiz = (config: QuizConfig) => {
    // Check license requirement
    if (appState.license && !appState.license.isValid) {
      alert('License activation required to launch practice or exam sessions.');
      setActiveTab('license');
      return;
    }
    setActiveQuizConfig(config);
  };

  // Handler: Complete Quiz
  const handleFinishQuiz = (result: QuizResult) => {
    let updatedResults = [...appState.quizResults, result];
    let updatedState: AppStorageState = {
      ...appState,
      quizResults: updatedResults,
    };

    // Calculate daily streak
    updatedState = calculateAndUpdateStreak(updatedState, result.totalQuestions);

    setAppState(updatedState);
    saveAppState(updatedState);
  };

  // Handler: Reset All Data
  const handleResetData = async () => {
    await resetAppState();
    const fresh = loadAppState();
    setAppState(fresh);
  };

  const isAdmin = appState.license?.payload.licenseType === 'ADMIN';
  const hasValidLicense = !!(appState.license && appState.license.isValid);

  // Render App UI
  return (
        <div className="min-h-screen bg-[#FFF8F0] dark:bg-[#2A2A2A] text-[#2D2A26] dark:text-[#EAE7DF] font-sans transition-colors">
      {/* Splash Screen on Launch or Request */}
      {showSplashScreen && (
        <SplashScreen
          lang={appState.settings.language}
          onDismiss={() => setShowSplashScreen(false)}
        />
      )}

      {/* Header */}
      <Header
        license={appState.license}
        settings={appState.settings}
        profile={appState.profile}
        onUpdateSettings={handleUpdateSettings}
        onOpenLicenseModal={() => setActiveTab('license')}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onLockApp={() => setIsLocked(true)}
        onShowSplash={() => setShowSplashScreen(true)}
      />

      {/* Navigation Bar */}
      {!activeQuizConfig && (
        <>
          <Navigation
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            isAdmin={isAdmin}
            settings={appState.settings}
            hasValidLicense={hasValidLicense}
          />
          <PWAInstallPrompt lang={appState.settings.language} />
        </>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-24 md:pb-8">
        {/* Active Quiz Engine View */}
        {activeQuizConfig ? (
          <QuizView
            appState={appState}
            config={activeQuizConfig}
            onFinishQuiz={handleFinishQuiz}
            onExitQuiz={() => setActiveQuizConfig(null)}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                appState={appState}
                onStartQuiz={handleStartQuiz}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'library' && (
              <LibraryView
                appState={appState}
                onUpdateCollections={handleUpdateCollections}
                onStartQuiz={handleStartQuiz}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'import' && (
              !hasValidLicense ? (
                <LicenseRequiredPlaceholder
                  lang={appState.settings.language}
                  moduleName={getTranslation(appState.settings.language, 'import')}
                  onOpenLicense={() => setActiveTab('license')}
                />
              ) : (
                <ImportView
                  appState={appState}
                  isAdmin={isAdmin}
                  onUpdateCollections={handleUpdateCollections}
                  onNavigateTab={setActiveTab}
                />
              )
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView
                appState={appState}
                onStartQuiz={handleStartQuiz}
              />
            )}

            {activeTab === 'backup' && (
              hasValidLicense ? (
                <BackupRestoreView
                  appState={appState}
                  onRestoreState={(newState) => setAppState(newState)}
                />
              ) : (
                <LicenseRequiredPlaceholder
                  lang={appState.settings.language}
                  moduleName={getTranslation(appState.settings.language, 'backupRestore')}
                  onOpenLicense={() => setActiveTab('license')}
                />
              )
            )}

            {activeTab === 'admin' && (
              <AdminLicenseGeneratorView
                currentDeviceId={appState.deviceId}
                settings={appState.settings}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                appState={appState}
                onUpdateSettings={handleUpdateSettings}
                onOpenLicenseModal={() => setActiveTab('license')}
                onResetData={handleResetData}
              />
            )}

            {activeTab === 'license' && (
              <div className="py-4">
                <LicenseGate
                  deviceId={appState.deviceId}
                  clockWatermark={appState.clockWatermark}
                  currentLicense={appState.license}
                  settings={appState.settings}
                  onActivateLicense={(license) => {
                    handleActivateLicense(license);
                    setTimeout(() => {
                      setActiveTab('settings');
                    }, 1500);
                  }}
                  onDeleteLicense={handleDeleteLicense}
                  onCloseModal={() => setActiveTab('settings')}
                  isModalView={false}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* PIN Security Lock Modal */}
      {isLocked && appState.settings.securityEnabled && (
        <PinLockModal
          settings={appState.settings}
          onUnlockSuccess={() => setIsLocked(false)}
        />
      )}

      {/* License modal removed to act as a page */}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-[#2D2A26]/60 dark:bg-[#1C1E1C]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FDFCF8] dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D2] dark:border-[#353B35]">
              <h3 className="font-bold text-base text-[#3E4A3E] dark:text-[#F5F2EA] flex items-center gap-2 font-serif">
                <User className="w-4 h-4 text-[#5A6D5B]" />
                <span>Learner Profile</span>
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-[#7C776B] hover:text-[#2D2A26]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={appState.profile.displayName}
                  onChange={(e) => {
                    const updated = {
                      ...appState,
                      profile: { ...appState.profile, displayName: e.target.value },
                    };
                    setAppState(updated);
                    saveAppState(updated);
                  }}
                  className="w-full p-2.5 bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] font-medium"
                />
              </div>

              <div className="p-3 bg-[#F5F2EA] dark:bg-[#2D322D] rounded-xl border border-[#E8E2D2] dark:border-[#353B35] space-y-1">
                <div className="text-[11px] text-[#7C776B] dark:text-[#A09886] font-semibold">Device Fingerprint:</div>
                <div className="font-mono text-[11px] font-bold text-[#2D2A26] dark:text-[#EAE7DF]">{appState.deviceId}</div>
              </div>

              <div className="p-3 bg-[#EAE5D8] dark:bg-[#2D322D] rounded-xl border border-[#D9C5B2] dark:border-[#353B35] space-y-1">
                <div className="text-[11px] text-[#5A6D5B] dark:text-[#A3B5A4] font-semibold">License Status:</div>
                <div className="font-bold text-[#3E4A3E] dark:text-[#F5F2EA]">
                  {appState.license?.payload.licenseType || 'Standard'} License ({appState.license?.daysRemaining || 0} days remaining)
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-[#5A6D5B] hover:bg-[#485749] text-white font-semibold text-xs rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
