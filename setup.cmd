@echo off
cd /d "%~dp0"
call npm ci --ignore-scripts
if errorlevel 1 goto finish
call npm run build
if errorlevel 1 goto finish
call npm run setup
:finish
pause
