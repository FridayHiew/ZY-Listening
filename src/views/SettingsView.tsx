// SettingsView.tsx
import React, { useState, useEffect } from 'react';
import { AppSettings, AppStorageState, LanguageCode } from '../types';
import { getTranslation } from '../utils/i18n';
import { getStorageUsageInfo } from '../utils/indexedDB';
import { Settings, Globe, Moon, Sun, Type, Lock, ShieldCheck, Trash2, Key, HardDrive, Database, FileCode, Volume2 } from 'lucide-react';
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

  useEffect(() => {
    getStorageUsageInfo().then(setStorageInfo);
  }, [appState]);

  const handleToggleSecurity = () => {
    if (!settings.securityEnabled) {
      const newPin = prompt(lang === 'zh' ? '设置 4 位安全 PIN 码：' : 'Set 4-Digit Security PIN Code:', '1234');
      if (newPin && newPin.length === 4) {
        onUpdateSettings({ securityEnabled: true, pinCode: newPin });
      }
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
          <div>
            <label className="font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
              {t('language')}
            </label>
            <select
              value={settings.language}
              onChange={(e) => onUpdateSettings({ language: e.target.value as LanguageCode })}
              className="w-full p-2.5 bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] font-medium focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
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
            {lang === 'zh' ? '语音朗读 (TTS) 语速设置' : lang === 'ms' ? 'Tetapan Kelajuan Suara (TTS)' : 'Text-To-Speech (TTS) Speed Settings'}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#5A6D5B]/15 text-[#3E4A3E] dark:text-[#A3B5A4] font-semibold">
            Web Speech API
          </span>
        </h3>

        {/* Speech Speed Selector (1.0x, 0.8x, 0.6x) */}
        <div className="p-3.5 bg-[#F5F2EA] dark:bg-[#2D322D] rounded-xl border border-[#E8E2D2] dark:border-[#353B35] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#2D2A26] dark:text-[#EAE7DF]">
              {lang === 'zh' ? '朗读语速:' : lang === 'ms' ? 'Kelajuan Sebutan:' : 'Speech Speed:'}
            </label>
            <span className="text-xs font-mono font-bold text-[#5A6D5B] dark:text-[#A3B5A4]">
              {settings.speechSpeed ?? 1.0}x
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { rate: 1.0, label: '1.0x', desc: lang === 'zh' ? '正常' : lang === 'ms' ? 'Normal' : 'Normal' },
              { rate: 0.8, label: '0.8x', desc: lang === 'zh' ? '较慢' : lang === 'ms' ? 'Sederhana' : 'Moderate' },
              { rate: 0.6, label: '0.6x', desc: lang === 'zh' ? '慢速' : lang === 'ms' ? 'Perlahan' : 'Slow' },
            ].map(({ rate, label, desc }) => {
              const currentRate = settings.speechSpeed ?? 1.0;
              const isActive = currentRate === rate;
              return (
                <button
                  key={rate}
                  onClick={() => {
                    onUpdateSettings({ speechSpeed: rate as 1.0 | 0.8 | 0.6 });
                    // Test sample word immediately upon selection
                    quizSounds.speak('Melaka', 'ms', rate);
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

        <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
          {lang === 'zh'
            ? '系统已配置标准英国英语(en-GB)、马来西亚马来语(ms-MY)及中国普通话(zh-CN)。点击测试发音：'
            : lang === 'ms'
            ? 'Sistem menggunakan Bahasa Inggeris UK, Bahasa Melayu Malaysia, dan Bahasa Cina China. Klik untuk menguji:'
            : 'Configured with Standard UK English, Malaysia Malay, and China Chinese. Click below to test:'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#F5F2EA] dark:bg-[#2D322D] rounded-xl border border-[#E8E2D2] dark:border-[#353B35] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF] block">
                🇬🇧 UK English
              </span>
              <span className="text-[10px] font-mono text-[#7C776B] dark:text-[#A09886]">
                Locale: en-GB
              </span>
            </div>
            <button
              onClick={() => quizSounds.speak('Butterfly', 'en')}
              className="p-2 rounded-lg bg-[#5A6D5B] hover:bg-[#485749] text-white transition-all active:scale-95 shadow-sm"
              title="Test UK English Voice"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-[#F5F2EA] dark:bg-[#2D322D] rounded-xl border border-[#E8E2D2] dark:border-[#353B35] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF] block">
                🇲🇾 Malaysia Malay
              </span>
              <span className="text-[10px] font-mono text-[#7C776B] dark:text-[#A09886]">
                Locale: ms-MY
              </span>
            </div>
            <button
              onClick={() => quizSounds.speak('Melaka', 'ms')}
              className="p-2 rounded-lg bg-[#5A6D5B] hover:bg-[#485749] text-white transition-all active:scale-95 shadow-sm"
              title="Test Malaysia Malay Voice"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-[#F5F2EA] dark:bg-[#2D322D] rounded-xl border border-[#E8E2D2] dark:border-[#353B35] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF] block">
                🇨🇳 China Chinese
              </span>
              <span className="text-[10px] font-mono text-[#7C776B] dark:text-[#A09886]">
                Locale: zh-CN
              </span>
            </div>
            <button
              onClick={() => quizSounds.speak('学校', 'zh')}
              className="p-2 rounded-lg bg-[#5A6D5B] hover:bg-[#485749] text-white transition-all active:scale-95 shadow-sm"
              title="Test China Chinese Voice"
            >
              <Volume2 className="w-4 h-4" />
            </button>
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