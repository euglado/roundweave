@echo off
cd /d "%~dp0"
call npm run build
if errorlevel 1 goto finish
call npm start
:finish
pause
