import sys, os
with open("test_file_created.txt", "w") as f:
    f.write(f"Python executable: {sys.executable}\nVersion: {sys.version}\nCWD: {os.getcwd()}\n")
print("Written!")
