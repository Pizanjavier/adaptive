const DEVTOOLS_IMPORT_RE = /import\(\s*['"]@adaptive\/devtools['"]\s*\)/g;

const NOOP_MODULE = 'Promise.resolve({init(){},destroy(){}})';

export function stripDevtoolsImport(code: string, id: string): { code: string; map: null } | null {
  if (id.includes('node_modules')) return null;
  if (!code.includes('@adaptive/devtools')) return null;

  const replaced = code.replace(DEVTOOLS_IMPORT_RE, NOOP_MODULE);
  if (replaced === code) return null;

  return { code: replaced, map: null };
}
