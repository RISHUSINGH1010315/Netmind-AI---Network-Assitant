#!/bin/bash
echo "======================================================================="
echo "NetMind AI - Network Troubleshooting Assistant - Local Startup Utility"
echo "======================================================================="
echo ""
echo "Select Execution Environment:"
echo "[1] Run inside Docker Containers (Requires Docker running)"
echo "[2] Run locally in Host Shells (Requires Node.js, Python, MongoDB)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" == "1" ]; then
    echo ""
    echo "Spinning up Docker Compose services..."
    docker-compose up --build
    exit 0
elif [ "$choice" == "2" ]; then
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
    echo "Installation complete. Please open three terminal windows and run:"
    echo "1. In backend/: npm run dev"
    echo "2. In ai_service/: python -m uvicorn main:app --reload --port 8000"
    echo "3. In frontend/: npm run dev"
    echo ""
    exit 0
fi

echo "Invalid choice. Exiting."
exit 1
