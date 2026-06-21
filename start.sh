#!/bin/bash
echo "======================================================================="
echo "NetMind AI - Network Troubleshooting Assistant - Local Startup Utility"
echo "======================================================================="
echo ""
echo "Select Action:"
echo "[1] Run inside Docker Containers (Requires Docker running)"
echo "[2] Run locally on Host (Starts Backend, AI Service, and Frontend)"
echo "[3] First-Time Local Setup (Installs Node/Python packages and seeds DB)"
echo ""
read -p "Enter choice (1, 2 or 3): " choice

if [ "$choice" == "1" ]; then
    echo ""
    echo "Spinning up Docker Compose services..."
    docker-compose up --build
    exit 0
elif [ "$choice" == "2" ]; then
    echo ""
    echo "Starting all local services in background..."
    
    echo "Starting Express Backend (Port 5000)..."
    npm run dev --prefix backend &
    BACKEND_PID=$!
    
    echo "Starting FastAPI AI Service (Port 8000)..."
    python -m uvicorn main:app --reload --port 8000 --app-dir ai_service &
    AI_PID=$!
    
    echo "Starting React Frontend (Port 3000)..."
    npm run dev --prefix frontend &
    FRONTEND_PID=$!
    
    echo ""
    echo "All services started!"
    echo "Express Backend PID: $BACKEND_PID"
    echo "FastAPI AI Service PID: $AI_PID"
    echo "Vite Frontend PID: $FRONTEND_PID"
    echo ""
    echo "Press [CTRL+C] or terminate this session to stop all background tasks."
    
    # Keep script alive and trap CTRL+C to kill child PIDs
    trap "kill $BACKEND_PID $AI_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
    while true; do
        sleep 1
    done
elif [ "$choice" == "3" ]; then
    echo ""
    echo "Installing local dependencies..."
    
    echo "[1/3] Setting up Express Backend..."
    cd backend
    npm install
    
    echo "[2/3] Seeding MongoDB database..."
    npm run seed
    
    echo "[3/3] Setting up React Frontend..."
    cd ../frontend
    npm install
    
    echo ""
    echo "Local installation and database seeding complete!"
    echo "You can now run option [2] to start the services."
    echo ""
    exit 0
fi

echo "Invalid choice. Exiting."
exit 1
