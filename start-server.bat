@echo off
echo ========================================
echo   Starting Roblox LAN Server (Python)...
echo   Supports REAL file uploads and JSON sync
echo   Truy cap: http://192.168.2.247:4953
echo ========================================
python "%~dp0python_server.py"
pause
# taskkill /PID 21080 /F ; Start-Sleep 1 ; http-server "d:\web\laragon\www\robloxv1\roblox" -a 0.0.0.0 -p 4953 --cors