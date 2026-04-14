# Render-Installation fuer B.R.A.I.N. v106

## 1. Dateien nach GitHub
Lege dieses Projekt in ein GitHub-Repo.

## 2. Render Web Service
- New + -> Web Service
- GitHub-Repo verbinden
- Runtime: Python
- Build Command: `pip install -r requirements.txt`
- Start Command: `python main.py`

## 3. Persistent Disk
- Disk anlegen
- Mount Path: `/var/data`
- Groesse: 1 GB reicht zum Start

## 4. Environment Variables
- `PYTHON_VERSION=3.13.5`
- `HOST=0.0.0.0`
- `PORT=10000`
- `AUTO_OPEN_BROWSER=0`
- `APP_STORAGE_ROOT=/var/data`
- `APP_EXTERNAL_URL=https://DEIN-SERVICE.onrender.com`
- `TRUST_PROXY=1`
- `FORCE_HTTPS=1`
- `SESSION_COOKIE_SECURE=auto`
- `SECRET_KEY=` ein eigener langer Zufallswert
- optional `GROQ_API_KEY=`

## 5. Was gespeichert wird
- Nutzerkonten: SQLite im Persistent Disk
- Workspace-Dateien: Persistent Disk
- Cloud-Dateien: Persistent Disk
- Backups: Persistent Disk

## 6. Login-Flow
- Registrieren: E-Mail + Passwort + Passwort wiederholen
- Login: E-Mail + Passwort
- danach direkt Desktop

## 7. Wichtig
Ohne Persistent Disk gehen lokale Daten bei Neustarts verloren.
