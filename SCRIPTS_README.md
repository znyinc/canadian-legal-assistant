# Development Server Scripts

Quick start/stop scripts for the Canadian Legal Assistant application.

## Overview

- **startup.ps1** - Starts backend (port 3001) and frontend (port 5173) dev servers
- **startup.bat** - Windows batch wrapper for startup.ps1 (easier from cmd.exe)
- **shutdown.ps1** - Stops both dev servers gracefully
- **shutdown.bat** - Windows batch wrapper for shutdown.ps1 (easier from cmd.exe)

## Usage

### PowerShell

From the project root directory:

```powershell
# Start servers
.\startup.ps1

# Start servers and kill any existing processes on those ports
.\startup.ps1 -Clean

# Stop servers
.\shutdown.ps1
```

### Command Prompt (cmd.exe)

From the project root directory:

```batch
REM Start servers
startup.bat

REM Stop servers
shutdown.bat
```

## What These Scripts Do

### Startup

1. Checks if backend (port 3010) and frontend (port 5173/5174) are already running
2. Kills any existing processes on those ports (if `-Clean` flag used or ports are in use)
3. Starts backend dev server in hidden background process
4. Starts frontend dev server in hidden background process
5. Displays URLs to access the application

**Default ports:**
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

### Shutdown

1. Finds processes running on ports 3010 and 5173/5174
2. Terminates those processes gracefully
3. Verifies ports are free
4. Reports status

## Requirements

- **Windows** (PowerShell 5.0+)
- Node.js and npm installed
- `backend/` and `frontend/` directories with `package.json` and npm scripts configured

## Troubleshooting

### Scripts won't run (execution policy error)

If you see "cannot be loaded because running scripts is disabled":

```powershell
# Allow scripts to run for this session only
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Then run the script
.\startup.ps1
```

### Ports still in use after shutdown

Check manually:
```powershell
# Find what's running on port 3001
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess
Get-Process -Id <PID>

# Kill it if needed
Stop-Process -Id <PID> -Force
```

### Servers start but don't respond

1. Check if npm dependencies are installed:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Check .env files in backend and frontend directories for correct configuration

3. Check terminal outputs:
   - Backend should show: `[OK] Backend running on http://localhost:3010`
   - Frontend should show: `[OK] Frontend running on http://localhost:5173`

## Development Workflow

```powershell
# Terminal 1: Start servers
.\startup.ps1

# Terminal 2: Run tests while servers are running
npm test

# When done: Stop servers
.\shutdown.ps1
```

## Auto-Restart Pattern

If you need to restart servers frequently during development:

```powershell
# Start with clean state (kills existing processes)
.\startup.ps1 -Clean

# ... do work ...

# Stop
.\shutdown.ps1

# Restart
.\startup.ps1 -Clean
```

## Port Configuration

If you want to use different ports:

1. **Backend**: Edit `backend/.env` and change `PORT=3010`
2. **Frontend**: Edit `frontend/.env` and set `VITE_API_URL=http://localhost:<new-port>`
3. Update the port numbers in `startup.ps1` and `shutdown.ps1`

## Notes

- Scripts run servers in hidden/background processes to keep your terminal clean
- Servers continue running after you close PowerShell
- Use `shutdown.ps1` or `shutdown.bat` to stop them
- For development, you may prefer to open separate terminals and run `npm run dev` directly to see full logs
- Status messages use text labels like [OK], [ERROR], [WARNING] instead of emojis for better terminal compatibility
