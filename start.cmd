@echo off
cd /d "%~dp0"
echo Open http://localhost:8002
python -m http.server 8002 --bind 127.0.0.1
pause
