/**
 * Production release APK build using mobile/.env.production (Render API URL).
 */
const { spawnSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const mobileRoot = path.join(__dirname, '..');
const androidDir = path.join(mobileRoot, 'android');
const gradlew = isWindows ? 'gradlew.bat' : './gradlew';

const env = {
  ...process.env,
  ENVFILE: '.env.production',
};

if (isWindows) {
  env.GRADLE_USER_HOME = 'C:\\gradle';
}

console.log('Building production release APK...');
console.log('Using env file:', env.ENVFILE);

const result = spawnSync(gradlew, ['assembleRelease'], {
  stdio: 'inherit',
  env,
  cwd: androidDir,
  shell: isWindows,
});

if (result.status === 0) {
  const apkPath = path.join(
    androidDir,
    'app',
    'build',
    'outputs',
    'apk',
    'release',
    'app-release.apk',
  );
  console.log('\nRelease APK ready:');
  console.log(apkPath);
}

process.exit(result.status ?? 1);
