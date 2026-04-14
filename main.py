try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

from app import create_app
import threading
import time
import webbrowser

app = create_app()

def _open_browser():
    time.sleep(1.5)
    url = f"http://{app.config['HOST']}:{app.config['PORT']}"
    for candidate in (url, "http://127.0.0.1:5100"):
        try:
            webbrowser.open(candidate)
            break
        except Exception:
            pass

if __name__ == "__main__":
    if app.config.get("AUTO_OPEN_BROWSER", False):
        threading.Thread(target=_open_browser, daemon=True).start()
    app.run(host=app.config["HOST"], port=app.config["PORT"], debug=False)
