// AdminLicenseGeneratorView.tsx
import React, { useState } from 'react';
import { GeneratedLicenseRecord, LicenseType, AppSettings } from '../types';
import { generateLicenseKey } from '../utils/crypto';
import { getTranslation } from '../utils/i18n';
import { KeyRound, Copy, Check, Download, ShieldCheck, Sparkles, Clock, AlertCircle } from 'lucide-react';

interface AdminLicenseGeneratorViewProps {
  currentDeviceId: string;
  settings: AppSettings;
}

export const AdminLicenseGeneratorView: React.FC<AdminLicenseGeneratorViewProps> = ({
  currentDeviceId,
  settings,
}) => {
  const lang = settings.language;
  const t = (key: any) => getTranslation(lang, key);
  const [targetDeviceId, setTargetDeviceId] = useState(currentDeviceId);
  const [licenseType, setLicenseType] = useState<LicenseType>('USER');
  const [durationMonths, setDurationMonths] = useState(3);
  const [holderName, setHolderName] = useState('Authorized Learner');

  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatedRecords, setGeneratedRecords] = useState<GeneratedLicenseRecord[]>([]);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDeviceId.trim()) return;

    const res = generateLicenseKey(
      targetDeviceId.trim(),
      licenseType,
      durationMonths,
      holderName.trim()
    );

    setGeneratedKey(res.key);

    const record: GeneratedLicenseRecord = {
      id: res.payload.licenseId,
      key: res.key,
      deviceId: res.payload.deviceId,
      licenseType: res.payload.licenseType,
      issuedAt: res.payload.issuedAt,
      expiresAt: res.payload.expiresAt,
      holderName: res.payload.holderName,
    };

    setGeneratedRecords((prev) => [record, ...prev]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[10px] uppercase tracking-wider border border-purple-200 dark:border-purple-800">
            {t('adminTool')}
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {t('licenseGenerator')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('generateSignedKeys')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Generator Form */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purple-600" />
            <span>{t('licenseGenerator')}</span>
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('targetDeviceId')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={targetDeviceId}
                  onChange={(e) => setTargetDeviceId(e.target.value)}
                  placeholder="DEV-XXXX-XXXX-XXXX"
                  className="w-full p-2.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setTargetDeviceId(currentDeviceId)}
                  className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-[11px] whitespace-nowrap hover:bg-slate-200"
                >
                  {t('myDevice')}
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('licenseTypeLabel')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['USER', 'ADMIN', 'VIP'] as LicenseType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setLicenseType(type)}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      licenseType === type
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {type === 'USER' ? t('userLicense') : type === 'ADMIN' ? t('adminLicense') : t('vipLicense')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('validityDuration')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 6, 12].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDurationMonths(m)}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      durationMonths === m
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {m} {t('months')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('holderName')}
              </label>
              <input
                type="text"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="e.g. John Doe / Tech Department"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-md shadow-purple-500/20"
            >
              {t('signGenerate')}
            </button>
          </form>
        </div>

        {/* Output & Copy Box */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
              {t('generatedOutput')}
            </h3>

            {generatedKey ? (
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">License Payload Key String</span>
                  <textarea
                    readOnly
                    value={generatedKey}
                    rows={6}
                    className="w-full p-3 font-mono text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(generatedKey)}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey ? t('keyCopied') : t('copyKey')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-12 text-center">
                {t('noKeyGenerated')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Generated License History Log */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">
          {t('auditRecords')} ({generatedRecords.length})
        </h3>

        {generatedRecords.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            {t('noRecords')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2">{t('licenseId')}</th>
                  <th className="pb-2">{t('targetDevice')}</th>
                  <th className="pb-2">{t('type')}</th>
                  <th className="pb-2">{t('expires')}</th>
                  <th className="pb-2">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {generatedRecords.map((rec) => (
                  <tr key={rec.id}>
                    <td className="py-2.5 font-mono text-[11px] font-bold text-purple-600">{rec.id}</td>
                    <td className="py-2.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">{rec.deviceId}</td>
                    <td className="py-2.5 font-bold">{rec.licenseType}</td>
                    <td className="py-2.5 text-slate-500">{new Date(rec.expiresAt).toLocaleDateString()}</td>
                    <td className="py-2.5">
                      <button
                        onClick={() => copyToClipboard(rec.key)}
                        className="text-purple-600 hover:underline font-semibold"
                      >
                        {t('copy')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};