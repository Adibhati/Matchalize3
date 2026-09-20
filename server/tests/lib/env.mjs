import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(__dirname, '../../..');
export const SERVER_DIR = path.join(REPO_ROOT, 'server');
export const CLIENT_DIR = path.join(REPO_ROOT, 'client');
export const QA_DIR = path.join(SERVER_DIR, 'tests', 'qa');
export const TESTS_DIR = path.join(SERVER_DIR, 'tests');
export const TEST_DB_NAME = 'matchalize_test';
export const QA_PORT = 5051;
export const QA_ORIGIN = `http://localhost:${QA_PORT}`;

export function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split('\n')) {
    let line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice('export '.length).trim();
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    out[key] = value.replace(/\\n/g, '\n');
  }
  return out;
}

export function loadServerEnv() {
  return parseEnvFile(path.join(SERVER_DIR, '.env'));
}

export function deriveTestUri(serverEnv) {
  const uri = serverEnv.MONGODB_URI;
  if (!uri) throw new Error('server/.env is missing MONGODB_URI');
  const lastSlash = uri.lastIndexOf('/');
  const qsIdx = uri.indexOf('?');
  const query = qsIdx >= 0 ? uri.slice(qsIdx) : '';
  const base = uri.slice(0, lastSlash + 1);
  return `${base}${TEST_DB_NAME}${query}`;
}

export function buildServerEnv(serverEnv) {
  const production = parseEnvFile(path.join(SERVER_DIR, '.env.test'));
  const jwts = serverEnv.JWT_SECRET || 'matchalize-qa-jwt-secret';
  return {
    ...serverEnv,
    ...production,
    NODE_ENV: 'test',
    PORT: String(QA_PORT),
    MONGODB_URI: deriveTestUri(serverEnv),
    JWT_SECRET: jwts,
    FRONTEND_URL: QA_ORIGIN,
  };
}