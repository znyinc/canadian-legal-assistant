const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

function waitForPort(port, timeoutMs = 30000) {
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

function runNpmDev(cwd) {
  const child = spawn('npm', ['run', 'dev'], { cwd, stdio: 'inherit', shell: true });
  child.on('exit', (code) => {
    // if one exits, let process exit; Playwright will kill us
    process.exit(code || 0);
  });
  return child;
}

(async () => {
  const root = process.cwd();
  const backendDir = path.join(root, 'backend');
  const frontendDir = path.join(root, 'frontend');

  const backend = runNpmDev(backendDir);
  await waitForPort(3010).catch((e) => {
    console.error('[start-e2e] Backend failed to start:', e.message);
    process.exit(1);
  });

  const frontend = runNpmDev(frontendDir);
  await waitForPort(5173).catch((e) => {
    console.error('[start-e2e] Frontend failed to start:', e.message);
    process.exit(1);
  });

  console.log('[start-e2e] Both backend and frontend started');

  const shutdown = () => {
    if (backend) backend.kill();
    if (frontend) frontend.kill();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
