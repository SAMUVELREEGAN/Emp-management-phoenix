/**
 * Production release APK build using mobile/.env.production (Render API URL).
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';
const mobileRoot = path.join(__dirname, '..');
const androidDir = path.join(mobileRoot, 'android');
const gradlew = isWindows ? 'gradlew.bat' : './gradlew';
const envFile = '.env.production';
const envFilePath = path.join(mobileRoot, envFile);

function readVersionName() {
  const gradlePath = path.join(androidDir, 'app', 'build.gradle');
  const gradle = fs.readFileSync(gradlePath, 'utf8');
  const match = gradle.match(/versionName\s+"([^"]+)"/);
  return match?.[1] ?? 'release';
}

if (!fs.existsSync(envFilePath)) {
  console.error(`Missing ${envFile}. Create it with API_BASE_URL and GOOGLE_MAPS_API_KEY.`);
  process.exit(1);
}

const env = {
  ...process.env,
  ENVFILE: envFile,
};

if (isWindows) {
  env.GRADLE_USER_HOME = 'C:\\gradle';
}

console.log('Building production release APK...');
console.log('Using env file:', envFile);

const result = spawnSync(gradlew, ['assembleRelease'], {
  stdio: 'inherit',
  env,
  cwd: androidDir,
  shell: isWindows,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const apkPath = path.join(
  androidDir,
  'app',
  'build',
  'outputs',
  'apk',
  'release',
  'app-release.apk',
);

if (!fs.existsSync(apkPath)) {
  console.error('Build finished but APK was not found at:', apkPath);
  process.exit(1);
}

const versionName = readVersionName();
const releasesDir = path.join(mobileRoot, 'releases');
const releaseApkName = `EmployeeManagement-v${versionName}-release.apk`;
const releaseApkPath = path.join(releasesDir, releaseApkName);

fs.mkdirSync(releasesDir, { recursive: true });
fs.copyFileSync(apkPath, releaseApkPath);

const stats = fs.statSync(releaseApkPath);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(1);

console.log('\nRelease APK ready:');
console.log(releaseApkPath);
console.log(`Size: ${sizeMb} MB`);
console.log('\nSend this file to your manager. Production API is baked in from .env.production.');

process.exit(0);
