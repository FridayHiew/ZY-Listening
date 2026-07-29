// ImportView.tsx
import React, { useState, useRef, useEffect } from 'react';
import { AppStorageState, KnowledgeCollection, ValidationReport } from '../types';
import { parseJSONImport, parseZIPImport, parseCSVImport } from '../utils/importer';
import { downloadSampleJSONTemplate, downloadSampleCSVTemplate, downloadSampleZIPTemplate } from '../utils/exporter';
import { getTranslation } from '../utils/i18n';
import { UploadCloud, FileCode, CheckCircle2, Sparkles, Copy, Check, Paperclip, FileJson, FileSpreadsheet, FileArchive, X, BookOpen, AlertTriangle } from 'lucide-react';

interface ImportViewProps {
  appState: AppStorageState;
  isAdmin?: boolean;
  onUpdateCollections: (collections: KnowledgeCollection[]) => void;
  onNavigateTab: (tab: any) => void;
}

export const ImportView: React.FC<ImportViewProps> = ({
  appState,
  isAdmin,
  onUpdateCollections,
  onNavigateTab,
}) => {
  const { collections, settings } = appState;
  const lang = settings.language;
  const t = (key: any) => getTranslation(lang, key);

  const [report, setReport] = useState<ValidationReport | null>(null);
  const [conflictStrategy, setConflictStrategy] = useState<'SKIP' | 'OVERWRITE' | 'IMPORT_NEW'>('IMPORT_NEW');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState<{ bookName: string; count: number } | null>(null);
  const [selectedTargetLang, setSelectedTargetLang] = useState<'bm' | 'eng' | 'zh'>(() => {
    if (lang === 'zh') return 'zh';
    if (lang === 'ms') return 'bm';
    return 'bm';
  });
  const [promptFormat, setPromptFormat] = useState<'json' | 'csv'>('json');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to validation report area when generated
  useEffect(() => {
    if (report) {
      const timer = setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [report]);

  const getPromptText = (targetLang: 'bm' | 'eng' | 'zh', format: 'json' | 'csv') => {
    if (format === 'csv') {
      if (targetLang === 'bm') {
        return `Please generate a Bahasa Melayu primary school KSSR spelling and vocabulary collection (Kosa Kata & Ejaan Bahasa Melayu) in valid CSV format based on the text / topic / document provided.

Strictly output ONLY a raw CSV block (no intro text, no conversational text, no markdown formatting except code block if needed) containing metadata rows starting with #, followed by the header column row, and then the questions.

Example CSV structure:
# collectionName: Kosa Kata Bahasa Melayu (KSSR)
# version: 1
# description: Latihan ejaan dan kosa kata Bahasa Melayu Sekolah Rendah (SK & SJKC) selaras dengan KSSR.
# group: Malay
# language: bm
# difficulty: Tahun 2
# tags: ejaan
ID,Category,QuestionText,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Explanation,SourceReference,ImageFile
ms-q001,Sekolah & Rumah,perpustakaan,prepustakaan,perpustakan,perpustakaan,perpustakkaan,C,"图书馆（Library / Perpustakaan）。Maksud: Tempat membaca dan meminjam buku. 例句：Murid-murid membaca buku di perpustakaan.（同学们在图书馆看书。）","Buku Teks BM Tahun 3, Unit 4",
ms-q002,Sekolah & Rumah,sekolah,sekolah,sekola,sekolat,syekolah,A,"学校（School / Sekolah）。Maksud: Tempat untuk belajar. 例句：Saya pergi ke sekolah setiap hari.（我每天去上学。）","Buku Teks BM Tahun 1, Unit 2",`;
      } else if (targetLang === 'eng') {
        return `Please generate a Primary School English (KSSR) spelling and vocabulary collection in valid CSV format based on the text / topic / document provided.

Strictly output ONLY a raw CSV block (no intro text, no conversational text, no markdown formatting except code block if needed) containing metadata rows starting with #, followed by the header column row, and then the questions.

Example CSV structure:
# collectionName: Primary School English Vocabulary (KSSR)
# version: 1
# description: Standard Year 1-6 English spelling vocabulary and common terms for primary school (KSSR).
# group: English
# language: en
# difficulty: Year 2
# tags: english
ID,Category,QuestionText,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Explanation,SourceReference,ImageFile
eng-q001,Animals,Butterfly,Butterflee,Butterfly,Butterflai,Butterflie,B,"蝴蝶（Butterfly）。例句：The butterfly has colourful wings.（蝴蝶有绚丽彩色的翅膀。）","English Year 2 Textbook, Unit 5",
eng-q002,School Life,Library,Libary,Librari,Library,Lybrary,C,"图书馆（Library）。例句：We read books in the library.（我们在图书馆里看书。）","English Year 3 Textbook, Unit 1",`;
      } else {
        return `请根据提供的教学内容或词汇表，生成符合马来西亚华小华文 (SJKC KSSR) 标准的汉字词汇与拼写 CSV 题库。

务必严格仅输出单个 CSV 内容（无需代码块标记，无需开场白），必须在 CSV 顶部包含以 # 开头的元数据行，然后是列标题行和数据行：

示例 CSV 结构：
# collectionName: 华小华文核心词汇 (KSSR)
# version: 1
# description: 适用于马来西亚华文小学 (SJKC) 常用核心词汇与字词拼写练习。
# group: 华文
# language: zh
# difficulty: 二年级
# tags: 听写
ID,Category,QuestionText,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Explanation,SourceReference,ImageFile
chi-q001,校园生活,学校,学校,学效,学较,学郊,A,"学校（School）。意思：学生求学读书的场所。例句：我们在学校里认真学习。（We study hard at school.）","华小二年级 华文课本 第一单元",
chi-q002,校园生活,操场,燥场,操场,澡场,躁场,B,"操场（Field/Playground）。意思：供体育锻炼或集会的场地。例句：同学们在操场上踢足球。（Students are playing football on the field.）","华小一年级 华文课本 第三单元",`;
      }
    } else {
      if (targetLang === 'bm') {
        return `Please generate a Bahasa Melayu primary school KSSR spelling and vocabulary collection (Kosa Kata & Ejaan Bahasa Melayu) in valid JSON format based on the text / topic / document provided.

Strictly output ONLY a single raw JSON object (no markdown formatting, no code block markers, no intro text) following this exact schema:

{
  "collectionName": "Kosa Kata Bahasa Melayu (KSSR)",
  "version": 1,
  "description": "Latihan ejaan dan kosa kata Bahasa Melayu Sekolah Rendah (SK & SJKC) selaras dengan KSSR.",
  "group": "Malay",
  "language": "bm",
  "difficulty": "Tahun 2",
  "tags": [
    "ejaan",
  ],
  "questions": [
    {
      "id": "ms-q001",
      "category": "Sekolah & Rumah",
      "questionText": "perpustakaan",
      "statements": {},
      "optionA": "prepustakaan",
      "optionB": "perpustakan",
      "optionC": "perpustakaan",
      "optionD": "perpustakkaan",
      "correctAnswer": "C",
      "explanation": "图书馆（Library / Perpustakaan）。Maksud: Tempat membaca dan meminjam buku. 例句：Murid-murid membaca buku di perpustakaan.（同学们在图书馆看书。）",
      "sourceReference": "Buku Teks BM Tahun 3, Unit 4",
      "imageFile": ""
    },
    {
      "id": "ms-q002",
      "category": "Sekolah & Rumah",
      "questionText": "sekolah",
      "statements": {},
      "optionA": "sekolah",
      "optionB": "sekola",
      "optionC": "sekolat",
      "optionD": "syekolah",
      "correctAnswer": "A",
      "explanation": "学校（School / Sekolah）。Maksud: Tempat untuk belajar. 例句：Saya pergi ke sekolah setiap hari.（我每天去上学。）",
      "sourceReference": "Buku Teks BM Tahun 1, Unit 2",
      "imageFile": ""
    }
  ]
}`;
      } else if (targetLang === 'eng') {
        return `Please generate a Primary School English (KSSR) spelling and vocabulary collection in valid JSON format based on the text / topic / document provided.

Strictly output ONLY a single raw JSON object (no markdown formatting, no code block markers, no intro text) following this exact schema:

{
  "collectionName": "Primary School English Vocabulary (KSSR)",
  "version": 1,
  "description": "Standard Year 1-6 English spelling vocabulary and common terms for primary school (KSSR).",
  "group": "English",
  "language": "en",
  "difficulty": "Year 2",
  "tags": [
    "english"
  ],
  "questions": [
    {
      "id": "eng-q001",
      "category": "Animals",
      "questionText": "Butterfly",
      "statements": {},
      "optionA": "Butterflee",
      "optionB": "Butterfly",
      "optionC": "Butterflai",
      "optionD": "Butterflie",
      "correctAnswer": "B",
      "explanation": "蝴蝶（Butterfly）。例句：The butterfly has colourful wings.（蝴蝶有绚丽彩色的翅膀。）",
      "sourceReference": "English Year 2 Textbook, Unit 5",
      "imageFile": ""
    },
    {
      "id": "eng-q002",
      "category": "School Life",
      "questionText": "Library",
      "statements": {},
      "optionA": "Libary",
      "optionB": "Librari",
      "optionC": "Library",
      "optionD": "Lybrary",
      "correctAnswer": "C",
      "explanation": "图书馆（Library）。例句：We read books in the library.（我们在图书馆里看书。）",
      "sourceReference": "English Year 3 Textbook, Unit 1",
      "imageFile": ""
    }
  ]
}`;
      } else {
        return `请根据提供的教学内容或词汇表，生成符合马来西亚华小华文 (SJKC KSSR) 标准的汉字词汇与拼写 JSON 题库。

务必严格仅输出单个 JSON 对象（无需 Markdown 格式，无需代码块标记，无需开场白），严格遵循以下格式：

{
  "collectionName": "华小华文核心词汇 (KSSR)",
  "version": 1,
  "description": "适用于马来西亚华文小学 (SJKC) 常用核心词汇与字词拼写练习。",
  "group": "华文",
  "language": "zh",
  "difficulty": "二年级",
  "tags": [
    "听写",
  ],
  "questions": [
    {
      "id": "chi-q001",
      "category": "校园生活",
      "questionText": "学校",
      "statements": {},
      "optionA": "学校",
      "optionB": "学效",
      "optionC": "学较",
      "optionD": "学郊",
      "correctAnswer": "A",
      "explanation": "学校（School）。意思：学生求学读书的场所。例句：我们在学校里认真学习。（We study hard at school.）",
      "sourceReference": "华小二年级 华文课本 第一单元",
      "imageFile": ""
    },
    {
      "id": "chi-q002",
      "category": "校园生活",
      "questionText": "操场",
      "statements": {},
      "optionA": "燥场",
      "optionB": "操场",
      "optionC": "澡场",
      "optionD": "躁场",
      "correctAnswer": "B",
      "explanation": "操场（Field/Playground）。意思：供体育锻炼或集会的场地。例句：同学们在操场上踢足球。（Students are playing football on the field.）",
      "sourceReference": "华小一年级 华文课本 第三单元",
      "imageFile": ""
    }
  ]
}`;
      }
    }
  };

  const aiPromptText = getPromptText(selectedTargetLang, promptFormat);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setReport(null);

    try {
      const filename = file.name.toLowerCase();
      let res: ValidationReport;

      if (filename.endsWith('.json')) {
        const text = await file.text();
        res = await parseJSONImport(text);
      } else if (filename.endsWith('.csv')) {
        const text = await file.text();
        res = await parseCSVImport(text, file.name);
      } else if (filename.endsWith('.zip')) {
        const buffer = await file.arrayBuffer();
        res = await parseZIPImport(buffer);
      } else {
        res = {
          isValid: false,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          errors: [{
            row: 0,
            field: 'fileFormat',
            message: lang === 'zh'
              ? '不支持的文件格式，请上传 .json, .csv 或 .zip 文件。'
              : lang === 'ms'
              ? 'Format fail tidak disokong, sila muat naik fail .json, .csv atau .zip.'
              : 'Unsupported file format. Please upload .json, .csv, or .zip files.'
          }],
          warnings: [],
          extractedQuestions: [],
          collectionName: file.name,
        };
      }

      // Check format compliance
      if (!res.isValid || res.extractedQuestions.length === 0) {
        if (res.errors.length === 0) {
          res.errors.push({
            row: 0,
            field: 'format',
            message: lang === 'zh'
              ? '数据格式不符合要求（未检测到有效题目与选项），不可导入。'
              : lang === 'ms'
              ? 'Format data tidak memenuhi syarat (tiada soalan sah ditemui), tidak boleh diimport.'
              : 'Data format does not comply with requirements (no valid questions found), import blocked.'
          });
        }
      }

      setReport(res);
    } catch (err: any) {
      setReport({
        isValid: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        errors: [{
          row: 0,
          field: 'fileParse',
          message: err.message || (lang === 'zh' ? '文件解析失败或损坏，格式不符合。' : 'File parsing failed or corrupted.')
        }],
        warnings: [],
        extractedQuestions: [],
        collectionName: file.name,
      });
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!report || !report.isValid || report.extractedQuestions.length === 0) {
      alert(
        lang === 'zh'
          ? '数据格式不符合要求，无法导入！请修改文件格式后重试。'
          : lang === 'ms'
          ? 'Format data tidak sah, tidak boleh diimport!'
          : 'Data format is invalid, cannot import!'
      );
      return;
    }

    const colName = report.collectionName || (lang === 'zh' ? '导入题库' : 'Imported Collection');
    const existingIndex = collections.findIndex((c) => c.name.toLowerCase() === colName.toLowerCase());

    let updatedCollections = [...collections];

    if (existingIndex >= 0 && conflictStrategy === 'SKIP') {
      alert(lang === 'zh' ? `题库集合“${colName}”已存在，根据冲突策略已跳过导入。` : `Collection "${colName}" already exists. Import skipped based on strategy.`);
      return;
    } else if (existingIndex >= 0 && conflictStrategy === 'OVERWRITE') {
      updatedCollections[existingIndex] = {
        ...updatedCollections[existingIndex],
        description: report.collectionDescription || updatedCollections[existingIndex].description,
        group: report.collectionGroup || updatedCollections[existingIndex].group || 'General',
        language: report.collectionLanguage || updatedCollections[existingIndex].language || 'en',
        difficulty: report.collectionDifficulty || updatedCollections[existingIndex].difficulty || 'Master',
        tags: report.collectionTags || updatedCollections[existingIndex].tags || [],
        updatedAt: new Date().toISOString(),
        questionCount: report.extractedQuestions.length,
        questions: report.extractedQuestions,
        categories: Array.from(new Set(report.extractedQuestions.map((q) => q.category))),
      };
    } else {
      const finalName = existingIndex >= 0 ? `${colName} (${new Date().toLocaleTimeString()})` : colName;
      const newCollection: KnowledgeCollection = {
        id: `col_${Date.now()}`,
        name: finalName,
        description: report.collectionDescription || (lang === 'zh' ? `包含 ${report.extractedQuestions.length} 道题目的导入题库。` : `Imported with ${report.extractedQuestions.length} questions.`),
        group: report.collectionGroup || 'General',
        language: report.collectionLanguage || 'en',
        difficulty: report.collectionDifficulty || 'Master',
        version: 1,
        tags: report.collectionTags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questionCount: report.extractedQuestions.length,
        categories: Array.from(new Set(report.extractedQuestions.map((q) => q.category))),
        questions: report.extractedQuestions,
      };
      updatedCollections.push(newCollection);
    }

    onUpdateCollections(updatedCollections);
    
    // Show Centered Success Modal
    setSuccessModal({
      bookName: colName,
      count: report.extractedQuestions.length,
    });
    setReport(null);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
          {t('importTitle')}
        </h2>
        <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
          {t('importDesc')}
        </p>
      </div>

      {/* File Upload Dropzone */}
      <div className="p-8 bg-white dark:bg-[#242824] border-2 border-dashed border-[#E8E2D2] dark:border-[#353B35] rounded-3xl text-center hover:border-[#5A6D5B] transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] mb-1 font-serif">
          {t('dropFileHere')}
        </h3>
        <p className="text-xs text-[#7C776B] dark:text-[#A09886] max-w-sm mx-auto mb-4">
          {lang === 'zh' 
            ? '支持 JSON, CSV 或打包的 ZIP 格式' 
            : lang === 'ms' 
            ? 'Sokong format JSON, CSV atau ZIP yang dibungkus' 
            : 'Supports JSON, CSV, or packaged ZIP formats'}
        </p>

        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-semibold text-xs cursor-pointer transition-all shadow-sm">
          <UploadCloud className="w-4 h-4" />
          <span>{t('chooseFile')}</span>
          <input
            type="file"
            accept=".json,.zip,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Pre-Import Validation & Preview Report */}
      {report && (
        <div
          ref={reportRef}
          id="validation-report-section"
          className="p-6 bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl space-y-6 shadow-sm scroll-mt-6"
        >
          <div className="flex items-center justify-between border-b border-[#E8E2D2] dark:border-[#353B35] pb-4">
            <div>
              <h3 className="font-bold text-base text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                {lang === 'zh' ? '导入前数据校验报告' : 'Pre-Import Validation Report'}
              </h3>
              <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
                {lang === 'zh' ? '题库集合：' : 'Collection:'} <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF]">{report.collectionName}</span>
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                report.isValid && report.extractedQuestions.length > 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200'
              }`}
            >
              {report.isValid && report.extractedQuestions.length > 0
                ? (lang === 'zh' ? '校验通过' : 'Validation Passed')
                : (lang === 'zh' ? '格式不合规 / 校验失败' : 'Validation Failed')}
            </span>
          </div>

          {/* Validation Warning when Format is Invalid */}
          {(!report.isValid || report.extractedQuestions.length === 0) && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm mb-1">
                  {lang === 'zh' ? '❌ 数据格式不符合要求，不可导入' : lang === 'ms' ? '❌ Format data tidak mematuhi syarat, tidak boleh diimport' : '❌ Data format validation failed, cannot import'}
                </span>
                <p>
                  {lang === 'zh'
                    ? '文件未通过格式校验，请检查文件中的题目文本、4个选项 (Option A-D) 及正确答案等结构是否完整规范。修正文件后再试。'
                    : lang === 'ms'
                    ? 'Sila semak semula format teks soalan, 4 pilihan jawapan dan jawapan betul dalam fail anda.'
                    : 'Please verify that your file contains valid question texts, 4 options (Option A-D), and correct answer designations.'}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 rounded-xl bg-[#F5F2EA] dark:bg-[#2D322D]">
              <span className="text-[#7C776B] dark:text-[#A09886] block text-[10px]">
                {lang === 'zh' ? '解析总数' : 'Total Parsed'}
              </span>
              <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF] text-sm">{report.totalRows}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <span className="text-emerald-600 dark:text-emerald-400 block text-[10px]">
                {lang === 'zh' ? '有效题目' : 'Valid Questions'}
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">{report.validRows}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40">
              <span className="text-rose-600 dark:text-rose-400 block text-[10px]">
                {lang === 'zh' ? '跳过 / 无效' : 'Skipped / Invalid'}
              </span>
              <span className="font-bold text-rose-700 dark:text-rose-300 text-sm">{report.invalidRows}</span>
            </div>
          </div>

          {report.errors.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs space-y-1">
              <span className="font-bold block">{lang === 'zh' ? '校验错误说明：' : 'Validation Errors:'}</span>
              {report.errors.map((err, idx) => (
                <p key={idx} className="text-[11px]">
                  • {lang === 'zh' ? `第 ${err.row} 行 [${err.field}]: ${err.message}` : `Row ${err.row} [${err.field}]: ${err.message}`}
                </p>
              ))}
            </div>
          )}

          <div className="p-4 bg-[#F5F2EA] dark:bg-[#2D322D] rounded-xl border border-[#E8E2D2] dark:border-[#353B35]">
            <label className="text-xs font-bold text-[#2D2A26] dark:text-[#EAE7DF] block mb-2">
              {lang === 'zh' ? '若集合或题目 ID 已存在：' : 'If Collection or Question ID Exists:'}
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'IMPORT_NEW', label: lang === 'zh' ? '导入为新题库' : 'Import as New' },
                { id: 'OVERWRITE', label: lang === 'zh' ? '覆盖现有题库' : 'Overwrite Existing' },
                { id: 'SKIP', label: lang === 'zh' ? '跳过重复项' : 'Skip Duplicates' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setConflictStrategy(opt.id as any)}
                  className={`py-2 px-3 rounded-lg font-semibold border transition-all ${
                    conflictStrategy === opt.id
                      ? 'bg-[#5A6D5B] text-white border-[#5A6D5B] shadow-sm'
                      : 'bg-white dark:bg-[#242824] border-[#E8E2D2] dark:border-[#353B35] text-[#2D2A26] dark:text-[#EAE7DF]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setReport(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7C776B] hover:bg-[#F5F2EA] dark:hover:bg-[#2D322D]"
            >
              {t('cancel')}
            </button>
            <button
              disabled={!report.isValid || report.extractedQuestions.length === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2.5 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-semibold text-xs transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {lang === 'zh' ? '确认并保存至本地数据库' : 'Confirm & Save to Local Database'}
            </button>
          </div>
        </div>
      )}

      {/* AI Prompt Template Section & Starter Template Downloader (Admin Only) */}
      {isAdmin && (
        <>
          {/* AI Prompt Template Section */}
          <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                    {t('aiHelper')}
                  </h3>
                  <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
                    {t('aiHelperDesc')}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyPrompt}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                  copiedPrompt
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#5A6D5B] hover:bg-[#485749] text-white shadow-sm'
                }`}
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t('copiedToClipboard')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{t('copyPrompt')}</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 border-b border-[#E8E2D2] dark:border-[#353B35] pb-3 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#7C776B] dark:text-[#A09886] mr-1 shrink-0">
                  {lang === 'zh' ? '语言:' : lang === 'ms' ? 'Bahasa:' : 'Language:'}
                </span>
                {[
                  { id: 'bm', label: 'BM' },
                  { id: 'eng', label: 'Eng' },
                  { id: 'zh', label: 'Zh' },
                ].map((item) => {
                  const isActive = selectedTargetLang === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedTargetLang(item.id as 'bm' | 'eng' | 'zh')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        isActive
                          ? 'bg-[#5A6D5B] text-white shadow-sm'
                          : 'bg-[#F5F2EA] dark:bg-[#2D322D] text-[#6B6559] dark:text-[#A09886] hover:bg-[#EAE5D8] dark:hover:bg-[#353B35]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 sm:ml-auto">
                <span className="text-xs font-semibold text-[#7C776B] dark:text-[#A09886] mr-1 shrink-0">
                  {lang === 'zh' ? '格式:' : lang === 'ms' ? 'Format:' : 'Format:'}
                </span>
                {[
                  { id: 'json', label: 'JSON' },
                  { id: 'csv', label: 'CSV' },
                ].map((item) => {
                  const isActive = promptFormat === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setPromptFormat(item.id as 'json' | 'csv')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        isActive
                          ? 'bg-[#5A6D5B] text-white shadow-sm'
                          : 'bg-[#F5F2EA] dark:bg-[#2D322D] text-[#6B6559] dark:text-[#A09886] hover:bg-[#EAE5D8] dark:hover:bg-[#353B35]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 bg-[#F5F2EA] dark:bg-[#1D211D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[11px] font-mono text-[#2D2A26] dark:text-[#EAE7DF] overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed">
                {aiPromptText}
              </pre>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#5A6D5B] dark:text-[#A3B5A4] bg-[#5A6D5B]/10 p-2.5 rounded-xl font-medium">
              <Paperclip className="w-4 h-4 shrink-0" />
              <span>
                <strong>{lang === 'zh' ? '使用说明：' : 'Instruction:'}</strong>{' '}
                {lang === 'zh'
                  ? `复制上方提示词，附带您的学习资料或 PDF 文件发送给 ChatGPT、Gemini 或 Claude 即可生成标准 ${promptFormat.toUpperCase()} 题库。`
                  : `Copy the prompt above, attach your study files/PDFs, and paste into ChatGPT or Gemini to receive a ready-to-import ${promptFormat.toUpperCase()} package.`}
              </span>
            </div>
          </div>

          {/* Starter Template Downloader */}
          <div className="p-5 bg-[#F5F2EA] dark:bg-[#2D322D] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] space-y-3">
            <div>
              <h4 className="text-xs font-bold text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                {t('needTemplate')}
              </h4>
              <p className="text-[11px] text-[#7C776B] dark:text-[#A09886]">
                {lang === 'zh' ? '下载标准预置格式的 JSON、CSV 或 ZIP 模版文件进行编辑与导入' : 'Download standard pre-formatted JSON, CSV, or ZIP question templates for editing and importing'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={downloadSampleJSONTemplate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#242824] text-[#2D2A26] dark:text-[#EAE7DF] border border-[#E8E2D2] dark:border-[#353B35] hover:bg-[#EAE5D8] text-xs font-semibold shadow-sm transition-colors"
              >
                <FileJson className="w-3.5 h-3.5 text-[#5A6D5B]" />
                <span>JSON</span>
              </button>
              <button
                onClick={downloadSampleCSVTemplate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#242824] text-[#2D2A26] dark:text-[#EAE7DF] border border-[#E8E2D2] dark:border-[#353B35] hover:bg-[#EAE5D8] text-xs font-semibold shadow-sm transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                <span>CSV</span>
              </button>
              <button
                onClick={downloadSampleZIPTemplate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#242824] text-[#2D2A26] dark:text-[#EAE7DF] border border-[#E8E2D2] dark:border-[#353B35] hover:bg-[#EAE5D8] text-xs font-semibold shadow-sm transition-colors"
              >
                <FileArchive className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>ZIP</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Centered Import Success Modal */}
      {successModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 relative animate-scale-up">
            <button
              onClick={() => setSuccessModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-[#7C776B] hover:text-[#2D2A26] dark:hover:text-white hover:bg-[#F5F2EA] dark:hover:bg-[#2D322D] transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/70 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-extrabold text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                {lang === 'zh' ? '导入成功！' : lang === 'ms' ? 'Import Berjaya!' : 'Import Successful!'}
              </h3>
              <div className="p-4 rounded-2xl bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2]/80 dark:border-[#353B35]/80 text-sm font-semibold text-[#2D2A26] dark:text-[#EAE7DF] leading-relaxed">
                {lang === 'zh'
                  ? `🎉 成功！添加了 ${successModal.count} 道题目到 "${successModal.bookName}"！`
                  : lang === 'ms'
                  ? `🎉 Berjaya! Menambah ${successModal.count} soalan ke "${successModal.bookName}"!`
                  : `🎉 Success! Added ${successModal.count} questions to "${successModal.bookName}"!`}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSuccessModal(null);
                  onNavigateTab('library');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>{lang === 'zh' ? '📚 查看我的书本' : lang === 'ms' ? '📚 Lihat Buku Saya' : '📚 View My Books'}</span>
              </button>

              <button
                onClick={() => setSuccessModal(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] bg-white dark:bg-[#1D211D] text-[#7C776B] dark:text-[#A09886] hover:bg-[#F5F2EA] dark:hover:bg-[#2D322D] font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                {lang === 'zh' ? '关闭' : lang === 'ms' ? 'Tutup' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
