import type { AdaptiveBoundary } from '../types.js';

const ADAPTIVE_CALL_RE = /adaptive\s*\(\s*\{/g;
const ADAPTIVE_JSX_RE = /Adaptive\.(High|Low)/g;
const IMPORT_RE = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/;

function extractImportPath(text: string): string | undefined {
  const match = IMPORT_RE.exec(text);
  return match?.[1];
}

function findMatchingBrace(source: string, startIndex: number): number {
  let depth = 0;
  for (let i = startIndex; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function getLineNumber(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source[i] === '\n') line++;
  }
  return line;
}

function deriveName(filePath: string, line: number): string {
  const fileName = filePath.split('/').pop() ?? 'unknown';
  const base = fileName.replace(/\.\w+$/, '');
  return `${base}:${line}`;
}

function extractPropertyImport(block: string, propName: string): string | undefined {
  const re = new RegExp(`${propName}\\s*:\\s*\\(?\\s*\\)?\\s*=>?`);
  const match = re.exec(block);
  if (!match) {
    const simpleRe = new RegExp(`${propName}\\s*:`);
    const simpleMatch = simpleRe.exec(block);
    if (!simpleMatch) return undefined;
    const afterProp = block.slice(simpleMatch.index + simpleMatch[0].length);
    return extractImportPath(afterProp.slice(0, 200));
  }
  const afterArrow = block.slice(match.index + match[0].length);
  return extractImportPath(afterArrow.slice(0, 200));
}

function scanAdaptiveCalls(source: string, filePath: string): AdaptiveBoundary[] {
  const boundaries: AdaptiveBoundary[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(ADAPTIVE_CALL_RE.source, 'g');

  while ((match = re.exec(source)) !== null) {
    const braceStart = match.index + match[0].length - 1;
    const braceEnd = findMatchingBrace(source, braceStart);
    if (braceEnd === -1) continue;

    const block = source.slice(braceStart, braceEnd + 1);
    const line = getLineNumber(source, match.index);

    const highImport = extractPropertyImport(block, 'high');
    const lowImport = extractPropertyImport(block, 'low');
    const mediumImport = extractPropertyImport(block, 'medium');
    const componentImport = extractPropertyImport(block, 'component');
    const lowFallbackImport = extractPropertyImport(block, 'lowFallback');

    if (!highImport && !componentImport) continue;

    boundaries.push({
      name: deriveName(filePath, line),
      filePath,
      line,
      highImport,
      lowImport,
      mediumImport,
      componentImport,
      lowFallbackImport,
    });
  }

  return boundaries;
}

function scanJsxPatterns(source: string, filePath: string): AdaptiveBoundary[] {
  const boundaries: AdaptiveBoundary[] = [];
  const re = new RegExp(ADAPTIVE_JSX_RE.source, 'g');
  let match: RegExpExecArray | null;
  const seen = new Set<number>();

  while ((match = re.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    if (seen.has(line)) continue;
    seen.add(line);

    const tier = match[1] as 'High' | 'Low';
    const afterTag = source.slice(match.index, match.index + 500);
    const importPath = extractImportPath(afterTag);

    if (!importPath) continue;

    const boundary: AdaptiveBoundary = {
      name: deriveName(filePath, line),
      filePath,
      line,
      highImport: tier === 'High' ? importPath : undefined,
      lowImport: tier === 'Low' ? importPath : undefined,
    };

    boundaries.push(boundary);
  }

  return boundaries;
}

export function scanSource(source: string, filePath: string): AdaptiveBoundary[] {
  const calls = scanAdaptiveCalls(source, filePath);
  const jsx = scanJsxPatterns(source, filePath);
  return [...calls, ...jsx];
}
