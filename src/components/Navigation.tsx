// Navigation.tsx
import React from 'react';
import { AppSettings } from '../types';
import { getTranslation } from '../utils/i18n';
import { 
  Home, 
  BookOpen, 
  PlusCircle, 
  BarChart3, 
  HardDriveDownload, 
  KeyRound, 
  Settings, 
  Lock,
} from 'lucide-react';

export type TabType = 'dashboard' | 'library' | 'import' | 'analytics' | 'backup' | 'admin' | 'settings' | 'license';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isAdmin: boolean;
  settings: AppSettings;
  hasValidLicense: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  isAdmin,
  settings,
  hasValidLicense,
}) => {
  const lang = settings.language;

  // ============================================================
  // 修改 1: 明確標記哪些項目需要鎖定
  // ============================================================
  const navItems = [
    { id: 'dashboard' as TabType, label: getTranslation(lang, 'dashboard'), icon: Home, isLocked: false },
    { id: 'library' as TabType, label: getTranslation(lang, 'library'), icon: BookOpen, isLocked: false },
    { 
      id: 'import' as TabType, 
      label: getTranslation(lang, 'import'), 
      icon: PlusCircle, 
      isLocked: !hasValidLicense  // Add Book locked if no valid license
    },
    { id: 'analytics' as TabType, label: getTranslation(lang, 'analytics'), icon: BarChart3, isLocked: false },
    { 
      id: 'backup' as TabType, 
      label: getTranslation(lang, 'backupRestore'), 
      icon: HardDriveDownload, 
      isLocked: !hasValidLicense  // Backup locked if no valid license
    },
    ...(isAdmin ? [{ 
      id: 'admin' as TabType, 
      label: getTranslation(lang, 'adminGenerator'), 
      icon: KeyRound, 
      isLocked: false 
    }] : []),
    { id: 'settings' as TabType, label: getTranslation(lang, 'settings'), icon: Settings, isLocked: false },
  ];

  return (
    <>
      {/* Desktop Navigation - 保持不變 */}
      <nav className="hidden md:block bg-[#F5F2EA] dark:bg-[#242824] border-b border-[#E8E2D2] dark:border-[#353B35] transition-colors sticky top-[61px] z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all touch-manipulation min-h-[40px] ${
                    isActive
                      ? 'bg-[#5A6D5B] text-white shadow-sm dark:bg-[#708571]'
                      : 'text-[#7C776B] dark:text-[#A09886] hover:text-[#2D2A26] dark:hover:text-[#F5F2EA] hover:bg-[#EAE5D8] dark:hover:bg-[#2D322D]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {/* Desktop 鎖頭圖標 */}
                  {item.isLocked && <Lock className="w-3 h-3 text-rose-500/80 dark:text-rose-400/80 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ============================================================
          Mobile Bottom Navigation - 修復鎖頭圖標位置
          ============================================================ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDFCF8]/95 dark:bg-[#1C1E1C]/95 backdrop-blur-md border-t border-[#E8E2D2] dark:border-[#353B35] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 px-0 shadow-lg transition-colors">
        
        <div className="flex items-center gap-1 overflow-x-auto overflow-y-hidden no-scrollbar px-3 py-0.5 snap-x snap-mandatory">
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-h-[52px] flex-shrink-0 snap-start touch-manipulation ${
                  isActive
                    ? 'text-[#5A6D5B] dark:text-[#A3B5A4] font-bold'
                    : 'text-[#7C776B] dark:text-[#A09886] opacity-75 active:opacity-100'
                } ${item.isLocked ? 'opacity-60' : ''}`}
              >
                {/* 圖標容器 */}
                <div className="relative">
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#5A6D5B]/15 dark:bg-[#708571]/30' : ''}`}>
                    <Icon className={`w-5 h-5 ${item.isLocked ? 'text-gray-400 dark:text-gray-600' : ''}`} />
                  </div>
                  
                  {/* ============================================================
                    修改 3: 鎖頭圖標 - 顯示在右上角，更明顯
                    ============================================================ */}
                  {item.isLocked && (
                    <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#1C1E1C] shadow-md z-10">
                      <Lock className="w-3 h-3" />
                    </div>
                  )}
                </div>
                
                {/* 標籤文字 - 被鎖定的項目顯示灰色 */}
                <span className={`text-[9px] tracking-tight leading-tight mt-0.5 whitespace-nowrap text-center max-w-[56px] truncate ${
                  item.isLocked ? 'text-gray-400 dark:text-gray-600' : ''
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
          
          <div className="flex-shrink-0 w-2" />
        </div>
      </div>
    </>
  );
};