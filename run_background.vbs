Set WshShell = CreateObject("WScript.Shell")
' Run backend, AI service, and frontend in the background silently (window parameter 0 hides the CMD window)
WshShell.Run "cmd.exe /c cd backend && npm run dev", 0, false
WshShell.Run "cmd.exe /c cd ai_service && python -m uvicorn main:app --port 8000", 0, false
WshShell.Run "cmd.exe /c cd frontend && npm run dev", 0, false
