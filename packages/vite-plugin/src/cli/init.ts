import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, basename, dirname, join } from 'node:path';

function extractComponentName(filePath: string): string {
  const base = basename(filePath).replace(/\.\w+$/, '');
  return base.replace(/Full$/, '');
}

function extractPropsInterface(source: string): string | null {
  const match = source.match(/(?:interface|type)\s+(\w*Props\w*)\s*(?:=\s*)?{[^}]*}/);
  return match ? match[0] : null;
}

function createLiteScaffold(componentName: string, propsInterface: string | null): string {
  const propsType = propsInterface
    ? (propsInterface.match(/(?:interface|type)\s+(\w+)/)?.[1] ?? 'Props')
    : 'Props';

  const lines = [
    propsInterface ?? `interface ${propsType} {\n  // TODO: Add props\n}`,
    '',
    `// TODO: Implement lightweight version of ${componentName}`,
    `export default function ${componentName}Lite(props: ${propsType}) {`,
    `  return (`,
    `    <div>`,
    `      {/* TODO: Lightweight implementation */}`,
    `      <p>${componentName} (lite version)</p>`,
    `    </div>`,
    `  );`,
    `}`,
  ];

  return lines.join('\n');
}

function createAdaptiveWrapper(_componentName: string, highPath: string, litePath: string): string {
  return [
    `import { adaptive } from '@adaptive/react';`,
    '',
    `export default adaptive({`,
    `  high: () => import('${highPath}'),`,
    `  low: () => import('${litePath}'),`,
    `});`,
  ].join('\n');
}

export async function runInit(targetPath: string | undefined, flags: Record<string, string>) {
  if (flags.top) {
    process.stdout.write(
      `Batch scaffold --top=${flags.top} requires a full project analysis.\n` +
        `Run \`npx adaptive analyze\` first to identify high-impact components.\n`,
    );
    return;
  }

  if (!targetPath) {
    process.stderr.write('Usage: adaptive init <component-path>\n');
    process.exitCode = 1;
    return;
  }

  const fullPath = resolve(targetPath);
  if (!existsSync(fullPath)) {
    process.stderr.write(`File not found: ${fullPath}\n`);
    process.exitCode = 1;
    return;
  }

  const source = readFileSync(fullPath, 'utf-8');
  const dir = dirname(fullPath);
  const name = extractComponentName(fullPath);
  const ext = fullPath.match(/\.\w+$/)?.[0] ?? '.tsx';

  const propsInterface = extractPropsInterface(source);
  const liteContent = createLiteScaffold(name, propsInterface);
  const litePath = join(dir, `${name}Lite${ext}`);
  const adaptivePath = join(dir, `${name}.adaptive${ext}`);

  const highRelative = `./${basename(fullPath).replace(/\.\w+$/, '')}`;
  const liteRelative = `./${name}Lite`;
  const wrapperContent = createAdaptiveWrapper(name, highRelative, liteRelative);

  writeFileSync(litePath, liteContent, 'utf-8');
  writeFileSync(adaptivePath, wrapperContent, 'utf-8');

  process.stdout.write(
    `\nCreated:\n  ${litePath}\n  ${adaptivePath}\n\nNext: implement the lite variant in ${name}Lite${ext}\n`,
  );
}
