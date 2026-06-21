@echo off
echo =======================================================================
echo NetMind AI - Network Troubleshooting Assistant - Local Startup Utility
echo =======================================================================
echo.
echo Select Action:
echo [1] Run inside Docker Containers (Requires Docker Desktop running)
echo [2] Run locally on Host (Starts Backend, AI Service, and Frontend)
echo [3] First-Time Local Setup (Installs Node/Python packages and seeds DB)
echo.

set /p choice="Enter choice (1, 2 or 3): "

if "%choice%"=="1" (
    echo.
    echo Spinning up Docker Compose services...
    docker-compose up --build
    pause
    exit /b
)

if "%choice%"=="2" (
    echo.
    echo Starting all local services in separate terminal windows...
    
    echo Starting Express Backend (Port 5000)...
    start "NetMind Backend Server" cmd /k "cd backend && npm run dev"
    
    echo Starting FastAPI AI Service (Port 8000)...
    start "NetMind AI FastAPI Service" cmd /k "cd ai_service && python -m uvicorn main:app --reload --port 8000"
    
    echo Starting React Frontend (Port 3000)...
    start "NetMind Frontend Dev Server" cmd /k "cd frontend && npm run dev"
    
    echo.
    echo All services started! Please keep the command windows open.
    echo The web app will be available on http://localhost:3000
    echo.
    pause
    exit /b
)

if "%choice%"=="3" (
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
    echo Local installation and database seeding complete!
    echo You can now run option [2] to start the services.
    echo.
    pause
    exit /b
)

echo Invalid choice. Exiting.
pause
