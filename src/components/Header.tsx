import React, { useState, useEffect } from 'react';
import { AppSettings, LanguageCode, LicenseData, UserProfile } from '../types';
import { getTranslation } from '../utils/i18n';
import { BaguaBookLogo } from './BaguaBookLogo';
import { ShieldCheck, ShieldAlert, Key, Moon, Sun, Lock, WifiOff, Wifi, Sparkles } from 'lucide-react';

interface HeaderProps {
  license: LicenseData | null;
  settings: AppSettings;
  profile: UserProfile;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenLicenseModal: () => void;
  onOpenProfileModal: () => void;
  onLockApp: () => void;
  onShowSplash?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  license,
  settings,
  profile,
  onUpdateSettings,
  onOpenLicenseModal,
  onOpenProfileModal,
  onLockApp,
  onShowSplash,
}) => {
  const lang = settings.language;
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    onUpdateSettings({ theme: nextTheme });
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FDFCF8]/90 dark:bg-[#1C1E1C]/90 backdrop-blur-md border-b border-[#E8E2D2] dark:border-[#353B35] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* App Title & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onShowSplash}
            title="Click to view Splash Screen"
            className="group p-1 rounded-xl bg-[#5A6D5B]/10 hover:bg-[#5A6D5B]/20 dark:bg-[#708571]/20 dark:hover:bg-[#708571]/30 transition-all active:scale-95 shrink-0"
          >
            <BaguaBookLogo className="w-9 h-9 sm:w-10 sm:h-10 transition-transform group-hover:scale-105" />
          </button>
          <div>
            <h1
              onClick={onShowSplash}
              className="text-base font-bold text-[#3E4A3E] dark:text-[#F5F2EA] leading-tight flex items-center gap-2 font-serif cursor-pointer hover:opacity-90"
            >
              <span>{getTranslation(lang, 'appName')}</span>
              {!isOnline && (
                <span className="text-[10px] tracking-tight px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                  <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>{lang === 'zh' ? '离线模式' : 'Offline Mode'}</span>
                </span>
              )}
            </h1>
            <p className="text-xs text-[#7C776B] dark:text-[#A09886] hidden sm:block italic font-serif">
              {lang === 'zh' ? '“化繁为易，耳听万词”' : lang === 'ms' ? '“Dengar & kuasai perbendaharaan kata”' : '“Listen to learn, master with fun!”'}
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* License Status Badge - Hide on mobile */}
          <button
            onClick={onOpenLicenseModal}
            className={`hidden md:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
              !license || !license.isValid
                ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                : license.isInGracePeriod
                ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                : license.payload.licenseType === 'ADMIN'
                ? 'bg-[#EAE5D8] text-[#3E4A3E] border-[#D9C5B2] dark:bg-[#2D322D] dark:text-[#F5F2EA] dark:border-[#353B35]'
                : 'bg-[#EAE5D8] text-[#5A6D5B] border-[#B8C0B0] dark:bg-[#2D322D] dark:text-[#A3B5A4] dark:border-[#353B35]'
            }`}
            title={lang === 'zh' ? '管理许可证状态' : 'Manage License Status'}
          >
            {!license || !license.isValid ? (
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#5A6D5B] dark:text-[#A3B5A4]" />
            )}
            <span className="hidden md:inline">
              {!license || !license.isValid
                ? (lang === 'zh' ? '未激活许可证' : 'Inactive License')
                : license.isInGracePeriod
                ? (lang === 'zh' ? '7天宽限期' : 'Grace Period')
                : `${license.payload.licenseType} ${lang === 'zh' ? '许可证' : 'License'}`}
            </span>
            {license && license.isValid && (
              <span className="text-[11px] opacity-80 font-normal">
                ({license.daysRemaining}{lang === 'zh' ? '天' : 'd'})
              </span>
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-[#7C776B] dark:text-[#A09886] hover:bg-[#F5F2EA] dark:hover:bg-[#2D322D] transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#5A6D5B]" />
            )}
          </button>

          {/* Security PIN Lock button - Hide on mobile */}
          {settings.securityEnabled && (
            <button
              onClick={onLockApp}
              className="hidden md:block p-1.5 rounded-lg text-[#7C776B] dark:text-[#A09886] hover:bg-[#F5F2EA] dark:hover:bg-[#2D322D] transition-colors"
              title="Lock App Screen"
            >
              <Lock className="w-4 h-4 text-[#5A6D5B] dark:text-[#A3B5A4]" />
            </button>
          )}

          {/* Profile Button */}
          <button
            onClick={onOpenProfileModal}
            className="flex items-center gap-2 pl-2 border-l border-[#E8E2D2] dark:border-[#353B35] hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-[#EAE5D8] dark:bg-[#2D322D] border border-[#D9C5B2] dark:border-[#353B35] text-[#5A6D5B] dark:text-[#A3B5A4] font-bold text-xs flex items-center justify-center">
              {profile.displayName.substring(0, 2).toUpperCase()}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
