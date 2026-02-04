import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\\n/g, '\n');
    process.env[key] = value;
  }
  return true;
}

const envFile = process.env.ENV_FILE
  ? (path.isAbsolute(process.env.ENV_FILE)
      ? process.env.ENV_FILE
      : path.join(__dirname, process.env.ENV_FILE))
  : path.join(__dirname, '.env');

const envLoaded = loadEnvFile(envFile);
if (envLoaded) {
  console.log(`==> Loaded env from ${envFile}`);
}

process.env.SINGLE_SERVICE = 'true';
const port = process.env.PORT || '3000';
if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  process.env.NEXT_PUBLIC_API_BASE_URL = `http://localhost:${port}`;
}

const npmCmd = 'npm';

function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      env: process.env,
      shell: true,
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} failed with code ${code}`));
    });
  });
}

async function main() {
  console.log('==> Building API');
  await run(npmCmd, ['ci'], path.join(root, 'api'));
  await run(npmCmd, ['run', 'build'], path.join(root, 'api'));

  console.log('==> Building mobile app');
  await run(npmCmd, ['ci'], path.join(root, 'frontend'));
  await run(npmCmd, ['run', 'build'], path.join(root, 'frontend'));

  console.log('==> Building web app');
  await run(npmCmd, ['ci'], path.join(root, 'frontend-desktop'));
  await run(npmCmd, ['run', 'build'], path.join(root, 'frontend-desktop'));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
