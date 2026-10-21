import { performance } from 'node:perf_hooks';
import { isSupportedErpUrl } from '../src/shared/url-validator.js';
import { validateMessage } from '../src/shared/messages.js';
import { sanitizePreferences } from '../src/shared/preferences.js';
import '../src/content/config.js';
import '../src/content/page-assistance.js';
import { makeDocument } from '../tests/helpers.js';

function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const at = (p) => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)];
  return { samples: sorted.length, medianMs: Number(at(.5).toFixed(4)), p95Ms: Number(at(.95).toFixed(4)), maxMs: Number(sorted.at(-1).toFixed(4)) };
}
function measure(operation, n = 500) {
  const samples = [];
  for (let i = 0; i < n; i++) {
    const start = performance.now(); operation(); samples.push(performance.now() - start);
  }
  return summarize(samples);
}
const { document } = makeDocument();
const report = {
  environment: { node: process.version, platform: process.platform, arch: process.arch },
  note: 'Synthetic in-process microbenchmark only; not a Chrome popup or end-to-end latency measurement.',
  metrics: {
    urlValidation: measure(() => isSupportedErpUrl('https://newerp.kluniversity.in/login')),
    messageValidation: measure(() => validateMessage({ type: 'UPDATE_VISUAL_PREFS', zoom: 2.5, filter: 'high-contrast' })),
    preferencesSanitization: measure(() => sanitizePreferences({ zoom: 3, filter: 'grayscale', highContrastUi: true })),
    syntheticDomInspection: measure(() => globalThis.KluErpPageAssistance.inspectPage(document))
  }
};
console.log(JSON.stringify(report, null, 2));
const p95 = Math.max(...Object.values(report.metrics).map((v) => v.p95Ms));
if (!Number.isFinite(p95) || p95 >= 500) {
  console.error('PERFORMANCE TARGET NOT MET: one or more synthetic local operations have p95 >= 500 ms.');
  process.exit(1);
}
