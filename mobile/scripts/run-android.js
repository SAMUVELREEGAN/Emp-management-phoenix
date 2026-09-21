/**
 * Ensures Gradle uses a short cache path on Windows to avoid MAX_PATH failures.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';

if (isWindows) {
  process.env.GRADLE_USER_HOME = 'C:\\gradle';
}

// Forward device localhost:5000 → PC localhost:5000 so the app can use http://localhost:5000/api
if (isWindows) {
  spawnSync('adb', ['reverse', 'tcp:5000', 'tcp:5000'], {
    stdio: 'inherit',
    env: process.env,
  });
}

const reactNativeCli = require.resolve('@react-native-community/cli/build/bin.js');
const result = spawnSync(process.execPath, [reactNativeCli, 'run-android'], {
  stdio: 'inherit',
  env: process.env,
  cwd: path.join(__dirname, '..'),
});

process.exit(result.status ?? 1);
