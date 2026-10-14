import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const svg = readFileSync('/Users/arundutta/projects/smart-clearance/design3/system/img/icon.svg', 'utf8');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 512, height: 512 } });
await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg', '<svg width="512" height="512"')}</body></html>`);
await p.screenshot({ path: 'build/mark.png', omitBackground: true });
await b.close();
