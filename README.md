# B.R.A.I.N. v106

Einfache Produktionsbasis:

- ein Login für alle
- E-Mail + Passwort
- Registrierung ohne Mail-Verifizierung
- direkt danach Desktop
- Accounts in SQLite
- Passwörter nur als Hash

## Lokal starten

1. `.env.example` zu `.env` kopieren
2. optional `GROQ_API_KEY` setzen
3. `start.bat` doppelklicken
4. Browser: `http://127.0.0.1:5100`

## Render

- Python Web Service
- Build Command: `pip install -r requirements.txt`
- Start Command: `python main.py`
- Persistent Disk an `/var/data`
- `APP_STORAGE_ROOT=/var/data` setzen
- `APP_EXTERNAL_URL=https://DEIN-SERVICE.onrender.com` setzen
- `TRUST_PROXY=1` setzen

## Login-Flow

- Registrieren: E-Mail + Passwort + Passwort wiederholen
- Login: E-Mail + Passwort
- danach direkt Desktop
