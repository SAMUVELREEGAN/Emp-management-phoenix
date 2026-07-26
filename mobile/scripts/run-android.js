/**
 * Ensures Gradle uses a short cache path on Windows to avoid MAX_PATH failures.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';

if (isWindows) {
  process.env.GRADLE_USER_HOME = 'C:\\gradle';
}

const reactNativeCli = require.resolve('@react-native-community/cli/build/bin.js');
const result = spawnSync(process.execPath, [reactNativeCli, 'run-android'], {
  stdio: 'inherit',
  env: process.env,
  cwd: path.join(__dirname, '..'),
});

process.exit(result.status ?? 1);
