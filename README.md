# NetMind AI – Intelligent Network Troubleshooting Assistant

NetMind AI is a production-ready, fully functional enterprise operations and network troubleshooting intelligence platform. It acts as an automated Network Operations Center (NOC) and cybersecurity audit platform, parsing router/switch configurations, translating technical logs, analyzing routing and VLAN topologies, predicting link or CPU saturations, and enabling a contextual chat interface powered by RAG and LLM models.

---

## Architecture Overview

```
+------------------------------------------------------------+
|                         FRONTEND                           |
|             (React + TS + Tailwind CSS + Vis.js)           |
+------------------------------+-----------------------------+
                               | REST Requests
                               v
+------------------------------------------------------------+
|                         BACKEND                            |
|             (Node.js + Express + TypeScript)               |
+------------------+---------------------+-------------------+
                   |                     |
                   | Mongoose            | HTTP Forwarding
                   v                     v
+------------------+---+       +---------+-------------------+
|      DATABASE        |       |        AI SERVICE           |
|      (MongoDB)       |       | (Python FastAPI + Gemini)   |
+----------------------+       +-----------------------------+
```

1.  **Frontend (React/Vite/TS):** A dashboard implementing corporate light theme guidelines. Features live stats tracking, Recharts SLA area graphs, Vis.js draggable topologies, device details slide-overs, log translators, RAG chat assistant, and ticket systems.
2.  **Backend (Node/Express/TS):** Handles JWT sessions, secure token refreshes, Role-Based Access Control (RBAC) validations, configuration uploads via Multer, PDF/Excel report generators, and dashboard metrics.
3.  **AI Service (FastAPI/Python):** Integrates Gemini API and OpenAI. Runs a regex-based configuration parsing engine, a network rule-check suite (routing, VLAN native mismatches, security compliance checks), syslog translators, and CDP/LLDP topology discounters.
4.  **Database (MongoDB):** Mongoose schemas for Users, Devices, Incidents, Logs, Alerts, Configurations, Reports, and Chat sessions.

---

## Installation & Startup Guide

You can run the entire environment using Docker Compose (Recommended) or locally using native runtime processes.

### Option 1: One-Command Docker Setup (Recommended)

Ensure Docker Desktop and Docker Compose are installed and running.

1.  *(Optional)* Create a `.env` file inside the `ai_service/` folder and insert your LLM API keys:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    OPENAI_API_KEY=your_openai_api_key_here
    ```
    *If no keys are provided, the system automatically falls back to the intelligent rule-based engine and mock responses, so all features remain functional out-of-the-box.*
2.  Run the startup utility at the root of the project:
    *   **Windows:** Double-click `start.bat` and select `[1]`.
    *   **Linux / macOS:** Run `chmod +x start.sh && ./start.sh` and select `[1]`.
3.  Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

### Option 2: Local Host Development Setup

Ensure you have **Node.js (v18+)**, **Python (v3.10+)**, and **MongoDB** installed and running on port 27017.

1.  Double-click `start.bat` (or run `./start.sh` on Unix) and select `[2]`. This will install all dependencies in `backend/` and `frontend/` and automatically seed the MongoDB database.
2.  **Start Services** (in three separate terminal windows):
    *   **Backend API server:**
        ```bash
        cd backend
        npm run dev
        ```
        *(Runs on port 5000)*
    *   **AI FastAPI Service:**
        Ensure you are inside the `ai_service/` folder, install python dependencies, and run:
        ```bash
        cd ai_service
        pip install -r requirements.txt
        python -m uvicorn main:app --reload --port 8000
        ```
        *(Runs on port 8000)*
    *   **React Frontend:**
        ```bash
        cd frontend
        npm run dev
        ```
        *(Runs on port 3000)*
3.  Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Preseeded User Accounts (RBAC Roles)

When the seeder script executes, five default user profiles are registered. You can use these to test authorization privileges:

| Role | Username (Email) | Password | Operations Privileges |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@netmind.ai` | `admin123` | Full access. Can create/delete devices and edit tickets. |
| **Network Engineer** | `engineer@netmind.ai` | `engineer123` | Can create/update inventory nodes and upload configuration audits. |
| **NOC Engineer** | `noc@netmind.ai` | `noc123` | Can open tickets, modify status/assignees, and add resolutions. |
| **Security Analyst** | `security@netmind.ai` | `security123` | Can inspect security/ACL audits and check compliance logs. |
| **Viewer** | `viewer@netmind.ai` | `viewer123` | Read-only access to dashboards, logs, and topologies. |

---

## Key Core Endpoints (REST API)

### Authentication
*   `POST /api/auth/register` - Create a user profile.
*   `POST /api/auth/login` - Authenticate, return Access JWT + Refresh Token.
*   `POST /api/auth/refresh` - Refresh an expired access token.
*   `GET /api/auth/me` - Retrieve current session details.

### Device Inventory
*   `GET /api/devices` - Fetch all devices (supports query filters for status, vendor, search).
*   `POST /api/devices` - Register new node (Requires Super Admin or Network Engineer).
*   `PUT /api/devices/:id` - Edit hardware specifications.
*   `DELETE /api/devices/:id` - Delete node (Requires Super Admin).

### Configurations & AI Diagnostics
*   `POST /api/config/analyze` - Upload configuration file (Multer) for parsing and security audit checks.
*   `GET /api/config/findings` - Query global AI findings by category (Routing, VLAN, ACL, Security).

### Chat Assistant (RAG)
*   `POST /api/chat/sessions` - Spawn new troubleshooting room.
*   `POST /api/chat/sessions/:sessionId/message` - Submit message context to LLM/FastAPI query engine.

### Reports
*   `GET /api/reports/pdf` - Stream automated PDF network audit summaries.
*   `GET /api/reports/excel` - Stream Excel sheet inventories.
