import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const mobileDir = path.join(rootDir, 'frontend');
const webDir = path.join(rootDir, 'frontend-desktop');

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

const requireMobile = createRequire(path.join(mobileDir, 'package.json'));
const requireWeb = createRequire(path.join(webDir, 'package.json'));

const nextMobile = requireMobile('next');
const nextWeb = requireWeb('next');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

// Ensure the API app does not start its own listener.
process.env.SINGLE_SERVICE = 'true';

let apiApp;
try {
  const rootEntry = path.join(rootDir, 'api', 'dist', 'index.js');
  const srcEntry = path.join(rootDir, 'api', 'dist', 'src', 'index.js');
  const apiEntryPath = fs.existsSync(rootEntry) ? rootEntry : srcEntry;

  if (!fs.existsSync(apiEntryPath)) {
    throw new Error('API build not found');
  }

  console.log(`==> Using API entry ${apiEntryPath}`);
  const apiModule = await import(pathToFileURL(apiEntryPath).href);
  apiApp = apiModule.default ?? apiModule;
} catch (err) {
  console.error('Failed to load API build. Run `npm run build` in api first.');
  throw err;
}

const mobileApp = nextMobile({ dev, dir: mobileDir });
const webApp = nextWeb({ dev, dir: webDir });

await Promise.all([mobileApp.prepare(), webApp.prepare()]);

const handleMobile = mobileApp.getRequestHandler();
const handleWeb = webApp.getRequestHandler();

const forward = (handler) => (req, res) => {
  req.url = req.originalUrl;
  return handler(req, res);
};

apiApp.get('/', (_req, res) => res.redirect('/mobile'));
apiApp.all('/mobile', forward(handleMobile));
apiApp.all('/mobile/:path*', forward(handleMobile));
apiApp.all('/web', forward(handleWeb));
apiApp.all('/web/:path*', forward(handleWeb));

apiApp.listen(port, () => {
  console.log(`Single service running on http://localhost:${port}`);
});
