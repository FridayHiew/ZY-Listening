// SettingsView.tsx
import React, { useState, useEffect } from 'react';
import { AppSettings, AppStorageState, LanguageCode } from '../types';
import { getTranslation } from '../utils/i18n';
import { getStorageUsageInfo } from '../utils/indexedDB';
import { Settings, Globe, Moon, Sun, Type, Lock, ShieldCheck, Trash2, Key, HardDrive, Database, FileCode, Volume2, RefreshCw } from 'lucide-react';
import { quizSounds } from '../utils/sound';

interface SettingsViewProps {
  appState: AppStorageState;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenLicenseModal: () => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  appState,
  onUpdateSettings,
  onOpenLicenseModal,
  onResetData,
}) => {
  const { settings, license } = appState;
  const lang = settings.language;
  const t = (key: any) => getTranslation(lang, key);

  const [pinInput, setPinInput] = useState(settings.pinCode || '1234');
  const [storageInfo, setStorageInfo] = useState<{ usageMB: string; quotaMB: string; isIndexedDBSupported: boolean }>({
    usageMB: '0.00',
    quotaMB: 'Calculated by browser',
    isIndexedDBSupported: true,
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceRefreshFeedback, setVoiceRefreshFeedback] = useState<string | null>(null);

  useEffect(() => {
    getStorageUsageInfo().then(setStorageInfo);
  }, []);

  const refreshVoices = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices || []);
      return voices ? voices.length : 0;
    }
    return 0;
  };

  const handleManualVoiceRefresh = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const count = refreshVoices();
      const msg = lang === 'zh'
        ? `已重新检索系统发音包 (共检测到 ${count} 个声音)`
        : lang === 'ms'
        ? `Suara sistem dikemaskini (${count} suara ditemui)`
        : `Refreshed system voices (${count} voices found)`;
      setVoiceRefreshFeedback(msg);
      setTimeout(() => setVoiceRefreshFeedback(null), 3000);
    }
  };

  useEffect(() => {
    refreshVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
      window.addEventListener('focus', refreshVoices);
      document.addEventListener('visibilitychange', refreshVoices);

      // Periodically refresh voices in background when Settings tab is active
      const timer = setInterval(refreshVoices, 3000);

      return () => {
        window.removeEventListener('focus', refreshVoices);
        document.removeEventListener('visibilitychange', refreshVoices);
        clearInterval(timer);
      };
    }
  }, []);

  const [showPinModal, setShowPinModal] = useState(false);
  const [tempPin, setTempPin] = useState('');

  const handleToggleSecurity = () => {
    if (!settings.securityEnabled) {
      setTempPin('1234');
      setShowPinModal(true);
    } else {
      onUpdateSettings({ securityEnabled: false });
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
          {t('settingsTitle')}
        </h2>
        <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
          {t('settingsDesc')}
        </p>
      </div>

      {/* License Status Card */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] flex items-center justify-center shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
              {t('licenseStatus')}
            </h3>
            <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
              {t('currentLicense')} <span className="font-bold text-[#5A6D5B] dark:text-[#A3B5A4]">{license?.payload.licenseType || 'Standard'}</span> ({license?.daysRemaining || 0} {t('daysRemaining')})
            </p>
          </div>
        </div>
        <button
          onClick={onOpenLicenseModal}
          className="px-4 py-2 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-semibold text-xs transition-colors shadow-sm"
        >
          {t('manageLicense')}
        </button>
      </div>

      {/* Language & Appearance */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif border-b border-[#E8E2D2] dark:border-[#353B35] pb-3">
          {t('languageDisplay')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="min-w-0">
            <label className="font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
              {t('language')}
            </label>
            <select
              value={settings.language}
              onChange={(e) => onUpdateSettings({ language: e.target.value as LanguageCode })}
              className="w-full max-w-full p-2.5 bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] font-medium focus:outline-none focus:ring-2 focus:ring-[#5A6D5B] truncate"
            >
              <option value="en">🇬🇧 English</option>
              <option value="zh">🇨🇳 简体中文</option>
              <option value="ms">🇲🇾 Bahasa Melayu</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
              {t('theme')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`py-2 px-1 rounded-xl border font-semibold flex items-center justify-center gap-1 text-xs transition-all ${
                  settings.theme === 'light'
                    ? 'bg-[#5A6D5B] text-white border-[#5A6D5B] shadow-sm'
                    : 'bg-[#F5F2EA] dark:bg-[#2D322D] text-[#2D2A26] dark:text-[#EAE7DF] border-[#E8E2D2] dark:border-[#353B35] hover:bg-[#EAE5D8]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> {t('lightMode')}
              </button>
              <button
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`py-2 px-1 rounded-xl border font-semibold flex items-center justify-center gap-1 text-xs transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-[#5A6D5B] text-white border-[#5A6D5B] shadow-sm'
                    : 'bg-[#F5F2EA] dark:bg-[#2D322D] text-[#2D2A26] dark:text-[#EAE7DF] border-[#E8E2D2] dark:border-[#353B35] hover:bg-[#EAE5D8]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> {t('darkMode')}
              </button>
              <button
                onClick={() => onUpdateSettings({ theme: 'system' })}
                className={`py-2 px-1 rounded-xl border font-semibold flex items-center justify-center gap-1 text-xs transition-all ${
                  settings.theme === 'system'
                    ? 'bg-[#5A6D5B] text-white border-[#5A6D5B] shadow-sm'
                    : 'bg-[#F5F2EA] dark:bg-[#2D322D] text-[#2D2A26] dark:text-[#EAE7DF] border-[#E8E2D2] dark:border-[#353B35] hover:bg-[#EAE5D8]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> {t('systemMode')}
              </button>
            </div>
          </div>
        </div>

        {/* Font Size Adjuster */}
        <div>
          <label className="font-semibold text-[#6B6559] dark:text-[#A09886] block text-xs mb-1">
            {t('fontSize')}
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(['small', 'medium', 'large'] as const).map((size) => {
              const code = size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L';
              const label = size === 'small' ? t('textSizeSmall') : size === 'medium' ? t('textSizeMedium') : t('textSizeLarge');
              return (
                <button
                  key={size}
                  onClick={() => onUpdateSettings({ fontSize: size })}
                  className={`py-2 rounded-xl border text-center font-bold transition-all ${
                    settings.fontSize === size
                      ? 'bg-[#5A6D5B] text-white border-[#5A6D5B] shadow-sm'
                      : 'bg-[#F5F2EA] dark:bg-[#2D322D] text-[#2D2A26] dark:text-[#EAE7DF] border-[#E8E2D2] dark:border-[#353B35] hover:bg-[#EAE5D8]'
                  }`}
                >
                  <div className="text-sm font-black">{code}</div>
                  <div className={`text-[10px] mt-0.5 ${settings.fontSize === size ? 'text-white/80' : 'text-[#7C776B] dark:text-[#A09886]'}`}>
                    {label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Speech Synthesizer Voice & Speed Settings */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif border-b border-[#E8E2D2] dark:border-[#353B35] pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#5A6D5B] dark:text-[#A3B5A4]" />
            {lang === 'zh' ? '语音朗读 (TTS) 语速与发音设置' : lang === 'ms' ? 'Kelajuan & Suara Sebutan (TTS)' : 'Text-To-Speech (TTS) Settings'}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#5A6D5B]/15 text-[#3E4A3E] dark:text-[#A3B5A4] font-semibold">
            TTS Options
          </span>
        </h3>

        {/* Voice Mode Selector (Online vs Offline) */}
        <div className="p-3.5 bg-[#F5F2EA] dark:bg-[#2D322D] rounded-xl border border-[#E8E2D2] dark:border-[#353B35] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#2D2A26] dark:text-[#EAE7DF]">
              {lang === 'zh' ? '发音模式:' : lang === 'ms' ? 'Mod Sebutan:' : 'Voice Mode:'}
            </label>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#5A6D5B]/15 text-[#3E4A3E] dark:text-[#A3B5A4] font-bold">
              {(settings.voiceMode ?? 'online') === 'online'
                ? (lang === 'zh' ? '联网高音质' : lang === 'ms' ? 'Talian (Neural)' : 'Online (Neural)')
                : (lang === 'zh' ? '本地极速' : lang === 'ms' ? 'Luar Talian (Pantas)' : 'Offline (Instant)')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { mode: 'online', label: lang === 'zh' ? '联网高音质' : lang === 'ms' ? 'Talian' : 'Online Voice', desc: lang === 'zh' ? '微软神经网络，发音极佳' : lang === 'ms' ? 'Suara premium neural' : 'Microsoft Neural voice' },
              { mode: 'offline', label: lang === 'zh' ? '本地离线极速' : lang === 'ms' ? 'Luar Talian' : 'Offline Voice', desc: lang === 'zh' ? '0 延迟，无需流量' : lang === 'ms' ? 'Pantas & tiada lag' : 'Instant local fallback' },
            ].map(({ mode, label, desc }) => {
              const currentMode = settings.voiceMode ?? 'online';
              const isActive = currentMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => {
                    onUpdateSettings({ voiceMode: mode as 'online' | 'offline' });
                    // Test sample word immediately upon selection
                    setTimeout(() => {
                      quizSounds.speak(lang === 'zh' ? '学校' : lang === 'ms' ? 'Melaka' : 'Butterfly', lang === 'zh' ? 'zh' : lang === 'ms' ? 'ms' : 'en');
                    }, 50);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isActive
                      ? 'bg-[#5A6D5B] text-white border-[#5A6D5B] shadow-sm font-bold'
                      : 'bg-white dark:bg-[#242824] text-[#2D2A26] dark:text-[#EAE7DF] border-[#E8E2D2] dark:border-[#353B35] hover:bg-[#E8E2D2]/50'
                  }`}
                >
                  <div className="text-xs font-bold">{label}</div>
                  <div className={`text-[10px] mt-0.5 ${isActive ? 'text-white/80' : 'text-[#7C776B] dark:text-[#A09886]'}`}>
                    {desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Speech Speed Selector (1.25x, 1.0x, 0.75x, 0.5x) */}
        <div className="p-3.5 bg-[#F5F2EA] dark:bg-[#2D322D] rounded-xl border border-[#E8E2D2] dark:border-[#353B35] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#2D2A26] dark:text-[#EAE7DF]">
              {lang === 'zh' ? '朗读语速:' : lang === 'ms' ? 'Kelajuan Sebutan:' : 'Speech Speed:'}
            </label>
            <span className="text-xs font-mono font-bold text-[#5A6D5B] dark:text-[#A3B5A4]">
              {settings.speechSpeed ?? 1.0}x
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { rate: 1.25, label: '1.25x', desc: lang === 'zh' ? '较快' : lang === 'ms' ? 'Laju' : 'Fast' },
              { rate: 1.0, label: '1.0x', desc: lang === 'zh' ? '正常' : lang === 'ms' ? 'Normal' : 'Normal' },
              { rate: 0.75, label: '0.75x', desc: lang === 'zh' ? '较慢' : lang === 'ms' ? 'Sederhana' : 'Moderate' },
              { rate: 0.5, label: '0.5x', desc: lang === 'zh' ? '慢速' : lang === 'ms' ? 'Perlahan' : 'Slow' },
            ].map(({ rate, label, desc }) => {
              const currentRate = settings.speechSpeed ?? 1.0;
              const isActive = currentRate === rate;
              return (
                <button
                  key={rate}
                  onClick={() => {
                    onUpdateSettings({ speechSpeed: rate });
                    // Test sample phrase immediately in active language
                    const sampleText = lang === 'zh' ? '欢迎来到学习天地' : lang === 'ms' ? 'Selamat datang ke aplikasi' : 'Butterfly and dragonfly';
                    quizSounds.speak(sampleText, lang, rate);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isActive
                      ? 'bg-[#5A6D5B] text-white border-[#5A6D5B] shadow-sm font-bold'
                      : 'bg-white dark:bg-[#242824] text-[#2D2A26] dark:text-[#EAE7DF] border-[#E8E2D2] dark:border-[#353B35] hover:bg-[#E8E2D2]/50'
                  }`}
                >
                  <div className="text-xs font-bold">{label}</div>
                  <div className={`text-[10px] mt-0.5 ${isActive ? 'text-white/80' : 'text-[#7C776B] dark:text-[#A09886]'}`}>
                    {desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Device Offline Voice Picker */}
        <div className="p-3.5 bg-[#F5F2EA] dark:bg-[#2D322D] rounded-xl border border-[#E8E2D2] dark:border-[#353B35] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-[#2D2A26] dark:text-[#EAE7DF] block">
                {lang === 'zh' ? '设备离线发音包自定义:' : lang === 'ms' ? 'Pilih Suara Peranti Tempatan:' : 'Select Preferred Installed Device Voice:'}
              </label>
              <span className="text-[10px] text-[#7C776B] dark:text-[#A09886] block mt-0.5">
                {lang === 'zh' ? '可在下方直接指定手机安装的具体声音。' : lang === 'ms' ? 'Pilih suara telefon yang dipasang di bawah.' : 'Select specific installed phone voices below.'}
              </span>
            </div>

            <button
              onClick={handleManualVoiceRefresh}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-[#242824] hover:bg-[#E8E2D2]/50 text-[#5A6D5B] dark:text-[#B2C2B3] border border-[#E8E2D2] dark:border-[#353B35] rounded-lg text-xs font-bold transition-all active:scale-95 shrink-0"
              title={lang === 'zh' ? '刷新手机系统语音列表' : 'Refresh System Voices'}
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-once" />
              <span>{lang === 'zh' ? '刷新语音列表' : lang === 'ms' ? 'Kemaskini Suara' : 'Query/Refresh Voices'}</span>
            </button>
          </div>

          {voiceRefreshFeedback && (
            <div className="p-2 bg-[#5A6D5B]/10 border border-[#5A6D5B]/30 rounded-lg text-xs font-semibold text-[#5A6D5B] dark:text-[#B2C2B3] flex items-center gap-1.5 animate-fadeIn">
              <span>✨</span>
              <span>{voiceRefreshFeedback}</span>
            </div>
          )}

          <div className="space-y-2.5">
            {[
              {
                id: 'en',
                label: '🇬🇧 English (英语)',
                sample: 'Butterfly',
                settingKey: 'preferredVoiceEn' as const,
                currentVal: settings.preferredVoiceEn,
                voicesList: availableVoices.filter((v) => v.lang.toLowerCase().startsWith('en')),
              },
              {
                id: 'zh',
                label: '🇨🇳 Chinese (中文)',
                sample: '学校',
                settingKey: 'preferredVoiceZh' as const,
                currentVal: settings.preferredVoiceZh,
                voicesList: availableVoices.filter((v) => v.lang.toLowerCase().startsWith('zh')),
              },
              {
                id: 'ms',
                label: '🇲🇾 Malay (马来语)',
                sample: 'Melaka',
                settingKey: 'preferredVoiceMs' as const,
                currentVal: settings.preferredVoiceMs,
                voicesList: availableVoices.filter((v) => v.lang.toLowerCase().startsWith('ms') || v.lang.toLowerCase().startsWith('id')),
              },
            ].map(({ id, label, sample, settingKey, currentVal, voicesList }) => (
              <div key={id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white dark:bg-[#242824] rounded-lg border border-[#E8E2D2] dark:border-[#353B35] min-w-0">
                <div className="text-xs font-bold text-[#2D2A26] dark:text-[#EAE7DF] sm:w-1/3 shrink-0">
                  {label}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0 w-full overflow-hidden">
                  <select
                    value={currentVal || ''}
                    onFocus={refreshVoices}
                    onClick={refreshVoices}
                    onChange={(e) => {
                      const val = e.target.value || undefined;
                      onUpdateSettings({ [settingKey]: val });
                      setTimeout(() => {
                        quizSounds.speak(sample, id as 'en' | 'zh' | 'ms');
                      }, 50);
                    }}
                    className="flex-1 min-w-0 w-full max-w-full text-xs p-1.5 rounded-lg bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-1 focus:ring-[#5A6D5B] truncate"
                  >
                    <option value="">{lang === 'zh' ? '✨ 默认 (智能自动择优)' : lang === 'ms' ? '✨ Default (Auto)' : '✨ Default (Smart Auto Select)'}</option>
                    {voicesList.map((v, idx) => (
                      <option key={`${v.voiceURI || v.name}-${v.lang}-${idx}`} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => quizSounds.speak(sample, id as 'en' | 'zh' | 'ms')}
                    className="p-1.5 rounded-lg bg-[#5A6D5B] hover:bg-[#485749] text-white transition-all active:scale-95 shrink-0"
                    title="Test Voice"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>

      {/* App Lock Security Settings */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif border-b border-[#E8E2D2] dark:border-[#353B35] pb-3">
          {t('appLockTitle')}
        </h3>

        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF] block">
              {t('appLockDesc')}
            </span>
            <span className="text-[#7C776B] dark:text-[#A09886]">
              {lang === 'zh' ? '开启后启动应用时需输入 4 位 PIN 码验证' : 'Requires 4-digit PIN code to unlock on launch'}
            </span>
          </div>
          <button
            onClick={handleToggleSecurity}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              settings.securityEnabled
                ? 'bg-[#5A6D5B] text-white'
                : 'bg-[#F5F2EA] dark:bg-[#2D322D] text-[#2D2A26] dark:text-[#EAE7DF]'
            }`}
          >
            {settings.securityEnabled
              ? (lang === 'zh' ? `已启用 (PIN: ${settings.pinCode || '1234'})` : `${t('appLockStatus')} (PIN: ${settings.pinCode || '1234'})`)
              : (lang === 'zh' ? '已禁用' : t('appLockUnlocked'))}
          </button>
        </div>

        {showPinModal && (
          <div className="p-3.5 mt-3 bg-[#F5F2EA] dark:bg-[#2D322D] rounded-xl border border-[#E8E2D2] dark:border-[#353B35] space-y-3 animate-fadeIn">
            <div className="font-bold text-xs text-[#2D2A26] dark:text-[#EAE7DF]">
              {lang === 'zh' ? '🔒 设置 4 位安全 PIN 码:' : '🔒 Set 4-Digit Security PIN Code:'}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                maxLength={4}
                value={tempPin}
                onChange={(e) => setTempPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                className="w-32 p-2 rounded-lg bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] text-center font-mono font-bold text-sm tracking-widest text-[#2D2A26] dark:text-[#EAE7DF]"
              />
              <button
                onClick={() => {
                  if (tempPin.length === 4) {
                    onUpdateSettings({ securityEnabled: true, pinCode: tempPin });
                    setShowPinModal(false);
                  }
                }}
                disabled={tempPin.length !== 4}
                className="px-3 py-2 bg-[#5A6D5B] disabled:opacity-50 hover:bg-[#485749] text-white rounded-lg text-xs font-bold transition-all"
              >
                {lang === 'zh' ? '保存并启用' : 'Save & Enable'}
              </button>
              <button
                onClick={() => setShowPinModal(false)}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-300 transition-all"
              >
                {lang === 'zh' ? '取消' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Local Browser DB (IndexedDB) + JSON Files Info */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif border-b border-[#E8E2D2] dark:border-[#353B35] pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#5A6D5B] dark:text-[#A3B5A4]" />
            {lang === 'zh' ? '本地浏览器数据库架构 (IndexedDB + JSON)' : 'Local Browser DB Architecture (IndexedDB + JSON)'}
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#5A6D5B]/15 text-[#3E4A3E] dark:text-[#A3B5A4] font-semibold">
            {storageInfo.isIndexedDBSupported ? 'IndexedDB Active' : 'LocalStorage Fallback'}
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#F5F2EA] dark:bg-[#2D322D] rounded-xl border border-[#E8E2D2] dark:border-[#353B35] space-y-1">
            <div className="flex items-center gap-2 font-bold text-[#3E4A3E] dark:text-[#F5F2EA]">
              <Database className="w-4 h-4 text-[#5A6D5B]" />
              <span>{t('storageTitle')}</span>
            </div>
            <p className="text-[11px] text-[#7C776B] dark:text-[#A09886]">
              {t('storageUsed')}: <strong className="text-[#3E4A3E] dark:text-[#F5F2EA]">{storageInfo.usageMB} MB</strong> ({lang === 'zh' ? '配额上限:' : 'Quota Limit:'} {storageInfo.quotaMB} MB)
            </p>
            <p className="text-[10px] text-[#7C776B]/80 dark:text-[#A09886]/80 mt-1">
              {lang === 'zh' ? '异步 IndexedDB 支持海量题目集合与图表离线存储。' : 'Asynchronous IndexedDB handles high-capacity collections & images.'}
            </p>
          </div>

          <div className="p-3 bg-[#F5F2EA] dark:bg-[#2D322D] rounded-xl border border-[#E8E2D2] dark:border-[#353B35] space-y-1">
            <div className="flex items-center gap-2 font-bold text-[#3E4A3E] dark:text-[#F5F2EA]">
              <FileCode className="w-4 h-4 text-[#5A6D5B]" />
              <span>{lang === 'zh' ? 'JSON / ZIP 导入导出' : 'JSON / ZIP File Engine'}</span>
            </div>
            <p className="text-[11px] text-[#7C776B] dark:text-[#A09886]">
              {lang === 'zh' ? '已加载题库集合:' : 'Active Collections:'} <strong className="text-[#3E4A3E] dark:text-[#F5F2EA]">{appState.collections.length}</strong> {t('collections')}
            </p>
            <p className="text-[10px] text-[#7C776B]/80 dark:text-[#A09886]/80 mt-1">
              {lang === 'zh' ? '完全兼容 AI 提示词生成的 JSON 及 ZIP 备份文件。' : 'Fully compatible with AI prompt JSON schema & ZIP backups.'}
            </p>
          </div>
        </div>
      </div>

      {/* Storage & Reset */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 font-serif border-b border-[#E8E2D2] dark:border-[#353B35] pb-3">
          {t('dangerZone')}
        </h3>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF] block">
                {t('resetAllData')}
              </span>
              <span className="text-[#7C776B] dark:text-[#A09886]">
                {lang === 'zh' ? '清空所有答题记录，并将知识库恢复为初始状态。' : 'Clears study history and resets question collections to initial state.'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {!showResetConfirm ? (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setResetCompleted(false);
                    setShowResetConfirm(true);
                  }}
                  className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl font-bold text-xs hover:bg-rose-100 transition-colors shadow-sm"
                >
                  {t('resetAllData')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-3 w-full">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900 rounded-xl w-full text-xs font-semibold">
                  ⚠️ {t('confirmReset')}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await onResetData();
                      setShowResetConfirm(false);
                      setResetCompleted(true);
                      setTimeout(() => setResetCompleted(false), 5000);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                  >
                    {t('confirmResetBtn')}
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] text-[#2D2A26] dark:text-[#EAE7DF] rounded-xl font-bold text-xs hover:bg-[#EAE5D8] transition-colors"
                  >
                    {t('cancelBtn')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {resetCompleted && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900 rounded-xl text-xs font-semibold animate-pulse">
              ✨ {t('resetComplete')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};