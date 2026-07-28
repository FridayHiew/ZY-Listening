// PWAInstallPrompt.tsx - 修正 iOS 圖標問題
import React, { useState, useEffect } from 'react';
import { Download, Share, X, Smartphone, CheckCircle } from 'lucide-react';
import { LanguageCode } from '../types';

interface PWAInstallPromptProps {
  lang: LanguageCode;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ lang }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already running as PWA / Standalone
    const isInStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isInStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt (Android / Chrome / Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA installation error:', error);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (isStandalone || dismissed) {
    return null;
  }

  // Show Android/Chrome Native Install Prompt if available
  if (deferredPrompt) {
    return (
      <div className="mx-4 my-3 p-3.5 bg-[#5A6D5B] text-white rounded-2xl shadow-md border border-[#485749] flex items-center justify-between gap-3 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-xs font-serif leading-tight">
              {lang === 'zh' ? '安装离线 PWA 应用' : lang === 'ms' ? 'Pasang Aplikasi PWA Luar Talian' : 'Install Offline PWA App'}
            </h4>
            <p className="text-[11px] opacity-90 leading-tight mt-0.5">
              {lang === 'zh' ? '将本程序安装至手机桌面，支持离线全功能使用' : lang === 'ms' ? 'Tambahkan ke skrin utama untuk prestasi luar talian & akses pantas' : 'Add to home screen for native offline performance & quick access'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 bg-white text-[#3E4A3E] hover:bg-[#F5F2EA] rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#5A6D5B]" />
            <span>{lang === 'zh' ? '立即安装' : lang === 'ms' ? 'Pasang' : 'Install'}</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Show iOS Share -> Add to Home Screen Instructions
  // 修正：將 Share 圖標移出 strong 標籤，避免重複渲染
  if (isIOS) {
    // 預先定義圖標，避免在 JSX 中重複
    const shareIcon = <Share className="w-3.5 h-3.5 inline text-[#5A6D5B] dark:text-[#A3B5A4] align-middle" />;

    return (
      <div className="mx-4 my-3 p-3.5 bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#5A6D5B]/15 text-[#5A6D5B] dark:text-[#A3B5A4] flex items-center justify-center shrink-0">
            <Share className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[#3E4A3E] dark:text-[#F5F2EA] font-serif leading-tight">
              {lang === 'zh' ? '在 iOS 上安装此应用' : lang === 'ms' ? 'Pasang Aplikasi pada iOS' : 'Install on iOS Device'}
            </h4>
            <p className="text-[11px] text-[#7C776B] dark:text-[#A09886] leading-tight mt-0.5">
              {lang === 'zh' ? (
                // 圖標放在 strong 外面
                <span>点击 Safari 底部 <strong>分享按钮</strong> {shareIcon}，然后选择 <strong>“添加到主屏幕”</strong></span>
              ) : lang === 'ms' ? (
                <span>Ketik butang <strong>Kongsi</strong> {shareIcon} di Safari dan pilih <strong>"Tambahkan ke Skrin Utama"</strong></span>
              ) : (
                <span>Tap Safari <strong>Share</strong> icon {shareIcon} and select <strong>"Add to Home Screen"</strong></span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 text-[#7C776B] hover:text-[#2D2A26] dark:hover:text-[#F5F2EA] shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (installedSuccess) {
    return (
      <div className="mx-4 my-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {lang === 'zh' ? '已成功安装 PWA 应用！' : lang === 'ms' ? 'Aplikasi PWA berjaya dipasang!' : 'PWA App installed successfully!'}
          </span>
        </div>
        <button 
          onClick={() => setInstalledSuccess(false)} 
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
};