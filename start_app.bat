@echo off
setlocal ENABLEDELAYEDEXPANSION
cd /d "%~dp0"

echo ==========================================
echo   B.R.A.I.N. einfacher Render-Login
echo ==========================================
echo.

if not exist ".env" (
  if exist ".env.example" (
    copy /Y ".env.example" ".env" >nul
    echo [OK] .env aus .env.example erstellt
  )
)

where py >nul 2>nul
if %errorlevel%==0 (
  set "BASE_PY=py -3"
) else (
  set "BASE_PY=python"
)

%BASE_PY% --version >nul 2>nul
if errorlevel 1 (
  echo [FEHLER] Python wurde nicht gefunden.
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo [INFO] Erstelle virtuelle Umgebung...
  %BASE_PY% -m venv .venv
  if errorlevel 1 (
    echo [FEHLER] Konnte .venv nicht erstellen.
    pause
    exit /b 1
  )
)

set "VENV_PY=.venv\Scripts\python.exe"

echo [INFO] Aktualisiere pip...
"%VENV_PY%" -m pip install --upgrade pip
if errorlevel 1 (
  echo [FEHLER] pip Upgrade fehlgeschlagen.
  pause
  exit /b 1
)

echo [INFO] Installiere Anforderungen...
"%VENV_PY%" -m pip install -r requirements.txt
if errorlevel 1 (
  echo [FEHLER] requirements konnten nicht installiert werden.
  pause
  exit /b 1
)

echo.
echo [INFO] Wenn kein .env vorhanden ist, wurde .env.example kopiert.
echo [INFO] Fuer Brain live bitte GROQ_API_KEY in .env setzen.
echo [INFO] Fuer Render/Quest setze APP_EXTERNAL_URL, TRUST_PROXY und ggf. FORCE_HTTPS in .env.
echo [INFO] Wenn die App startet, oeffne im Browser:
echo http://127.0.0.1:5100
echo.

"%VENV_PY%" main.py
set EXITCODE=%errorlevel%

echo.
if not "%EXITCODE%"=="0" (
  echo [FEHLER] App wurde mit Exit-Code %EXITCODE% beendet.
) else (
  echo [OK] App beendet.
)
pause
exit /b %EXITCODE%
