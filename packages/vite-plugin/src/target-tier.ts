import type { ResolvedConfig } from './types.js';

const ADAPTIVE_CALL_RE = /adaptive\s*\(\s*\{/g;

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

function extractImportPath(text: string, prop: string): string | undefined {
  const re = new RegExp(`${prop}\\s*:.*?import\\s*\\(\\s*['"]([^'"]+)['"]\\s*\\)`);
  const match = re.exec(text);
  return match?.[1];
}

export function transformForTargetTier(
  source: string,
  _id: string,
  config: ResolvedConfig,
): string | null {
  if (!config.targetTier) return null;
  if (!source.includes('adaptive(') && !source.includes('adaptive (')) {
    return null;
  }

  const tier = config.targetTier;
  let result = source;
  let offset = 0;
  const re = new RegExp(ADAPTIVE_CALL_RE.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = re.exec(source)) !== null) {
    const braceStart = match.index + match[0].length - 1;
    const braceEnd = findMatchingBrace(source, braceStart);
    if (braceEnd === -1) continue;

    const block = source.slice(braceStart, braceEnd + 1);
    const callStart = match.index;
    const callEnd = braceEnd + 2;

    let importPath: string | undefined;

    if (tier === 'high') {
      importPath = extractImportPath(block, 'high') ?? extractImportPath(block, 'component');
    } else {
      importPath = extractImportPath(block, 'low') ?? extractImportPath(block, 'lowFallback');
    }

    if (!importPath) continue;

    const varName = `__adaptive_static_${callStart}`;
    const replacement = `(() => { const ${varName} = import('${importPath}'); return ${varName}; })()`;

    const adjustedStart = callStart + offset;
    const adjustedEnd = callEnd + offset;
    result = result.slice(0, adjustedStart) + replacement + result.slice(adjustedEnd);
    offset += replacement.length - (callEnd - callStart);
  }

  return result !== source ? result : null;
}
