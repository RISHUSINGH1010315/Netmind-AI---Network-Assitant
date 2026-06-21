@echo off
echo =======================================================================
echo NetMind AI - Network Troubleshooting Assistant - Local Startup Utility
echo =======================================================================
echo.
echo Select Execution Environment:
echo [1] Run inside Docker Containers (Requires Docker Desktop running)
echo [2] Run locally in Host Shells (Requires Node.js, Python, MongoDB)
echo.

set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Spinning up Docker Compose services...
    docker-compose up --build
    pause
    exit /b
)

if "%choice%"=="2" (
    echo.
    echo Installing local dependencies...
    
    echo [1/3] Setting up Express Backend...
    cd backend
    call npm install
    
    echo [2/3] Seeding MongoDB database...
    call npm run seed
    
    echo [3/3] Setting up React Frontend...
    cd ../frontend
    call npm install
    
    echo.
    echo Installation complete. Please open three terminal windows and run:
    echo 1. In backend/: npm run dev
    echo 2. In ai_service/: python -m uvicorn main:app --reload --port 8000
    echo 3. In frontend/: npm run dev
    echo.
    pause
    exit /b
)

echo Invalid choice. Exiting.
pause
