#!/usr/bin/env node
import { runAnalyze } from './analyze.js';
import { runInit } from './init.js';
import { runSimulate } from './simulate.js';
import { runReport } from './report.js';
import { runValidate } from './validate.js';

const HELP = `
Usage: adaptive <command> [options]

Commands:
  analyze              Run bundle analysis without full build
  init <path>          Scaffold an adaptive boundary
  simulate <path>      What-if analysis without file changes
  report               Generate report from cached build data
  validate             Check boundary correctness

Options:
  --format=<fmt>       Report format: console | html | json
  --output=<path>      Output directory for reports
  --help               Show this help message
`;

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const command = args.find((a) => !a.startsWith('-'));
  const flags: Record<string, string> = {};

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx > 0) {
        flags[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
      } else {
        flags[arg.slice(2)] = 'true';
      }
    }
  }

  const positional = args.filter((a) => !a.startsWith('-') && a !== command);

  return { command, flags, positional };
}

async function main() {
  const { command, flags, positional } = parseArgs(process.argv);

  if (!command || flags.help) {
    process.stdout.write(HELP);
    return;
  }

  switch (command) {
    case 'analyze':
      await runAnalyze(flags);
      break;
    case 'init':
      await runInit(positional[0], flags);
      break;
    case 'simulate':
      await runSimulate(positional[0], flags);
      break;
    case 'report':
      await runReport(flags);
      break;
    case 'validate':
      await runValidate(flags);
      break;
    default:
      process.stderr.write(`Unknown command: ${command}\n`);
      process.stdout.write(HELP);
      process.exitCode = 1;
  }
}

main().catch((err) => {
  process.stderr.write(`Error: ${(err as Error).message}\n`);
  process.exitCode = 1;
});
