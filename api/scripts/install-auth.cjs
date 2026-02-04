/**
 * Postinstall script to install supabase_auth_js from git subdirectory
 * npm doesn't support git dependencies from subdirectories, so we handle it manually
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_URL = 'https://github.com/me2801/supabase_auth.git';
const SUBDIR = 'src/supabase_auth_js';
const TEMP_DIR = path.join(__dirname, '..', '.tmp-auth-clone');
const TARGET_DIR = path.join(__dirname, '..', 'node_modules', 'supabase-auth-js');

// Skip if already installed
if (fs.existsSync(path.join(TARGET_DIR, 'package.json'))) {
  console.log('supabase_auth_js already installed, skipping...');
  process.exit(0);
}

console.log('Installing supabase_auth_js from git subdirectory...');

try {
  // Clean up any existing temp directory
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  // Clone the repo (sparse checkout for efficiency)
  console.log('Cloning repository...');
  execSync(`git clone --depth 1 --filter=blob:none --sparse "${REPO_URL}" "${TEMP_DIR}"`, {
    stdio: 'inherit'
  });

  // Sparse checkout the subdirectory
  execSync(`git -C "${TEMP_DIR}" sparse-checkout set "${SUBDIR}"`, {
    stdio: 'inherit'
  });

  const sourceDir = path.join(TEMP_DIR, SUBDIR);

  // Ensure node_modules exists
  const nodeModulesDir = path.join(__dirname, '..', 'node_modules');
  if (!fs.existsSync(nodeModulesDir)) {
    fs.mkdirSync(nodeModulesDir, { recursive: true });
  }

  // Copy to node_modules
  console.log('Copying to node_modules...');
  if (fs.existsSync(TARGET_DIR)) {
    fs.rmSync(TARGET_DIR, { recursive: true, force: true });
  }
  fs.cpSync(sourceDir, TARGET_DIR, { recursive: true });

  // Install dependencies of the auth package
  console.log('Installing supabase_auth_js dependencies...');
  execSync('npm install --omit=dev', {
    cwd: TARGET_DIR,
    stdio: 'inherit'
  });

  // Build if needed
  if (fs.existsSync(path.join(TARGET_DIR, 'tsconfig.json'))) {
    console.log('Building supabase_auth_js...');
    execSync('npm run build', {
      cwd: TARGET_DIR,
      stdio: 'inherit'
    });
  }

  // Fix exports in package.json to support direct subpath imports
  const pkgJsonPath = path.join(TARGET_DIR, 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  pkgJson.exports = {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./api": {
      "import": "./dist/api/index.js",
      "require": "./dist/api/index.js",
      "types": "./dist/api/index.d.ts"
    },
    "./dist/*": "./dist/*"
  };
  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
  console.log('Fixed package.json exports');

  // Clean up temp directory
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  console.log('supabase_auth_js installed successfully!');
} catch (error) {
  console.error('Failed to install supabase_auth_js:', error.message);
  console.error('\nManual installation:');
  console.error('1. git clone https://github.com/me2801/supabase_auth.git .tmp-auth');
  console.error('2. cp -r .tmp-auth/src/supabase_auth_js node_modules/supabase_auth_js');
  console.error('3. cd node_modules/supabase_auth_js && npm install && npm run build');
  process.exit(1);
}
