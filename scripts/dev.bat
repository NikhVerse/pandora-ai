@echo off
echo ===================================================
echo   🔮 Pandora Monorepo Developer Quickstart Launcher
echo ===================================================
echo.

echo [Step 1] Resolving root workspace package dependencies...
call npm install

echo.
echo [Step 2] Launching parallel development processes...
echo.
echo - Starting Vite React frontend (port 3000)...
start "Pandora Frontend" cmd /k "npm run dev:frontend"

echo - Starting FastAPI Python backend (port 8000)...
start "Pandora Backend" cmd /k "cd apps/backend && py -3.12 -m pip install -r requirements.txt && py -3.12 -m uvicorn main:app --reload --port 8000"

echo.
echo Pandora services initialized. Check terminal windows for details.
echo.
pause
