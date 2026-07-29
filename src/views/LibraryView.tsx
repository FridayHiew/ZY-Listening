// LibraryView.tsx
import React, { useState } from 'react';
import { AppStorageState, KnowledgeCollection, LanguageCode, QuizConfig } from '../types';
import { exportCollectionAsZIP } from '../utils/exporter';
import { getTranslation, translateDifficulty } from '../utils/i18n';
import { resolveImagePath } from '../utils/storage';
import { Plus, Play, FileText, Download, Trash2, Edit3, BookOpen, Layers, Check, X, Search, Folder, Tag, Award, FileArchive } from 'lucide-react';

interface LibraryViewProps {
  appState: AppStorageState;
  onUpdateCollections: (collections: KnowledgeCollection[]) => void;
  onStartQuiz: (config: QuizConfig) => void;
  onNavigateTab: (tab: any) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  appState,
  onUpdateCollections,
  onStartQuiz,
  onNavigateTab,
}) => {
  const { collections, settings } = appState;
  const lang = settings.language;
  const t = (key: any) => getTranslation(lang, key);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>('ALL');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');
  const [selectedCollection, setSelectedCollection] = useState<KnowledgeCollection | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [editingCollection, setEditingCollection] = useState<KnowledgeCollection | null>(null);
  const [editColName, setEditColName] = useState('');
  const [editColDesc, setEditColDesc] = useState('');
  const [editColGroup, setEditColGroup] = useState('General');
  const [editColLanguage, setEditColLanguage] = useState<LanguageCode>('en');
  const [editColDifficulty, setEditColDifficulty] = useState('Year 1');

  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColGroup, setNewColGroup] = useState('General');
  const [newColLanguage, setNewColLanguage] = useState<LanguageCode>('en');
  const [newColDifficulty, setNewColDifficulty] = useState('Year 1');

  const allGroups = Array.from(new Set(collections.map((c) => c.group || 'General')));

  // Filter collections by group first, to determine available difficulties & tags for further filtering
  const groupFilteredCollectionsForOptions = React.useMemo(() => {
    return collections.filter((c) => {
      return selectedGroupFilter === 'ALL' || (c.group || 'General') === selectedGroupFilter;
    });
  }, [collections, selectedGroupFilter]);

  const allTags = React.useMemo(() => {
    return Array.from(new Set(groupFilteredCollectionsForOptions.flatMap((c) => c.tags || []))).filter(Boolean);
  }, [groupFilteredCollectionsForOptions]);

  const availableDifficulties = React.useMemo(() => {
    const diffs = new Set<string>();
    groupFilteredCollectionsForOptions.forEach((c) => {
      let diff = c.difficulty || 'Year 1';
      // Normalize legacy difficulties
      if (diff === 'Beginner') diff = 'Year 1';
      else if (diff === 'Intermediate') diff = 'Year 3';
      else if (diff === 'Master') diff = 'Year 5';
      diffs.add(diff);
    });
    return Array.from(diffs);
  }, [groupFilteredCollectionsForOptions]);

  // Automatically reset difficulty and tag filters if they are no longer applicable in the selected group
  React.useEffect(() => {
    if (selectedDifficultyFilter !== 'ALL' && !availableDifficulties.includes(selectedDifficultyFilter)) {
      setSelectedDifficultyFilter('ALL');
    }
  }, [availableDifficulties, selectedDifficultyFilter]);

  React.useEffect(() => {
    if (selectedTagFilter !== 'ALL' && !allTags.includes(selectedTagFilter)) {
      setSelectedTagFilter('ALL');
    }
  }, [allTags, selectedTagFilter]);

  const filteredCollections = collections.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.group || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.categories.some((cat) => cat.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.tags || []).some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGroup = selectedGroupFilter === 'ALL' || (c.group || 'General') === selectedGroupFilter;

    const matchesDifficulty =
      selectedDifficultyFilter === 'ALL' ||
      c.difficulty === selectedDifficultyFilter ||
      (selectedDifficultyFilter === 'Year 1' && c.difficulty === 'Beginner') ||
      (selectedDifficultyFilter === 'Year 3' && c.difficulty === 'Intermediate') ||
      (selectedDifficultyFilter === 'Year 5' && c.difficulty === 'Master');

    const matchesTag = selectedTagFilter === 'ALL' || (c.tags || []).includes(selectedTagFilter);

    return matchesSearch && matchesGroup && matchesDifficulty && matchesTag;
  });

  const groupedCollections: Record<string, KnowledgeCollection[]> = {};
  filteredCollections.forEach((col) => {
    const groupKey = col.group?.trim() || 'General';
    if (!groupedCollections[groupKey]) {
      groupedCollections[groupKey] = [];
    }
    groupedCollections[groupKey].push(col);
  });

  const handleStartEdit = (col: KnowledgeCollection) => {
    setEditingCollection(col);
    setEditColName(col.name);
    setEditColDesc(col.description || '');
    setEditColGroup(col.group || 'General');
    setEditColLanguage(col.language || 'en');
    setEditColDifficulty(col.difficulty || 'Year 1');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollection || !editColName.trim()) return;

    const updated = collections.map((c) => {
      if (c.id === editingCollection.id) {
        return {
          ...c,
          name: editColName.trim(),
          description: editColDesc.trim(),
          group: editColGroup.trim() || 'General',
          language: editColLanguage,
          difficulty: editColDifficulty,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });

    onUpdateCollections(updated);

    if (selectedCollection?.id === editingCollection.id) {
      setSelectedCollection({
        ...selectedCollection,
        name: editColName.trim(),
        description: editColDesc.trim(),
        group: editColGroup.trim() || 'General',
        language: editColLanguage,
        difficulty: editColDifficulty,
        updatedAt: new Date().toISOString(),
      });
    }

    setEditingCollection(null);
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    const newCol: KnowledgeCollection = {
      id: `col_${Date.now()}`,
      name: newColName.trim(),
      description: newColDesc.trim() || 'Custom Knowledge Collection',
      group: newColGroup.trim() || 'General',
      language: newColLanguage,
      difficulty: newColDifficulty,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questionCount: 0,
      categories: ['General'],
      questions: [],
    };

    onUpdateCollections([...collections, newCol]);
    setNewColName('');
    setNewColDesc('');
    setNewColGroup('General');
    setNewColLanguage('en');
    setNewColDifficulty('Year 1');
    setShowCreateModal(false);
  };

  const handleDeleteCollection = (id: string) => {
    if (confirm(lang === 'zh' ? '确定要删除这个书本及其所有题目吗？' : 'Are you sure you want to delete this collection and its questions?')) {
      onUpdateCollections(collections.filter((c) => c.id !== id));
      if (selectedCollection?.id === id) {
        setSelectedCollection(null);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
            {t('libraryTitle')}
          </h2>
          <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
            {t('libraryDesc')}
          </p>
        </div>
      </div>

      {/* Search & Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A09886]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-4 h-10 bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-xs text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
          />
        </div>

        {/* Group Filter */}
        <div>
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="w-full h-10 px-3 bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-xs font-semibold text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
          >
            <option value="ALL">📂 {t('allGroups')} ({allGroups.length})</option>
            {allGroups.map((g) => (
              <option key={g} value={g}>
                📂 {g}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <select
            value={selectedDifficultyFilter}
            onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
            className="w-full h-10 px-3 bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-xs font-semibold text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
          >
            <option value="ALL">🎓 {lang === 'zh' ? '所有年级' : lang === 'ms' ? 'Semua Tahun' : 'All Years'}</option>
            {(['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'] as const)
              .filter((lvl) => availableDifficulties.includes(lvl))
              .map((lvl) => (
                <option key={lvl} value={lvl}>
                  🎓 {translateDifficulty(lang, lvl)}
                </option>
              ))}
          </select>
        </div>

        {/* Tag Filter */}
        <div>
          <select
            value={selectedTagFilter}
            onChange={(e) => setSelectedTagFilter(e.target.value)}
            className="w-full h-10 px-3 bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-xs font-semibold text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
          >
            <option value="ALL">🏷️ {lang === 'zh' ? '所有标签' : lang === 'ms' ? 'Semua Tag' : 'All Tags'} ({allTags.length})</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                🏷️ {tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Collections Grouped by Group Field */}
      {Object.keys(groupedCollections).length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl">
          <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
            {t('noCollectionsFound')}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedCollections).map(([groupName, groupCols]) => (
            <div key={groupName} className="space-y-3">
              {/* Group Header */}
              <div className="flex items-center justify-between border-b border-[#E8E2D2] dark:border-[#353B35] pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4]">
                    <Folder className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                    {t('groupPrefix')} {groupName}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] font-bold border border-[#5A6D5B]/20">
                    {groupCols.length} {t('collections')}
                  </span>
                </div>
              </div>

              {/* Collections Cards Grid for this Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupCols.map((collection) => (
                  <div
                    key={collection.id}
                    className="p-5 bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl shadow-sm flex flex-col justify-between hover:border-[#5A6D5B] transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] line-clamp-1 font-serif">
                          {collection.name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F2EA] dark:bg-[#2D322D] text-[#5A6D5B] dark:text-[#A3B5A4] border border-[#E8E2D2] dark:border-[#353B35] shrink-0">
                          {collection.questions.length} {t('questionsCount')}
                        </span>
                      </div>

                      {/* Group Tag & Difficulty Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap my-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] border border-[#5A6D5B]/20 animate-fade-in">
                          <Folder className="w-3 h-3" />
                          {collection.group || 'General'}
                        </span>

                        {(() => {
                          const diffVal = collection.difficulty || 'Year 1';
                          let num = parseInt(diffVal.match(/\d+/)?.[0] || '1', 10);
                          // Backwards compatibility normalization
                          if (diffVal === 'Beginner') num = 1;
                          else if (diffVal === 'Intermediate') num = 3;
                          else if (diffVal === 'Master') num = 5;

                          const bgBorder = 
                            num <= 2
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : num <= 4
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
                          const indicator = num <= 2 ? '🟢' : num <= 4 ? '🟡' : '🔴';
                          return (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${bgBorder} animate-fade-in`}>
                              {indicator} {translateDifficulty(lang, diffVal)}
                            </span>
                          );
                        })()}

                        {/* Language Badge */}
                        {(() => {
                          const cLang = collection.language || 'en';
                          const flagText = cLang === 'zh' ? '🇨🇳 华文' : cLang === 'ms' ? '🇲🇾 Melayu' : '🇬🇧 English';
                          return (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 animate-fade-in">
                              {flagText}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Book tags list */}
                      {collection.tags && collection.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1 mb-3">
                          {collection.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#F5F2EA] dark:bg-[#2D322D] text-[#7C776B] dark:text-[#A09886] border border-[#E8E2D2] dark:border-[#353B35]"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-[#7C776B] dark:text-[#A09886] line-clamp-2 mb-3">
                        {collection.description || (lang === 'zh' ? '暂无描述。' : 'No description provided.')}
                      </p>

                      {/* Categories Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {collection.categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#F5F2EA] dark:bg-[#2D322D] text-[#6B6559] dark:text-[#A09886]"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>

                      {/* Last Quiz Score Display */}
                      {(() => {
                        const matchingResults = (appState.quizResults || []).filter(
                          (r) => r.collectionId === collection.id || r.collectionName === collection.name
                        );
                        const lastRes = matchingResults.length > 0
                          ? [...matchingResults].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                          : null;

                        if (lastRes) {
                          const isPass = lastRes.scorePercentage >= (settings.defaultPassMark || 70);
                          return (
                            <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold mb-3 ${
                              isPass
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                                : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
                            }`}>
                              <span className="text-[#6B6559] dark:text-[#A09886] flex items-center gap-1.5">
                                <Award className={`w-3.5 h-3.5 ${isPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
                                {t('lastScore')}:
                              </span>
                              <span className={`font-bold ${isPass ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                                {lastRes.scorePercentage}% ({lastRes.correctCount}/{lastRes.totalQuestions})
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#F5F2EA]/60 dark:bg-[#2D322D]/60 border border-dashed border-[#E8E2D2] dark:border-[#353B35] text-[11px] text-[#A09886] mb-3">
                            <span className="flex items-center gap-1.5 font-medium">
                              <Award className="w-3.5 h-3.5 text-[#A09886]" />
                              {t('lastScore')}:
                            </span>
                            <span className="italic font-normal text-[10px]">
                              {lang === 'zh' ? '暂无练习记录' : lang === 'ms' ? 'Belum ada latihan' : 'No practice taken'}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-3 border-t border-[#E8E2D2] dark:border-[#353B35]">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          disabled={collection.questions.length === 0}
                          onClick={() =>
                            onStartQuiz({
                              collectionId: collection.id,
                              collectionName: collection.name,
                              mode: 'PRACTICE',
                              questionCount: Math.min(10, collection.questions.length),
                            })
                          }
                          className="w-full py-2 px-3 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{t('practice')}</span>
                        </button>

                        <button
                          disabled={collection.questions.length === 0}
                          onClick={() =>
                            onStartQuiz({
                              collectionId: collection.id,
                              collectionName: collection.name,
                              mode: 'EXAM',
                              questionCount: Math.min(20, collection.questions.length),
                              timeLimitMinutes: Math.min(20, collection.questions.length),
                            })
                          }
                          className="w-full py-2 px-3 rounded-xl bg-[#EAE5D8] dark:bg-[#2D322D] hover:bg-[#D9C5B2] text-[#3E4A3E] dark:text-[#F5F2EA] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 border border-[#D9C5B2] dark:border-[#353B35]"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{t('exam')}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <button
                          onClick={() => setSelectedCollection(collection)}
                          className="text-[#7C776B] hover:text-[#2D2A26] dark:hover:text-[#F5F2EA] font-medium"
                        >
                          {t('viewQuestions')} ({collection.questions.length})
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(collection)}
                            className="p-1.5 rounded-lg text-[#5A6D5B] hover:bg-[#F5F2EA] dark:hover:bg-[#2D322D] transition-colors"
                            title={t('editCollection')}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => exportCollectionAsZIP(collection)}
                            className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                            title={lang === 'zh' ? '导出 ZIP 格式 (含图片)' : 'Export as ZIP (with images)'}
                          >
                            <FileArchive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCollection(collection.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title={t('deleteCollection')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Collection Modal */}
      {editingCollection && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl p-6 shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                {t('editCollection')}
              </h3>
              <button
                onClick={() => setEditingCollection(null)}
                className="text-[#7C776B] hover:text-[#2D2A26] dark:hover:text-[#F5F2EA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  {t('collectionName')} *
                </label>
                <input
                  type="text"
                  required
                  value={editColName}
                  onChange={(e) => setEditColName(e.target.value)}
                  placeholder="e.g., Python Basics & OOP"
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  {t('groupSubject')} *
                </label>
                <input
                  type="text"
                  required
                  list="edit-group-suggestions"
                  value={editColGroup}
                  onChange={(e) => setEditColGroup(e.target.value)}
                  placeholder="e.g., Cybersecurity, Cloud, Programming"
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                />
                <datalist id="edit-group-suggestions">
                  {allGroups.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  {lang === 'zh' ? '发音与发音语言' : lang === 'ms' ? 'Bahasa Sebutan Buku' : 'Book Pronunciation Language'} *
                </label>
                <select
                  value={editColLanguage}
                  onChange={(e) => setEditColLanguage(e.target.value as LanguageCode)}
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                >
                  <option value="en">🇬🇧 English (Bahasa Inggeris)</option>
                  <option value="zh">🇨🇳 中文 / 华文 (Chinese)</option>
                  <option value="ms">🇲🇾 Bahasa Melayu (Malay)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  {t('difficultyLevel')} *
                </label>
                <select
                  value={editColDifficulty}
                  onChange={(e) => setEditColDifficulty(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                >
                  {(['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'] as const).map((lvl) => {
                    const num = parseInt(lvl.match(/\d+/)?.[0] || '1', 10);
                    const indicator = num <= 2 ? '🟢' : num <= 4 ? '🟡' : '🔴';
                    return (
                      <option key={lvl} value={lvl}>
                        {indicator} {translateDifficulty(lang, lvl)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  {t('description')}
                </label>
                <textarea
                  value={editColDesc}
                  onChange={(e) => setEditColDesc(e.target.value)}
                  rows={3}
                  placeholder="Short description of learning materials..."
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCollection(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7C776B] hover:bg-[#F5F2EA] dark:hover:bg-[#2D322D]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-semibold text-xs transition-all shadow-sm"
                >
                  {t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl p-6 shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                {t('createCollection')}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#7C776B] hover:text-[#2D2A26] dark:hover:text-[#F5F2EA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  {t('collectionName')} *
                </label>
                <input
                  type="text"
                  required
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g., Python Basics & OOP"
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  {t('groupSubject')} *
                </label>
                <input
                  type="text"
                  required
                  list="new-group-suggestions"
                  value={newColGroup}
                  onChange={(e) => setNewColGroup(e.target.value)}
                  placeholder="e.g., Cybersecurity, Cloud, Programming"
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                />
                <datalist id="new-group-suggestions">
                  {allGroups.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  {lang === 'zh' ? '发音与发音语言' : lang === 'ms' ? 'Bahasa Sebutan Buku' : 'Book Pronunciation Language'} *
                </label>
                <select
                  value={newColLanguage}
                  onChange={(e) => setNewColLanguage(e.target.value as LanguageCode)}
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                >
                  <option value="en">🇬🇧 English (Bahasa Inggeris)</option>
                  <option value="zh">🇨🇳 中文 / 华文 (Chinese)</option>
                  <option value="ms">🇲🇾 Bahasa Melayu (Malay)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  {t('difficultyLevel')} *
                </label>
                <select
                  value={newColDifficulty}
                  onChange={(e) => setNewColDifficulty(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                >
                  {(['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'] as const).map((lvl) => {
                    const num = parseInt(lvl.match(/\d+/)?.[0] || '1', 10);
                    const indicator = num <= 2 ? '🟢' : num <= 4 ? '🟡' : '🔴';
                    return (
                      <option key={lvl} value={lvl}>
                        {indicator} {translateDifficulty(lang, lvl)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  {t('description')}
                </label>
                <textarea
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  rows={3}
                  placeholder="Short description of learning materials..."
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7C776B] hover:bg-[#F5F2EA] dark:hover:bg-[#2D322D]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-semibold text-xs transition-all shadow-sm"
                >
                  {t('createCollection')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Collection Questions Details Drawer/Modal */}
      {selectedCollection && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl p-6 shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D2] dark:border-[#353B35] shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                      {selectedCollection.name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] border border-[#5A6D5B]/20">
                      📁 {selectedCollection.group || 'General'}
                    </span>
                  </div>
                  <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
                    {selectedCollection.questions.length} Questions stored locally
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCollection(null)}
                className="text-[#7C776B] hover:text-[#2D2A26] dark:hover:text-[#F5F2EA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 py-4 flex-1 pr-1">
              {selectedCollection.questions.length === 0 ? (
                <p className="text-xs text-[#7C776B] text-center py-6">
                  {t('noQuestions')}
                </p>
              ) : (
                selectedCollection.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3.5 bg-[#F5F2EA]/60 dark:bg-[#2D322D]/60 rounded-xl border border-[#E8E2D2] dark:border-[#353B35] text-xs"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-bold text-[#5A6D5B] dark:text-[#A3B5A4]">
                        Q{idx + 1}. [{q.category}]
                      </span>
                      <span className="text-[10px] text-[#A09886]">ID: {q.id}</span>
                    </div>

                    <p className="font-semibold text-[#2D2A26] dark:text-[#EAE7DF] mb-2">
                      {q.questionText}
                    </p>

                    {q.image && (
                      <div className="my-3 max-h-64 rounded-2xl overflow-hidden border border-[#E8E2D2] dark:border-[#353B35] bg-[#F5F2EA] dark:bg-[#2D322D] flex items-center justify-center p-2">
                        <img
                          src={resolveImagePath(q.image)}
                          alt="Question supporting diagram"
                          className="max-h-60 object-contain rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg border text-[11px] font-medium ${
                            oIdx === q.correctIndex
                              ? 'bg-[#5A6D5B]/15 dark:bg-[#5A6D5B]/30 border-[#5A6D5B] text-[#3E4A3E] dark:text-[#A3B5A4] font-bold'
                              : 'bg-white dark:bg-[#242824] border-[#E8E2D2] dark:border-[#353B35] text-[#2D2A26] dark:text-[#EAE7DF]'
                          }`}
                        >
                          <span className="mr-1">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-[#7C776B] dark:text-[#A09886] italic bg-white/50 dark:bg-[#242824]/50 p-2 rounded-lg">
                        {t('questionExplanation')}: {q.explanation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-[#E8E2D2] dark:border-[#353B35] flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCollection(null)}
                className="px-4 py-2 rounded-xl bg-[#F5F2EA] dark:bg-[#2D322D] text-[#2D2A26] dark:text-[#EAE7DF] font-semibold text-xs border border-[#E8E2D2] dark:border-[#353B35]"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};