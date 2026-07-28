// BackupRestoreView.tsx
import React, { useState } from 'react';
import JSZip from 'jszip';
import { AppStorageState, KnowledgeCollection, QuizResult } from '../types';
import { saveAppState } from '../utils/storage';
import { getTranslation } from '../utils/i18n';
import { HardDriveDownload, Download, UploadCloud, ShieldCheck, AlertTriangle, CheckCircle2, FileJson } from 'lucide-react';

interface BackupRestoreViewProps {
  appState: AppStorageState;
  onRestoreState: (newState: AppStorageState) => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  appState,
  onRestoreState,
}) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const lang = appState.settings.language;
  const t = (key: any) => getTranslation(lang, key);

  const handleExportBackup = async () => {
    try {
      const backupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        deviceId: appState.deviceId,
        profile: appState.profile,
        settings: appState.settings,
        collections: appState.collections,
        quizResults: appState.quizResults,
        currentStreak: appState.currentStreak,
      };

      const zip = new JSZip();
      zip.file('backup_data.json', JSON.stringify(backupData, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yiga_backup_${new Date().toISOString().split('T')[0]}.zip`; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMsg(t('backupSuccess'));
    } catch (e: any) {
      setErrorMsg(t('backupError').replace('{error}', e.message));
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let backupData: any = null;

      if (file.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const jsonEntry = zip.file('backup_data.json');
        if (!jsonEntry) throw new Error(t('invalidBackup'));
        const text = await jsonEntry.async('text');
        backupData = JSON.parse(text);
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        backupData = JSON.parse(text);
      } else {
        throw new Error(t('invalidBackup'));
      }

      if (!backupData || !backupData.collections || !Array.isArray(backupData.collections)) {
        throw new Error(t('invalidBackup'));
      }

      const restoredState: AppStorageState = {
        ...appState,
        profile: backupData.profile || appState.profile,
        settings: backupData.settings || appState.settings,
        collections: backupData.collections,
        quizResults: backupData.quizResults || [],
        currentStreak: backupData.currentStreak || 0,
      };

      saveAppState(restoredState);
      onRestoreState(restoredState);

      setSuccessMsg(
        t('restoreSuccess')
          .replace('{count}', backupData.collections.length)
          .replace('{history}', backupData.quizResults?.length || 0)
      );
      window.scrollTo(0, 0);
    } catch (e: any) {
      setErrorMsg(t('backupError').replace('{error}', e.message));
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {t('backupTitle')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('backupDesc')}
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-800 dark:text-rose-300 text-xs font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Backup Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
              {t('saveBackup')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('saveBackupDesc')}
            </p>
          </div>

          <button
            onClick={handleExportBackup}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{t('exportBackup')}</span>
          </button>
        </div>

        {/* Restore Backup Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
              {t('restoreBackupTitle')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('restoreBackupDesc')}
            </p>
          </div>

          <label className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer">
            <UploadCloud className="w-4 h-4" />
            <span>{t('chooseBackupFile')}</span>
            <input
              type="file"
              accept=".zip,.json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-start gap-3">
        <span className="text-xl">💡</span>
        <div className="text-xs text-blue-700 dark:text-blue-300">
          <span className="font-bold">{t('tipTitle')}</span> {t('tipDesc')}
        </div>
      </div>
    </div>
  );
};