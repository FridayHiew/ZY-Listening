import JSZip from 'jszip';
import { KnowledgeCollection } from '../types';

/**
 * Trigger file download in browser
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format collection according to standard JSON schema
 */
function formatCollectionForExport(collection: KnowledgeCollection) {
  return {
    collectionName: collection.name,
    version: collection.version || 1,
    description: collection.description || 'Expert professional assessment generated from uploaded document.',
    group: collection.group || 'General',
    language: collection.language || 'en',
    difficulty: collection.difficulty || 'Year 1',
    tags: collection.tags || [],
    questions: collection.questions.map((q) => {
      const idx = q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0;
      const optionLetters = ['A', 'B', 'C', 'D'];
      return {
        id: q.id,
        questionText: q.questionText,
        statements: q.statements || {},
        optionA: q.options[0] || '',
        optionB: q.options[1] || '',
        optionC: q.options[2] || '',
        optionD: q.options[3] || '',
        correctAnswer: optionLetters[idx],
        explanation: q.explanation || '',
        sourceReference: q.sourceReference || '',
        imageFile: q.image || '',
      };
    }),
  };
}

/**
 * Export collection as JSON
 */
export function exportCollectionAsJSON(collection: KnowledgeCollection) {
  const exportData = formatCollectionForExport(collection);
  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const filename = `${collection.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_package.json`;
  downloadBlob(blob, filename);
}

/**
 * Export collection as ZIP package
 */
export async function exportCollectionAsZIP(collection: KnowledgeCollection) {
  const zip = new JSZip();

  const exportData = formatCollectionForExport(collection);
  // Create questions.json
  zip.file('questions.json', JSON.stringify(exportData, null, 2));

  // Add images if any
  const imgFolder = zip.folder('images');
  if (imgFolder) {
    for (let i = 0; i < collection.questions.length; i++) {
      const q = collection.questions[i];
      if (q.image && q.image.startsWith('data:image/')) {
        const parts = q.image.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
        const ext = mime.split('/')[1] || 'png';
        const base64Data = parts[1];
        imgFolder.file(`q_${q.id}.${ext}`, base64Data, { base64: true });
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const filename = `${collection.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_package.zip`;
  downloadBlob(content, filename);
}

/**
 * Download sample JSON template matching system schema
 */
export function downloadSampleJSONTemplate() {
  const template = {
    collectionName: 'Kosa Kata Bahasa Melayu (KSSR Sample)',
    version: 1,
    description: 'Contoh templat ejaan dan kosa kata Bahasa Melayu Sekolah Rendah KSSR.',
    group: 'Malay',
    difficulty: 'Tahun 1',
    tags: [
      'kosa-kata',
      'ejaan',
      'primary'
    ],
    questions: [
      {
        id: 'ms-q001',
        category: 'Sekolah & Rumah',
        questionText: 'sekolah',
        statements: {},
        optionA: 'sekolah',
        optionB: 'sekola',
        optionC: 'sekolat',
        optionD: 'syekolah',
        correctAnswer: 'A',
        explanation: '学校（School / Sekolah）。Maksud: Tempat untuk belajar. 例句：Saya pergi ke sekolah setiap hari.（我每天去上学。）',
        sourceReference: 'Buku Teks BM Tahun 1, Unit 2',
        imageFile: '',
      }
    ],
  };

  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'sample_questions_template.json');
}

/**
 * Export collection as CSV
 */
export function exportCollectionAsCSV(collection: KnowledgeCollection) {
  const headers = [
    'ID',
    'Category',
    'QuestionText',
    'OptionA',
    'OptionB',
    'OptionC',
    'OptionD',
    'CorrectAnswer',
    'Explanation',
    'SourceReference',
    'ImageFile'
  ];

  const escapeCSVField = (val: string) => {
    if (val === undefined || val === null) return '';
    const str = val.toString();
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = collection.questions.map((q) => {
    const idx = q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0;
    const optionLetters = ['A', 'B', 'C', 'D'];
    return [
      q.id,
      q.category || 'General',
      q.questionText || '',
      q.options[0] || '',
      q.options[1] || '',
      q.options[2] || '',
      q.options[3] || '',
      optionLetters[idx],
      q.explanation || '',
      q.sourceReference || '',
      q.image || '',
    ];
  });

  const metaComments = [
    `# collectionName: ${collection.name}`,
    `# version: ${collection.version || 1}`,
    `# description: ${collection.description || ''}`,
    `# group: ${collection.group || 'General'}`,
    `# language: ${collection.language || 'en'}`,
    `# difficulty: ${collection.difficulty || 'Primary'}`,
    `# tags: ${(collection.tags || []).join(', ')}`
  ];

  const csvContent = [
    ...metaComments,
    headers.map(escapeCSVField).join(','),
    ...rows.map(row => row.map(escapeCSVField).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${collection.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_package.csv`;
  downloadBlob(blob, filename);
}

/**
 * Download sample CSV template matching system schema
 */
export function downloadSampleCSVTemplate() {
  const headers = [
    'ID',
    'Category',
    'QuestionText',
    'OptionA',
    'OptionB',
    'OptionC',
    'OptionD',
    'CorrectAnswer',
    'Explanation',
    'SourceReference',
    'ImageFile'
  ];
  const sampleRow = [
    'ms-q001',
    'Sekolah & Rumah',
    'sekolah',
    'sekolah',
    'sekola',
    'sekolat',
    'syekolah',
    'A',
    '学校（School / Sekolah）。Maksud: Tempat untuk belajar. 例句：Saya pergi ke sekolah setiap hari.（我每天去上学。）',
    'Buku Teks BM Tahun 1, Unit 2',
    ''
  ];

  const escapeCSVField = (val: string) => {
    if (val === undefined || val === null) return '';
    const str = val.toString();
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const metaComments = [
    `# collectionName: Kosa Kata Bahasa Melayu (KSSR Sample)`,
    `# version: 1`,
    `# description: Contoh templat ejaan dan kosa kata Bahasa Melayu Sekolah Rendah KSSR.`,
    `# group: Malay`,
    `# language: bm`,
    `# difficulty: Tahun 1`,
    `# tags: kosa-kata, ejaan, primary`
  ];

  const csvContent = [
    ...metaComments,
    headers.map(escapeCSVField).join(','),
    sampleRow.map(escapeCSVField).join(',')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, 'sample_questions_template.csv');
}

/**
 * Download sample ZIP template matching system schema
 */
export async function downloadSampleZIPTemplate() {
  const zip = new JSZip();

  const template = {
    collectionName: 'Primary School Vocabulary ZIP',
    version: 1,
    description: 'Sample ZIP package containing vocabulary JSON and images.',
    group: 'General',
    difficulty: 'Easy',
    tags: ['zip', 'sample'],
    questions: [
      {
        id: 'zip-q001',
        category: 'Nature',
        questionText: 'flower',
        statements: {},
        optionA: 'flowar',
        optionB: 'flower',
        optionC: 'flowre',
        optionD: 'flover',
        correctAnswer: 'B',
        explanation: '花朵（Flower）。例句：The flower smells sweet.（花朵闻起来很香。）',
        sourceReference: 'English Science Grade 1',
        imageFile: 'images/flower.png',
      }
    ],
  };

  zip.file('questions.json', JSON.stringify(template, null, 2));
  
  // Add a placeholder small red 1x1 png image
  const placeholderPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  zip.file('images/flower.png', placeholderPngBase64, { base64: true });

  const content = await zip.generateAsync({ type: 'blob' });
  downloadBlob(content, 'sample_questions_template.zip');
}
