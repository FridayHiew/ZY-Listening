import { CategoryMetric, Question, QuizResult, UserAnswerRecord } from '../types';

/**
 * Calculate category-level weighted accuracy using recency decay (0.9)
 * BR-6 & Functional Rule: Min 5 attempts guard, threshold < 60%
 */
export function calculateCategoryMetrics(
  results: QuizResult[],
  allQuestions: Question[]
): CategoryMetric[] {
  // Collect all category attempts chronologically (newest last or sorted by date)
  const categoryAttemptsMap = new Map<string, { isCorrect: boolean; timestamp: number }[]>();

  // Ensure all existing categories in questions are initialized
  allQuestions.forEach((q) => {
    if (q.category && !categoryAttemptsMap.has(q.category)) {
      categoryAttemptsMap.set(q.category, []);
    }
  });

  // Sort quiz results chronologically ascending (oldest first) so recent = higher index
  const sortedResults = [...results].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedResults.forEach((res) => {
    res.answerRecords.forEach((ans) => {
      const cat = ans.category || 'General';
      if (!categoryAttemptsMap.has(cat)) {
        categoryAttemptsMap.set(cat, []);
      }
      categoryAttemptsMap.get(cat)!.push({
        isCorrect: ans.isCorrect,
        timestamp: new Date(res.date).getTime(),
      });
    });
  });

  const metrics: CategoryMetric[] = [];
  const DECAY = 0.9;
  const MIN_SAMPLE_SIZE = 5; // Guard: min 5 attempts to flag as weak
  const WEAK_THRESHOLD = 60; // < 60% is weak

  categoryAttemptsMap.forEach((attempts, category) => {
    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter((a) => a.isCorrect).length;
    const rawAccuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

    if (totalAttempts === 0) {
      metrics.push({
        category,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: 0,
        weightedAccuracy: 0,
        isWeak: false,
      });
      return;
    }

    // Weighted accuracy calculation:
    // age_i = distance from most recent attempt (0 for latest)
    let weightedSum = 0;
    let weightTotal = 0;

    const n = attempts.length;
    attempts.forEach((att, index) => {
      const age = n - 1 - index; // 0 for most recent attempt
      const weight = Math.pow(DECAY, age);
      const val = att.isCorrect ? 1 : 0;

      weightedSum += val * weight;
      weightTotal += weight;
    });

    const weightedAccuracy = weightTotal > 0 ? (weightedSum / weightTotal) * 100 : rawAccuracy;
    const isWeak = totalAttempts >= MIN_SAMPLE_SIZE && weightedAccuracy < WEAK_THRESHOLD;

    metrics.push({
      category,
      totalAttempts,
      correctAttempts,
      accuracy: Math.round(rawAccuracy),
      weightedAccuracy: Math.round(weightedAccuracy),
      isWeak,
    });
  });

  return metrics.sort((a, b) => a.weightedAccuracy - b.weightedAccuracy);
}

/**
 * Extract all unique incorrect questions across historical quiz results
 */
export function getIncorrectQuestionIds(results: QuizResult[]): Map<string, number> {
  const incorrectCountMap = new Map<string, number>();

  results.forEach((res) => {
    res.answerRecords.forEach((ans) => {
      if (!ans.isCorrect) {
        const count = incorrectCountMap.get(ans.questionId) || 0;
        incorrectCountMap.set(ans.questionId, count + 1);
      }
    });
  });

  return incorrectCountMap;
}

/**
 * Summarize overall user stats
 */
export function calculateOverallStats(results: QuizResult[]) {
  const totalSessions = results.length;
  let totalQuestionsAnswered = 0;
  let totalCorrect = 0;
  let totalTimeSpentSeconds = 0;

  results.forEach((res) => {
    totalQuestionsAnswered += res.totalQuestions;
    totalCorrect += res.correctCount;
    totalTimeSpentSeconds += res.timeSpentSeconds;
  });

  const overallAccuracy =
    totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;

  return {
    totalSessions,
    totalQuestionsAnswered,
    totalCorrect,
    totalWrong: totalQuestionsAnswered - totalCorrect,
    overallAccuracy,
    totalTimeSpentSeconds,
  };
}
