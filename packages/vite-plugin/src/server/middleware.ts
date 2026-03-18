import type { ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import type { BoundaryAnalysis } from '../types.js';
import type { Opportunity } from '../analysis/opportunities.js';
import { generateDashboardHtml } from './dashboard.js';

interface AnalysisProvider {
  getAnalyses(): BoundaryAnalysis[];
  getOpportunities(): Opportunity[];
}

type NextFn = () => void;

export function createDevMiddleware(
  provider: AnalysisProvider,
  server: ViteDevServer,
): (req: IncomingMessage, res: ServerResponse, next: NextFn) => void {
  return (req, res, next) => {
    const url = req.url ?? '';

    if (url === '/__adaptive' || url === '/__adaptive/') {
      return serveDashboard(provider, res);
    }

    if (url === '/__adaptive/api/analysis') {
      return serveAnalysisJson(provider, res);
    }

    if (url === '/__adaptive/api/simulate' && req.method === 'POST') {
      return handleSimulate(req, res, server);
    }

    next();
  };
}

function serveDashboard(provider: AnalysisProvider, res: ServerResponse): void {
  const html = generateDashboardHtml(provider.getAnalyses(), provider.getOpportunities());
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
}

function serveAnalysisJson(provider: AnalysisProvider, res: ServerResponse): void {
  const data = {
    boundaries: provider.getAnalyses(),
    opportunities: provider.getOpportunities(),
  };
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function handleSimulate(req: IncomingMessage, res: ServerResponse, server: ViteDevServer): void {
  let body = '';
  req.on('data', (chunk: Buffer) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const { tier } = JSON.parse(body) as { tier: string | null };
      server.ws.send({ type: 'custom', event: 'adaptive:force-tier', data: { tier } });
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, tier }));
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });
}
