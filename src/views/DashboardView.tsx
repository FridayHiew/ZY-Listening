// DashboardView.tsx
import React, { useMemo } from 'react';
import { AppStorageState, QuizConfig } from '../types';
import { calculateCategoryMetrics, calculateOverallStats } from '../utils/analytics';
import { getTranslation } from '../utils/i18n';
import { getRandomQuote } from '../data/motivationalQuotes';
import { Play, Award, Flame, Target, BookOpen, AlertCircle, Sparkles, ShieldAlert, ArrowRight, CheckCircle2, Folder, Layers } from 'lucide-react';

interface DashboardViewProps {
  appState: AppStorageState;
  onStartQuiz: (config: QuizConfig) => void;
  onNavigateTab: (tab: any) => void;
}

interface GroupSummary {
  collectionsCount: number;
  questionCount: number;
  difficulties: Set<string>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  appState,
  onStartQuiz,
  onNavigateTab,
}) => {
  const { collections, quizResults, settings, license, currentStreak } = appState;
  const lang = settings.language;
  const t = (key: any) => getTranslation(lang, key);

  const motivationalQuote = useMemo(() => getRandomQuote(lang), [lang]);

  const groupedCollections = useMemo<Record<string, GroupSummary>>(() => {
    const groups: Record<string, GroupSummary> = {};
    collections.forEach((col) => {
      const gName = col.group?.trim() || 'General';
      if (!groups[gName]) {
        groups[gName] = { collectionsCount: 0, questionCount: 0, difficulties: new Set() };
      }
      groups[gName].collectionsCount += 1;
      groups[gName].questionCount += col.questions.length;
      if (col.difficulty) {
        groups[gName].difficulties.add(col.difficulty);
      }
    });
    return groups;
  }, [collections]);

  const totalQuestionsInCollections = collections.reduce((acc, c) => acc + c.questions.length, 0);
  const overallStats = calculateOverallStats(quizResults);

  const allQuestions = collections.flatMap((c) => c.questions);
  const categoryMetrics = calculateCategoryMetrics(quizResults, allQuestions);
  const weakCategories = categoryMetrics.filter((m) => m.isWeak);

  const defaultCollection = collections[0];

  return (
    <div className="space-y-6 pb-12">
      {/* License Warning Banner */}
      {license && license.isInGracePeriod && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {t('gracePeriod')} ({license.daysRemaining} {t('daysLeft')})
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                {lang === 'zh' ? '请在到期前更新许可证以保持完整功能。' : 'Renew your license key before expiration to maintain full functionality.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            className="text-xs font-semibold px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shrink-0"
          >
            {t('manageLicense')}
          </button>
        </div>
      )}

      {/* Top Welcome Banner */}
      <div className="bg-[#3E4A3E] dark:bg-[#222922] text-[#FDFCF8] p-6 rounded-3xl shadow-sm border border-[#384639] relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#5A6D5B]/40 border border-[#819882]/40 text-xs font-semibold text-[#EAE5D8]">
                {t('welcomeBack')}, {appState.profile.displayName}
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D9C5B2]/20 text-[#D9C5B2] border border-[#D9C5B2]/30 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 fill-[#D9C5B2] text-[#D9C5B2]" />
                {currentStreak} {t('streakDays')}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-serif italic text-white leading-snug">
              “{motivationalQuote}”
            </h2>
            <p className="text-xs text-[#D9C5B2] mt-2 max-w-xl font-serif leading-relaxed">
              {lang === 'zh' ? '日积月累，水滴石穿。持之以恒，知识自成。' : 'Consistency is the key to knowledge mastery.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {defaultCollection && (
              <button
                onClick={() =>
                  onStartQuiz({
                    collectionId: defaultCollection.id,
                    collectionName: defaultCollection.name,
                    mode: 'PRACTICE',
                    questionCount: Math.min(10, defaultCollection.questions.length),
                  })
                }
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5F2EA] text-[#3E4A3E] font-bold text-xs hover:bg-[#EAE5D8] transition-all shadow-sm"
              >
                <Play className="w-4 h-4 fill-[#3E4A3E]" />
                <span>{t('quickStartPractice')}</span>
              </button>
            )}

            {weakCategories.length > 0 && (
              <button
                onClick={() =>
                  onStartQuiz({
                    mode: 'WEAK_TOPICS',
                    questionCount: 10,
                  })
                }
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-bold text-xs transition-all shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-[#D9C5B2]" />
                <span>{t('practiceWeakTopics')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#2D2A26] dark:text-[#EAE7DF] font-serif">
              {collections.length}
            </div>
            <div className="text-xs text-[#7C776B] dark:text-[#A09886]">
              {t('totalCollections')}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B8C0B0]/20 text-[#3E4A3E] dark:text-[#B8C0B0] flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#2D2A26] dark:text-[#EAE7DF] font-serif">
              {totalQuestionsInCollections}
            </div>
            <div className="text-xs text-[#7C776B] dark:text-[#A09886]">
              {t('totalQuestions')}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#2D2A26] dark:text-[#EAE7DF] font-serif">
              {overallStats.totalQuestionsAnswered}
            </div>
            <div className="text-xs text-[#7C776B] dark:text-[#A09886]">
              {t('questionsAnswered')}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D9C5B2]/30 text-[#82755E] dark:text-[#D9C5B2] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#2D2A26] dark:text-[#EAE7DF] font-serif">
              {overallStats.overallAccuracy}%
            </div>
            <div className="text-xs text-[#7C776B] dark:text-[#A09886]">
              {t('overallAccuracy')}
            </div>
          </div>
        </div>
      </div>

      {/* Subject Folders / Groups Overview */}
      {Object.keys(groupedCollections).length > 0 && (
        <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-[#5A6D5B]" />
              <h3 className="text-sm font-bold text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                {t('subjectGroupPerformance')}
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('library')}
              className="text-xs font-semibold text-[#5A6D5B] dark:text-[#A3B5A4] hover:underline flex items-center gap-1"
            >
              <span>{t('manageLibrary')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(Object.entries(groupedCollections) as [string, GroupSummary][]).map(([gName, data]) => (
              <div
                key={gName}
                onClick={() => onNavigateTab('library')}
                className="p-3.5 rounded-xl border border-[#E8E2D2] dark:border-[#353B35] bg-[#F5F2EA]/50 dark:bg-[#2D322D]/50 hover:border-[#5A6D5B] cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-[#3E4A3E] dark:text-[#F5F2EA] font-serif truncate flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-[#5A6D5B] shrink-0" />
                      {gName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] border border-[#5A6D5B]/20 shrink-0">
                      {data.collectionsCount} {t('collections')}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#7C776B] dark:text-[#A09886]">
                    {data.questionCount} {t('questionsCount')}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-wrap mt-2 pt-2 border-t border-[#E8E2D2]/60 dark:border-[#353B35]">
                  {Array.from(data.difficulties).map((diff) => (
                    <span
                      key={diff}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        diff === 'Beginner'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : diff === 'Intermediate'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {lang === 'zh'
                        ? diff === 'Beginner' ? '初级' : diff === 'Intermediate' ? '中级' : '高级'
                        : diff}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Weak Topics Section */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#82755E] dark:text-[#D9C5B2]" />
            <h3 className="text-sm font-bold text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
              {t('weakTopicsRecommendation')}
            </h3>
          </div>
          {weakCategories.length > 0 && (
            <button
              onClick={() =>
                onStartQuiz({
                  mode: 'WEAK_TOPICS',
                  questionCount: 10,
                })
              }
              className="text-xs font-bold text-[#5A6D5B] dark:text-[#A3B5A4] hover:underline flex items-center gap-1"
            >
              <span>{t('practiceWeakTopics')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {weakCategories.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#F5F2EA] dark:bg-[#2D322D] text-xs text-[#7C776B] dark:text-[#A09886] flex items-center gap-2 border border-[#E8E2D2] dark:border-[#353B35]">
            <CheckCircle2 className="w-4 h-4 text-[#5A6D5B] shrink-0" />
            <span>{t('noWeakTopics')}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {weakCategories.slice(0, 3).map((metric) => (
              <div
                key={metric.category}
                className="p-3.5 rounded-xl border border-[#D9C5B2] dark:border-[#353B35] bg-[#F5F2EA]/60 dark:bg-[#2D322D]/60 flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-[#2D2A26] dark:text-[#EAE7DF] block mb-1 truncate">
                    {metric.category}
                  </span>
                  <p className="text-[11px] text-[#7C776B] dark:text-[#A09886]">
                    {t('weightedAccuracy')}: <span className="font-bold text-[#5A6D5B] dark:text-[#A3B5A4]">{metric.weightedAccuracy}%</span> ({metric.totalAttempts} {lang === 'zh' ? '次作答' : 'attempts'})
                  </p>
                </div>
                <div className="w-full bg-[#EAE5D8] dark:bg-[#383E38] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#5A6D5B] h-full rounded-full transition-all"
                    style={{ width: `${metric.weightedAccuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Quiz History */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
            {t('recentActivity')}
          </h3>
          <button
            onClick={() => onNavigateTab('analytics')}
            className="text-xs font-semibold text-[#5A6D5B] dark:text-[#A3B5A4] hover:underline"
          >
            {lang === 'zh' ? '查看完整分析' : 'View All Analytics'}
          </button>
        </div>

        {quizResults.length === 0 ? (
          <p className="text-xs text-[#7C776B] dark:text-[#A09886] py-4 text-center">
            {t('noActivity')}
          </p>
        ) : (
          <div className="space-y-2">
            {quizResults.slice(-5).reverse().map((res) => (
              <div
                key={res.id}
                className="p-3 rounded-xl bg-[#F5F2EA] dark:bg-[#2D322D] flex items-center justify-between text-xs border border-[#E8E2D2] dark:border-[#353B35]"
              >
                <div>
                  <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF] block">
                    {res.collectionName}
                  </span>
                  <span className="text-[11px] text-[#7C776B] dark:text-[#A09886]">
                    {res.mode} • {new Date(res.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-extrabold text-sm ${
                      res.passed ? 'text-[#5A6D5B] dark:text-[#A3B5A4]' : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {res.scorePercentage}%
                  </span>
                  <span className="text-[11px] text-[#7C776B] dark:text-[#A09886] block">
                    {res.correctCount}/{res.totalQuestions} {lang === 'zh' ? '题正确' : 'correct'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};