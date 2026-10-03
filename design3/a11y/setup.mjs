// Start every run with an empty results folder, so the summary only reports this run.
import { rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
export default async function () {
  const dir = join(dirname(fileURLToPath(import.meta.url)), 'results');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}
