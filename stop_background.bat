@echo off
echo Stopping all silent NetMind background services...
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
echo All background node and python processes have been stopped.
pause
