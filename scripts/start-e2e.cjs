const { spawn } = require('child_process');
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

function startService(name, cwd) {
  // Use shell to properly resolve npm on Windows
  const isWindows = process.platform === 'win32';
  const command = 'npm';
  const args = ['run', 'dev'];
  
  const child = spawn(command, args, {
    cwd,
    stdio: 'pipe',
    shell: true,
    windowsHide: false,
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

  const backend = startService('backend', backendDir);
  const frontend = startService('frontend', frontendDir);

  try {
    await waitForPort(3010);
    console.log('[start-e2e] Backend ready on port 3010');
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
