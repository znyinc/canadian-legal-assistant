const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

function waitForPort(port, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function tryOnce() {
      const socket = net.createConnection({ port }, () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(tryOnce, 500);
        }
      });
    }
    tryOnce();
  });
}

function startService(name, cwd, envOverrides = {}) {
  // Use shell to properly resolve npm on Windows
  const isWindows = process.platform === 'win32';
  const command = 'npm';
  const args = ['run', 'dev'];
  
  const child = spawn(command, args, {
    cwd,
    stdio: 'pipe',
    shell: true,
    windowsHide: false,
    env: { ...process.env, ...envOverrides },
  });

  if (child.stdout) child.stdout.on('data', (d) => process.stdout.write(`[${name}] ${d}`));
  if (child.stderr) child.stderr.on('data', (d) => process.stderr.write(`[${name}] ${d}`));

  child.on('exit', (code) => {
    if (code !== 0) console.error(`[${name}] process exited with code ${code}`);
  });

  return child;
}

(async () => {
  const root = path.resolve(__dirname, '..');
  const backendDir = path.join(root, 'backend');
  const frontendDir = path.join(root, 'frontend');

  console.log('[start-e2e] Starting backend and frontend...');

  // Helper to run a one-off command and wait for completion
  function runOnce(name, cwd, cmd, args) {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { cwd, stdio: 'pipe', shell: true, windowsHide: false });
      if (child.stdout) child.stdout.on('data', (d) => process.stdout.write(`[${name}] ${d}`));
      if (child.stderr) child.stderr.on('data', (d) => process.stderr.write(`[${name}] ${d}`));
      child.on('error', (err) => reject(err));
      child.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`${name} process '${cmd} ${args.join(' ')}' exited with code ${code}`));
        } else {
          resolve(true);
        }
      });
    });
  }

  // Ensure dependencies are installed (especially in CI) and DB is ready
  try {
    const backendNodeModules = path.join(backendDir, 'node_modules');
    const frontendNodeModules = path.join(frontendDir, 'node_modules');

    if (process.env.CI || !fs.existsSync(backendNodeModules)) {
      console.log('[start-e2e] Installing backend dependencies (npm ci)...');
      await runOnce('backend', backendDir, 'npm', ['ci']);
    }
    if (process.env.CI || !fs.existsSync(frontendNodeModules)) {
      console.log('[start-e2e] Installing frontend dependencies (npm ci)...');
      await runOnce('frontend', frontendDir, 'npm', ['ci']);
    }

    console.log('[start-e2e] Preparing Prisma database (db:push)...');
    await runOnce('backend', backendDir, 'npm', ['run', 'db:push']);
  } catch (prepErr) {
    console.error('[start-e2e] Preflight failed:', prepErr.message);
    process.exit(1);
  }

  // Force backend to bind to the expected port regardless of ambient env
  const backend = startService('backend', backendDir, { PORT: '3001' });
  const frontend = startService('frontend', frontendDir);

  try {
    await waitForPort(3001);
    console.log('[start-e2e] Backend ready on port 3001');
  } catch (e) {
    console.error('[start-e2e] Backend failed to start:', e.message);
    backend.kill();
    frontend.kill();
    process.exit(1);
  }

  try {
    await waitForPort(5173);
    console.log('[start-e2e] Frontend ready on port 5173');
  } catch (e) {
    console.error('[start-e2e] Frontend failed to start:', e.message);
    backend.kill();
    frontend.kill();
    process.exit(1);
  }

  console.log('[start-e2e] Both services started successfully');

  const shutdown = () => {
    console.log('[start-e2e] Shutting down...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
