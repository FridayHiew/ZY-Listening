// AnalyticsView.tsx
import React, { useMemo } from 'react';
import { AppStorageState, QuizConfig } from '../types';
import { calculateCategoryMetrics, calculateOverallStats } from '../utils/analytics';
import { getTranslation, translateDifficulty } from '../utils/i18n';
import { BarChart3, Target, Award, Clock, RotateCcw, AlertTriangle, CheckCircle2, XCircle, Folder, Layers, Shield, Sparkles } from 'lucide-react';

interface AnalyticsViewProps {
  appState: AppStorageState;
  onStartQuiz: (config: QuizConfig) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  appState,
  onStartQuiz,
}) => {
  const { collections, quizResults, settings } = appState;
  const lang = settings.language;
  const t = (key: any) => getTranslation(lang, key);

  const stats = calculateOverallStats(quizResults);
  const allQuestions = collections.flatMap((c) => c.questions);
  const categoryMetrics = calculateCategoryMetrics(quizResults, allQuestions);

  // Calculate Group Performance
  const groupStats = useMemo(() => {
    const map: Record<string, { groupName: string; totalCols: number; totalQuestions: number; attempts: number; correct: number }> = {};
    collections.forEach((col) => {
      const gName = col.group?.trim() || 'General';
      if (!map[gName]) {
        map[gName] = { groupName: gName, totalCols: 0, totalQuestions: 0, attempts: 0, correct: 0 };
      }
      map[gName].totalCols += 1;
      map[gName].totalQuestions += col.questions.length;
    });

    quizResults.forEach((res) => {
      const col = collections.find((c) => c.id === res.collectionId);
      const gName = col?.group?.trim() || 'General';
      if (map[gName]) {
        map[gName].attempts += res.totalQuestions;
        map[gName].correct += res.correctCount;
      }
    });

    return Object.values(map);
  }, [collections, quizResults]);

  // Calculate Difficulty Level Breakdown
  const difficultyStats = useMemo(() => {
    const diffMap: Record<string, { totalQuestions: number; count: number }> = {
      'Year 1': { totalQuestions: 0, count: 0 },
      'Year 2': { totalQuestions: 0, count: 0 },
      'Year 3': { totalQuestions: 0, count: 0 },
      'Year 4': { totalQuestions: 0, count: 0 },
      'Year 5': { totalQuestions: 0, count: 0 },
      'Year 6': { totalQuestions: 0, count: 0 },
    };

    collections.forEach((col) => {
      let diff = col.difficulty || 'Year 1';
      // Normalize legacy difficulties
      if (diff === 'Beginner') diff = 'Year 1';
      else if (diff === 'Intermediate') diff = 'Year 3';
      else if (diff === 'Master') diff = 'Year 5';

      if (diffMap[diff]) {
        diffMap[diff].totalQuestions += col.questions.length;
        diffMap[diff].count += 1;
      } else {
        // Safe fallback to Year 1
        diffMap['Year 1'].totalQuestions += col.questions.length;
        diffMap['Year 1'].count += 1;
      }
    });

    return diffMap;
  }, [collections]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-bold text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
          {t('analytics')}
        </h2>
        <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
          {lang === 'zh' ? '全面查看学习表现、学科分组进度和难度评估指标' : 'Comprehensive learning performance, subject group progress, and difficulty metrics'}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm">
          <span className="text-[10px] font-bold text-[#7C776B] uppercase tracking-wider block mb-1">
            {t('totalSessions')}
          </span>
          <span className="text-2xl font-extrabold text-[#2D2A26] dark:text-[#EAE7DF] font-serif">
            {stats.totalSessions}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm">
          <span className="text-[10px] font-bold text-[#7C776B] uppercase tracking-wider block mb-1">
            {t('questionsAnswered')}
          </span>
          <span className="text-2xl font-extrabold text-[#2D2A26] dark:text-[#EAE7DF] font-serif">
            {stats.totalQuestionsAnswered}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm">
          <span className="text-[10px] font-bold text-[#7C776B] uppercase tracking-wider block mb-1">
            {t('overallAccuracy')}
          </span>
          <span className="text-2xl font-extrabold text-[#5A6D5B] dark:text-[#A3B5A4] font-serif">
            {stats.overallAccuracy}%
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm">
          <span className="text-[10px] font-bold text-[#7C776B] uppercase tracking-wider block mb-1">
            {t('timeSpent')}
          </span>
          <span className="text-2xl font-extrabold text-[#2D2A26] dark:text-[#EAE7DF] font-serif">
            {Math.floor(stats.totalTimeSpentSeconds / 60)}{lang === 'zh' ? '分钟' : 'm'}
          </span>
        </div>
      </div>

      {/* Subject Folders / Group Performance */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E8E2D2] dark:border-[#353B35] pb-3">
          <Folder className="w-5 h-5 text-[#5A6D5B]" />
          <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
            {t('subjectGroupPerformance')}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {groupStats.map((g) => {
            const acc = g.attempts > 0 ? Math.round((g.correct / g.attempts) * 100) : 0;
            return (
              <div
                key={g.groupName}
                className="p-3.5 bg-[#F5F2EA]/60 dark:bg-[#2D322D]/60 rounded-xl border border-[#E8E2D2] dark:border-[#353B35] text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF] flex items-center gap-1.5 font-serif">
                      <Folder className="w-3.5 h-3.5 text-[#5A6D5B]" />
                      {g.groupName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] border border-[#5A6D5B]/20">
                      {g.totalCols} {t('collections')}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#7C776B] dark:text-[#A09886]">
                    {g.totalQuestions} {t('questionsAvailable')}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#E8E2D2]/60 dark:border-[#353B35]">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#7C776B] dark:text-[#A09886]">{t('accuracy')}:</span>
                    <span className="font-bold text-[#5A6D5B] dark:text-[#A3B5A4]">
                      {g.attempts > 0 ? `${acc}%` : t('notAttempted')}
                    </span>
                  </div>
                  <div className="w-full bg-[#EAE5D8] dark:bg-[#383E38] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#5A6D5B] h-full rounded-full transition-all"
                      style={{ width: `${acc}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Difficulty Level Distribution */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E8E2D2] dark:border-[#353B35] pb-3">
          <Layers className="w-5 h-5 text-[#5A6D5B]" />
          <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
            {t('difficultyDistribution')}
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'] as const).map((lvl) => {
            const data = difficultyStats[lvl] || { totalQuestions: 0, count: 0 };
            const num = parseInt(lvl.match(/\d+/)?.[0] || '1', 10);
            
            // Assign color schemes dynamically based on primary year
            // Years 1 & 2: green, 3 & 4: amber, 5 & 6: rose
            const badgeColor = 
              num <= 2
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                : num <= 4
                ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300';
            
            const badgeIcon = num <= 2 ? '🟢' : num <= 4 ? '🟡' : '🔴';
            const badgeName = translateDifficulty(lang, lvl);

            return (
              <div
                key={lvl}
                className={`p-3 rounded-xl border ${badgeColor} text-xs flex flex-col justify-between`}
              >
                <div>
                  <div className="flex flex-col gap-1 font-bold mb-1">
                    <span className="text-[13px] font-serif shrink-0">{badgeIcon} {badgeName}</span>
                    <span className="text-[10px] opacity-80 font-normal">{data.count} {t('collections')}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-current/20 font-semibold text-[10px]">
                  {lang === 'zh' ? `共 ${data.totalQuestions} 题` : `${data.totalQuestions} Qs Total`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mistake Review Shortcut Banner */}
      {stats.totalWrong > 0 && (
        <div className="p-5 bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5A6D5B] text-white font-bold flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                {lang === 'zh'
                  ? `复习历史错题（累计 ${stats.totalWrong} 道错题）`
                  : `Review Past Mistakes (${stats.totalWrong} Incorrect Questions)`}
              </h3>
              <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
                {lang === 'zh' ? '针对性练习答错题目，直至完全掌握知识点。' : 'Practice incorrect questions until you reach 100% mastery.'}
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              onStartQuiz({
                mode: 'MISTAKE_REVIEW',
                questionCount: 15,
              })
            }
            className="px-4 py-2 bg-[#5A6D5B] hover:bg-[#485749] text-white font-bold text-xs rounded-xl shadow-sm shrink-0 transition-colors"
          >
            {lang === 'zh' ? '开启错题复习' : 'Start Mistake Review'}
          </button>
        </div>
      )}

      {/* Category Accuracy Breakdown */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
          {lang === 'zh' ? '知识点分类表现与遗忘衰减指标' : 'Category Performance & Recency-Decay Metrics'}
        </h3>

        <div className="space-y-3">
          {categoryMetrics.map((cat) => (
            <div
              key={cat.category}
              className="p-3.5 bg-[#F5F2EA]/60 dark:bg-[#2D322D]/60 rounded-xl border border-[#E8E2D2] dark:border-[#353B35] text-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF]">
                  {cat.category}
                </span>
                <span className="font-semibold text-[#7C776B] dark:text-[#A09886]">
                  {t('weightedAccuracy')}: <span className="text-[#5A6D5B] dark:text-[#A3B5A4] font-bold">{cat.weightedAccuracy}%</span>
                </span>
              </div>

              <div className="w-full bg-[#EAE5D8] dark:bg-[#383E38] h-2 rounded-full overflow-hidden my-1.5">
                <div
                  className={`h-full rounded-full transition-all ${
                    cat.isWeak ? 'bg-[#82755E]' : 'bg-[#5A6D5B]'
                  }`}
                  style={{ width: `${cat.weightedAccuracy}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#7C776B] dark:text-[#A09886]">
                <span>
                  {lang === 'zh'
                    ? `总作答：${cat.totalAttempts} 次（正确 ${cat.correctAttempts} 次）`
                    : `${t('totalAttempts')}: ${cat.totalAttempts} (${cat.correctAttempts} ${t('correctAttempts')})`}
                </span>
                {cat.isWeak && (
                  <span className="text-[#82755E] dark:text-[#D9C5B2] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {t('weakTopicFlag')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Learning History Log Table */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm">
        <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif mb-4">
          {lang === 'zh' ? '完整测试会话记录' : 'Complete Quiz Session Records'}
        </h3>

        {quizResults.length === 0 ? (
          <p className="text-xs text-[#7C776B] text-center py-6">
            {t('noQuizRecords')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D2] dark:border-[#353B35] text-[#7C776B] font-semibold">
                  <th className="pb-3">{t('date')}</th>
                  <th className="pb-3">{t('collection')}</th>
                  <th className="pb-3">{t('mode')}</th>
                  <th className="pb-3">{t('score')}</th>
                  <th className="pb-3">{t('result')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D2]/50 dark:divide-[#353B35]">
                {quizResults.map((res) => {
                  const modeDisplay = lang === 'zh'
                    ? res.mode === 'EXAM' ? '考试模式'
                      : res.mode === 'PRACTICE' ? '练习模式'
                      : res.mode === 'MISTAKE_REVIEW' ? '错题复习'
                      : res.mode === 'WEAK_TOPIC' ? '薄弱专项' : res.mode
                    : res.mode;
                  return (
                    <tr key={res.id}>
                      <td className="py-3 text-[#7C776B]">{new Date(res.date).toLocaleDateString()}</td>
                      <td className="py-3 font-semibold text-[#2D2A26] dark:text-[#EAE7DF]">{res.collectionName}</td>
                      <td className="py-3 text-[#7C776B]">{modeDisplay}</td>
                      <td className="py-3 font-bold text-[#5A6D5B] dark:text-[#A3B5A4]">{res.scorePercentage}%</td>
                      <td className="py-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            res.passed
                              ? 'bg-[#5A6D5B]/20 text-[#3E4A3E] dark:text-[#A3B5A4]'
                              : 'bg-rose-100/80 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {res.passed ? t('passedStatus') : t('failedStatus')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};