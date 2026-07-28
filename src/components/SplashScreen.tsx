import React, { useState, useEffect } from 'react';
import { BaguaBookLogo } from './BaguaBookLogo';
import { LanguageCode } from '../types';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onDismiss: () => void;
  lang: LanguageCode;
  autoDismissMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onDismiss,
  lang,
  autoDismissMs = 2400,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // Smooth progress bar fill
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, autoDismissMs / 25);

    // Auto dismiss timeout
    const timeout = setTimeout(() => {
      handleDismiss();
    }, autoDismissMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [autoDismissMs]);

  const handleDismiss = () => {
    setFadingOut(true);
    setTimeout(() => {
      onDismiss();
    }, 400); // match transition duration
  };

  const isZh = lang === 'zh';

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 bg-[#FDFCF8] dark:bg-[#1C1E1C] text-[#2D2A26] dark:text-[#F5F2EA] transition-opacity duration-500 ease-in-out cursor-pointer ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Top Spacer */}
      <div className="w-full max-w-sm h-4" />

      {/* Main Center Branding & Logo */}
      <div className="flex flex-col items-center text-center my-auto max-w-md w-full px-4 animate-fade-in">
        {/* 1. Chinese Name */}
        <h1 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-widest text-[#3E4A3E] dark:text-[#F5F2EA] mb-6">
          卓越听词
        </h1>

        {/* 2. Animated Bagua Logo Container with Pulsing Glow */}
        <div className="relative mb-6 group">
          {/* Subtle Rotating Halo Ring */}
          <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-[#C5A059]/20 via-[#5A6D5B]/25 to-[#C5A059]/20 blur-lg opacity-75 animate-pulse" />
          <div className="relative p-2.5 rounded-2xl bg-white/90 dark:bg-[#242824]/90 shadow-md border border-[#E8E2D2] dark:border-[#353B35]">
            <BaguaBookLogo className="w-16 h-16 sm:w-20 sm:h-20" />
          </div>
        </div>

        {/* 3. English Name */}
        <div className="mb-6">
          <span className="text-base sm:text-lg font-bold tracking-widest text-[#C5A059] font-sans px-3 py-1 rounded-xl bg-[#5A6D5B]/10 dark:bg-[#708571]/20 border border-[#E8E2D2]/40 dark:border-[#353B35]/40">
            ZY-VocabHear
          </span>
        </div>

        {/* Official Slogan */}
        <div className="mt-3.5 p-3.5 rounded-2xl bg-[#F5F2EA]/80 dark:bg-[#282C28]/80 border border-[#E8E2D2] dark:border-[#353B35] shadow-sm max-w-xs w-full">
          <p className="text-base sm:text-lg font-serif italic text-[#5A6D5B] dark:text-[#A3B5A4] font-medium leading-snug">
            “化繁为易，耳听万词”
          </p>
          <p className="text-xs font-serif text-[#7C776B] dark:text-[#A09886] mt-1 tracking-wide">
            “Listen to learn, master with fun!”
          </p>
        </div>
      </div>

      {/* Bottom Loading Progress & Footer */}
      <div className="w-full max-w-xs flex flex-col items-center gap-3">
        <div className="w-full bg-[#EAE5D8] dark:bg-[#2D322D] h-1 rounded-full overflow-hidden shadow-inner">
          <div
            className="bg-[#5A6D5B] dark:bg-[#708571] h-full transition-all duration-150 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Powered By / Copyright Footer */}
        <div className="text-[11px] text-[#7C776B] dark:text-[#A09886] font-sans text-center tracking-wide">
          <span>Powered by </span>
          <span className="font-semibold text-[#3E4A3E] dark:text-[#F5F2EA]">Previous Hellios</span>
          <span> © {currentYear}</span>
        </div>
      </div>
    </div>
  );
};
