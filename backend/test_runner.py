import os
import sys

target = r"C:\users\steamuser\.gemini\antigravity-ide\scratch\maktab-nazorati\backend\runner_log.txt"
with open(target, "w", encoding="utf-8") as f:
    f.write(f"Python executable: {sys.executable}\n")
    f.write(f"Current working dir: {os.getcwd()}\n")
    try:
        sys.path.insert(0, r"C:\users\steamuser\.gemini\antigravity-ide\scratch\maktab-nazorati\backend")
        import server
        f.write("Server module imported OK!\n")
    except Exception as e:
        import traceback
        traceback.print_exc(file=f)
