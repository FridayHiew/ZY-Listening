import React from 'react';
import { Lock, ShieldAlert, Key } from 'lucide-react';
import { getTranslation } from '../utils/i18n';
import { LanguageCode } from '../types';

interface LicenseRequiredPlaceholderProps {
  lang: LanguageCode;
  moduleName: string;
  onOpenLicense: () => void;
}

export const LicenseRequiredPlaceholder: React.FC<LicenseRequiredPlaceholderProps> = ({
  lang,
  moduleName,
  onOpenLicense,
}) => {
  const t = (key: any) => getTranslation(lang, key);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] max-w-lg mx-auto bg-white dark:bg-[#242824] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl my-8">
      <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 dark:text-rose-400 mb-6 border border-rose-100 dark:border-rose-900/50 animate-pulse">
        <Lock className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center justify-center gap-2">
        <span>{moduleName}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-semibold uppercase tracking-wider">
          Locked
        </span>
      </h2>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-sm">
        {t('licenseRequiredDesc')}
      </p>

      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={onOpenLicense}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-bold text-sm transition-all shadow-md active:scale-95"
        >
          <Key className="w-4 h-4" />
          <span>{t('activateNow')}</span>
        </button>
      </div>
    </div>
  );
};
