import JSZip from 'jszip';
import { Question, ValidationReport } from '../types';

/**
 * Helper to parse CSV lines handling quoted values with commas
 */
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal.trim());
      if (currentRow.some((field) => field.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((field) => field.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

/**
 * Validate and format raw question objects according to VR-1, VR-2, VR-4
 */
export function validateAndFormatQuestions(
  rawQuestions: any[],
  imagesMap?: Map<string, string> // relative image path -> data URL
): ValidationReport {
  const errors: { row: number; field: string; message: string }[] = [];
  const warnings: string[] = [];
  const extractedQuestions: Question[] = [];
  const seenIds = new Set<string>();

  rawQuestions.forEach((raw, idx) => {
    const rowNum = idx + 1;

    // Normalize field names
    const id = (raw.id || raw.ID || `q_${Date.now()}_${idx}`).toString().trim();
    const category = (raw.category || raw.Category || 'General').toString().trim();
    const questionText = (
      raw.questionText ||
      raw.question ||
      raw.Question ||
      ''
    ).toString().trim();

    // Additional JSON metadata fields
    const difficulty = (raw.difficulty || 'Expert').toString().trim();
    const knowledgeLevel = (raw.knowledgeLevel || 'Analyze').toString().trim();
    const questionType = (raw.questionType || 'Analysis').toString().trim();
    const tags = Array.isArray(raw.tags) ? raw.tags.map((t: any) => t.toString().trim()) : [];
    const statements = typeof raw.statements === 'object' && raw.statements !== null ? raw.statements : undefined;
    const sourceReference = (raw.sourceReference || '').toString().trim();

    // Parse options
    let options: [string, string, string, string] | null = null;
    if (Array.isArray(raw.options) && raw.options.length === 4) {
      options = [
        raw.options[0].toString(),
        raw.options[1].toString(),
        raw.options[2].toString(),
        raw.options[3].toString(),
      ];
    } else if (
      raw.optionA !== undefined &&
      raw.optionB !== undefined &&
      raw.optionC !== undefined &&
      raw.optionD !== undefined
    ) {
      options = [
        raw.optionA.toString(),
        raw.optionB.toString(),
        raw.optionC.toString(),
        raw.optionD.toString(),
      ];
    }

    // Parse correct answer
    let correctIndex = -1;
    const rawCorrect = (
      raw.correctAnswer !== undefined ? raw.correctAnswer : raw.correctIndex
    )
      ?.toString()
      .trim()
      .toUpperCase();

    if (rawCorrect === 'A' || rawCorrect === '0') correctIndex = 0;
    else if (rawCorrect === 'B' || rawCorrect === '1') correctIndex = 1;
    else if (rawCorrect === 'C' || rawCorrect === '2') correctIndex = 2;
    else if (rawCorrect === 'D' || rawCorrect === '3') correctIndex = 3;

    const explanation = (raw.explanation || raw.Explanation || '').toString().trim();
    let image = (raw.image || raw.imageFile || raw.Image || '').toString().trim();

    // Check VR-1: Required fields
    if (!questionText) {
      errors.push({ row: rowNum, field: 'questionText', message: 'Question text is required' });
    }
    if (questionText.length > 2000) {
      errors.push({ row: rowNum, field: 'questionText', message: 'Question text exceeds 2000 character limit' });
    }

    // Check VR-2: Exactly 4 options and 1 correct answer
    if (!options || options.some((opt) => opt.trim().length === 0)) {
      errors.push({ row: rowNum, field: 'options', message: 'Question must have 4 non-empty options (A, B, C, D)' });
    } else if (options.some((opt) => opt.length > 500)) {
      errors.push({ row: rowNum, field: 'options', message: 'Option text exceeds 500 character limit' });
    }

    if (correctIndex < 0 || correctIndex > 3) {
      errors.push({ row: rowNum, field: 'correctAnswer', message: 'Correct answer must be specified as A, B, C, D or index 0-3' });
    }

    // Check VR-3: Duplicate ID check
    if (seenIds.has(id)) {
      warnings.push(`Row ${rowNum}: Duplicate question ID "${id}" detected. Auto-assigning unique ID.`);
    }
    const finalId = seenIds.has(id) ? `${id}_${Date.now()}_${idx}` : id;
    seenIds.add(finalId);

    // VR-4: Process image attachment from imagesMap or direct URL/dataURL
    if (image) {
      if (imagesMap && imagesMap.has(image)) {
        image = imagesMap.get(image)!;
      } else if (imagesMap && imagesMap.has(`images/${image}`)) {
        image = imagesMap.get(`images/${image}`)!;
      } else if (!image.startsWith('data:') && !image.startsWith('http')) {
        warnings.push(`Row ${rowNum}: Referenced image file "${image}" was not found in package. Question imported without image.`);
        image = '';
      }
    }

    if (options && correctIndex >= 0 && questionText) {
      extractedQuestions.push({
        id: finalId,
        category,
        questionText,
        options,
        correctIndex,
        explanation,
        image: image || undefined,
        difficulty,
        knowledgeLevel,
        questionType,
        tags,
        statements,
        sourceReference,
      });
    }
  });

  const validRows = extractedQuestions.length;
  const invalidRows = rawQuestions.length - validRows;

  return {
    isValid: validRows > 0,
    totalRows: rawQuestions.length,
    validRows,
    invalidRows,
    errors,
    warnings,
    extractedQuestions,
    collectionName: 'Imported Question Collection',
  };
}

/**
 * Parse JSON File content
 */
export async function parseJSONImport(fileText: string): Promise<ValidationReport> {
  let parsed: any;
  try {
    parsed = JSON.parse(fileText);
  } catch (e) {
    return {
      isValid: false,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: [{ row: 0, field: 'file', message: 'Invalid JSON file syntax' }],
      warnings: [],
      extractedQuestions: [],
      collectionName: '',
    };
  }

  const collectionName = parsed.collectionName || parsed.name || 'Imported Collection';
  const collectionDescription = parsed.description || '';
  const collectionDifficulty = parsed.difficulty || 'Master';
  const collectionGroup = parsed.group || parsed.groupName || 'General';
  const collectionTags = Array.isArray(parsed.tags) ? parsed.tags.map((t: any) => t.toString().trim()) : [];
  let rawQuestions: any[] = [];

  if (Array.isArray(parsed)) {
    rawQuestions = parsed;
  } else if (Array.isArray(parsed.questions)) {
    rawQuestions = parsed.questions;
  } else {
    return {
      isValid: false,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: [{ row: 0, field: 'questions', message: 'JSON file must contain an array of questions or a "questions" field' }],
      warnings: [],
      extractedQuestions: [],
      collectionName,
      collectionDescription,
      collectionDifficulty,
      collectionGroup,
      collectionTags,
    };
  }

  const report = validateAndFormatQuestions(rawQuestions);
  report.collectionName = collectionName;
  report.collectionDescription = collectionDescription;
  report.collectionDifficulty = collectionDifficulty;
  report.collectionGroup = collectionGroup;
  report.collectionTags = collectionTags;
  return report;
}

/**
 * Parse ZIP package containing questions.json + images/
 */
export async function parseZIPImport(fileBuffer: ArrayBuffer): Promise<ValidationReport> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(fileBuffer);
  } catch (e) {
    return {
      isValid: false,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: [{ row: 0, field: 'zip', message: 'Corrupted or unreadable ZIP package' }],
      warnings: [],
      extractedQuestions: [],
      collectionName: '',
    };
  }

  // Prevent Zip-Slip security attacks
  for (const filename of Object.keys(zip.files)) {
    if (filename.includes('..') || filename.startsWith('/')) {
      return {
        isValid: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        errors: [{ row: 0, field: 'zip', message: 'ZIP package contains invalid file paths (zip-slip attempt)' }],
        warnings: [],
        extractedQuestions: [],
        collectionName: '',
      };
    }
  }

  // 1. Extract image files into Data URLs
  const imagesMap = new Map<string, string>();
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;
    const lowerPath = relativePath.toLowerCase();
    if (imageExtensions.some((ext) => lowerPath.endsWith(ext))) {
      const blob = await zipEntry.async('blob');
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      imagesMap.set(relativePath, dataUrl);
      imagesMap.set(relativePath.replace(/^images\//, ''), dataUrl);
    }
  }

  // 2. Search for questions.json or manifest.json
  let questionsFileEntry = zip.file('questions.json') || zip.file('manifest.json');

  if (!questionsFileEntry) {
    // Search any json file in root
    const jsonFiles = Object.keys(zip.files).filter((f) => f.endsWith('.json'));
    if (jsonFiles.length > 0) {
      questionsFileEntry = zip.file(jsonFiles[0]);
    }
  }

  if (!questionsFileEntry) {
    return {
      isValid: false,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: [{ row: 0, field: 'zip', message: 'ZIP package missing questions.json file' }],
      warnings: [],
      extractedQuestions: [],
      collectionName: '',
    };
  }

  const fileText = await questionsFileEntry.async('text');

  let parsed: any;
  try {
    parsed = JSON.parse(fileText);
  } catch (e) {
    return {
      isValid: false,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: [{ row: 0, field: 'questions.json', message: 'Invalid JSON syntax inside ZIP package' }],
      warnings: [],
      extractedQuestions: [],
      collectionName: '',
    };
  }

  const collectionName = parsed.collectionName || parsed.name || 'ZIP Imported Collection';
  const collectionDescription = parsed.description || '';
  const collectionDifficulty = parsed.difficulty || 'Master';
  const collectionGroup = parsed.group || parsed.groupName || 'General';
  const collectionTags = Array.isArray(parsed.tags) ? parsed.tags.map((t: any) => t.toString().trim()) : [];
  const rawQuestions = Array.isArray(parsed) ? parsed : parsed.questions || [];
  const report = validateAndFormatQuestions(rawQuestions, imagesMap);
  report.collectionName = collectionName;
  report.collectionDescription = collectionDescription;
  report.collectionDifficulty = collectionDifficulty;
  report.collectionGroup = collectionGroup;
  report.collectionTags = collectionTags;
  return report;
}
