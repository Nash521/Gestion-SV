import { cp, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} a échoué (${code})`)));
  });
}

await run('npm', ['run', 'build']);
const standalone = join('.next', 'standalone');
await mkdir(join(standalone, '.next'), { recursive: true });
await cp(join('.next', 'static'), join(standalone, '.next', 'static'), { recursive: true, force: true });
await cp('public', join(standalone, 'public'), { recursive: true, force: true });
await run('npx', ['electron-builder', '--projectDir', 'desktop', '--win', 'nsis', '--x64']);
