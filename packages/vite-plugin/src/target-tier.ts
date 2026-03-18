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
  const re = new RegExp(`${prop}\\s*:\\s*\\(\\)\\s*=>\\s*import\\s*\\(\\s*['"]([^'"]+)['"]\\s*\\)`);
  return re.exec(text)?.[1];
}

function replaceAdaptiveCalls(
  source: string,
  tier: 'high' | 'low',
): { result: string; imports: Array<{ name: string; path: string }> } {
  const imports: Array<{ name: string; path: string }> = [];
  let result = source;
  let offset = 0;
  const re = new RegExp(ADAPTIVE_CALL_RE.source, 'g');
  let match: RegExpExecArray | null;
  let counter = 0;

  while ((match = re.exec(source)) !== null) {
    const braceStart = match.index + match[0].length - 1;
    const braceEnd = findMatchingBrace(source, braceStart);
    if (braceEnd === -1) continue;

    const block = source.slice(braceStart, braceEnd + 1);
    const callStart = match.index;

    let callEnd = braceEnd + 1;
    while (callEnd < source.length && source[callEnd] !== ')') callEnd++;
    callEnd++;

    let importPath: string | undefined;
    if (tier === 'high') {
      importPath = extractImportPath(block, 'high') ?? extractImportPath(block, 'component');
    } else {
      importPath = extractImportPath(block, 'low');
    }
    if (!importPath) continue;

    const importName = `__adaptive_static_${counter++}`;
    imports.push({ name: importName, path: importPath });

    const adjustedStart = callStart + offset;
    const adjustedEnd = callEnd + offset;
    result = result.slice(0, adjustedStart) + importName + result.slice(adjustedEnd);
    offset += importName.length - (callEnd - callStart);
  }

  return { result, imports };
}

function replaceInlineBlocks(source: string, tier: 'high' | 'low'): string {
  const keepTag = tier === 'high' ? 'High' : 'Low';
  const removeTag = tier === 'high' ? 'Low' : 'High';

  let result = source;

  result = result.replace(
    new RegExp(
      `<Adaptive\\.${removeTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/Adaptive\\.${removeTag}>`,
      'g',
    ),
    '{null}',
  );

  result = result.replace(
    new RegExp(`<Adaptive\\.${keepTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/Adaptive\\.${keepTag}>`, 'g'),
    '$1',
  );

  return result;
}

function cleanupAdaptiveImport(source: string): string {
  const adaptiveUsed = /\badaptive\s*\(/.test(source);
  const inlineUsed = /\bAdaptive\./.test(source);

  return source.replace(
    /import\s+\{([^}]*)\}\s+from\s+['"](@adaptive\/(?:react|vue|svelte))['"];?\n?/g,
    (_match, specifiers: string, pkg: string) => {
      const names = specifiers
        .split(',')
        .map((s) => s.trim())
        .filter((s) => {
          if (!s) return false;
          if (s === 'adaptive' && !adaptiveUsed) return false;
          if (s === 'Adaptive' && !inlineUsed) return false;
          return true;
        });
      if (names.length === 0) return '';
      return `import { ${names.join(', ')} } from '${pkg}';\n`;
    },
  );
}

export function transformForTargetTier(
  source: string,
  _id: string,
  config: ResolvedConfig,
): string | null {
  if (!config.targetTier) return null;

  const hasAdaptiveCall = source.includes('adaptive(') || source.includes('adaptive (');
  const hasInlineJsx = source.includes('Adaptive.High') || source.includes('Adaptive.Low');
  if (!hasAdaptiveCall && !hasInlineJsx) return null;

  const tier = config.targetTier;
  let result = source;
  let changed = false;
  let staticImports: Array<{ name: string; path: string }> = [];

  if (hasAdaptiveCall) {
    const callResult = replaceAdaptiveCalls(result, tier);
    if (callResult.imports.length > 0) {
      result = callResult.result;
      staticImports = callResult.imports;
      changed = true;
    }
  }

  if (hasInlineJsx) {
    const jsxResult = replaceInlineBlocks(result, tier);
    if (jsxResult !== result) {
      result = jsxResult;
      changed = true;
    }
  }

  if (!changed) return null;

  if (staticImports.length > 0) {
    const lines = staticImports
      .map(({ name, path }) => `import ${name} from '${path}';`)
      .join('\n');
    result = lines + '\n' + result;
  }

  result = cleanupAdaptiveImport(result);

  return result;
}
