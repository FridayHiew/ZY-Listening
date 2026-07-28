import React, { useState } from 'react';
import { AppSettings, LicenseData } from '../types';
import { buildLicenseData } from '../utils/crypto';
import { getTranslation } from '../utils/i18n';
import { ShieldCheck, Key, Copy, Check, AlertTriangle, Trash2, X } from 'lucide-react';

interface LicenseGateProps {
  deviceId: string;
  clockWatermark: number;
  currentLicense: LicenseData | null;
  settings: AppSettings;
  onActivateLicense: (license: LicenseData) => void;
  onDeleteLicense?: () => void;
  onCloseModal?: () => void;
  isModalView?: boolean;
}

export const LicenseGate: React.FC<LicenseGateProps> = ({
  deviceId,
  clockWatermark,
  currentLicense,
  settings,
  onActivateLicense,
  onDeleteLicense,
  onCloseModal,
  isModalView = false,
}) => {
  const lang = settings.language;
  const t = (key: any) => getTranslation(lang, key);

  const [inputKey, setInputKey] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedDevice, setCopiedDevice] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const copyDeviceId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopiedDevice(true);
    setTimeout(() => setCopiedDevice(false), 2000);
  };

  const handleActivate = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!inputKey.trim()) {
      setErrorMsg(t('enterKeyError'));
      return;
    }

    const license = buildLicenseData(inputKey.trim(), deviceId, clockWatermark);
    if (!license || !license.isValid) {
      setErrorMsg(
        license?.isExpired
          ? t('expiredKeyError')
          : t('invalidKeyError')
      );
      return;
    }

    setSuccessMsg(`${t('activateSuccess')} (${license.payload.licenseType})`);
    onActivateLicense(license);

    if (onCloseModal) {
      setTimeout(() => onCloseModal(), 1500);
    }
  };

  const handleDelete = () => {
    if (onDeleteLicense) {
      onDeleteLicense();
      setShowConfirmDelete(false);
    }
  };

  return (
    <div className={`relative p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-2xl mx-auto ${isModalView ? 'my-4' : 'my-8'}`}>
      {onCloseModal && (
        <button
          onClick={onCloseModal}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all z-20"
          title={lang === 'zh' ? '关闭' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>
      )}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 pr-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Key className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t('licenseActivation')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('licenseDesc')}
          </p>
        </div>
      </div>

      {/* Current License Details if Active */}
      {currentLicense && currentLicense.isValid && (
        <div className={`p-4 rounded-xl border mb-6 ${
          currentLicense.isInGracePeriod
            ? 'bg-amber-50/80 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200'
            : currentLicense.payload.licenseType === 'ADMIN'
            ? 'bg-purple-50/80 border-purple-200 text-purple-900 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-200'
            : currentLicense.payload.licenseType === 'VIP'
            ? 'bg-rose-50/80 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {currentLicense.payload.licenseType === 'USER' ? t('userLicense') : currentLicense.payload.licenseType === 'ADMIN' ? t('adminLicense') : t('vipLicense')} {t('licenseActive')}
              </span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 font-semibold border border-current opacity-80">
              {currentLicense.payload.licenseType === 'VIP' ? (lang === 'zh' ? '无到期限制' : 'Lifetime VIP') : `${currentLicense.daysRemaining} ${t('daysLeft')}`}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs opacity-90">
            <div>
              <span className="font-semibold">{t('holder')}:</span> {currentLicense.payload.holderName || 'Default'}
            </div>
            <div>
              <span className="font-semibold">{t('expires')}:</span> {currentLicense.payload.licenseType === 'VIP' ? (lang === 'zh' ? '永久授权' : 'Permanent') : new Date(currentLicense.payload.expiresAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-semibold">{t('licenseId')}:</span> {currentLicense.payload.licenseId}
            </div>
            <div>
              <span className="font-semibold">{t('status')}:</span> {currentLicense.isInGracePeriod ? (lang === 'zh' ? '宽限期内' : 'Grace Period') : t('fullyActive')}
            </div>
          </div>

          {/* Delete License Option */}
          {onDeleteLicense && (
            <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'zh' ? '删除此设备上的许可证授权？' : 'Deactivate current license on this device?'}
              </span>
              {!showConfirmDelete ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all border border-rose-200 dark:border-rose-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('deleteLicense')}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                  >
                    {lang === 'zh' ? '确认删除' : 'Yes, Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    {lang === 'zh' ? '取消' : 'Cancel'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Device ID Card */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 mb-6">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
          {t('uniqueDeviceID')}
        </label>
        <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-800 dark:text-slate-200">
          <span className="font-semibold tracking-wider">{deviceId}</span>
          <button
            onClick={copyDeviceId}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
          >
            {copiedDevice ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedDevice ? t('keyCopied') : (lang === 'zh' ? '复制 ID' : 'Copy ID')}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
          {t('provideDeviceID')}
        </p>
      </div>

      {/* License Input Form */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            {t('enterLicenseKey')}
          </label>
          <textarea
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            rows={3}
            placeholder={t('pasteLicenseKey')}
            className="w-full text-xs font-mono p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
          />
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={handleActivate}
            className="px-5 py-2.5 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-semibold text-xs transition-all shadow-md"
          >
            {t('verifyActivate')}
          </button>
          
          {onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all border border-slate-200 dark:border-slate-700"
            >
              {lang === 'zh' ? '关闭' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
