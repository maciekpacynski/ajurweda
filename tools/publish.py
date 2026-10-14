"""Publish the app to GitHub Pages.

Run from PyCharm's terminal in the project folder:

    python tools/publish.py "Opis zmiany"

Steps:
  1. regenerates pp/data from tools/prakriti_cechy.json (gen_data.py),
  2. runs the scoring tests (needs Node.js; skipped with a note if Node is missing),
  3. on the first run, connects this folder to github.com/maciekpacynski/ajurweda
     (same setup as the Sledzik project: remote "origin", branch "main"),
  4. git add, commit, push.

The site refreshes 1-2 minutes after the push:
    https://maciekpacynski.github.io/ajurweda/pp.html
"""
import os
import shutil
import subprocess
import sys

REMOTE = "https://github.com/maciekpacynski/ajurweda.git"
BRANCH = "main"
SITE = "https://maciekpacynski.github.io/ajurweda/pp.html"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run(cmd, check=True, capture=False):
    print("> " + " ".join(cmd))
    res = subprocess.run(cmd, cwd=ROOT, text=True, encoding="utf-8",
                         capture_output=capture)
    if check and res.returncode != 0:
        if capture:
            print(res.stdout or "", res.stderr or "")
        sys.exit(f"\nPrzerwano: polecenie zakończyło się błędem ({res.returncode}).")
    return res


def git_out(*args):
    return run(["git", *args], check=False, capture=True).stdout.strip()


def first_time_setup():
    """Turn the folder into a clone of the existing GitHub repository, keeping local files."""
    print("\nPierwsze uruchomienie: łączę folder z repozytorium na GitHubie.")
    run(["git", "init", "-b", BRANCH])
    run(["git", "remote", "add", "origin", REMOTE])
    fetched = run(["git", "fetch", "origin", BRANCH], check=False)
    if fetched.returncode == 0:
        # Adopt GitHub's history without touching the files on disk (local files win).
        run(["git", "reset", "--mixed", f"origin/{BRANCH}"])
        run(["git", "branch", f"--set-upstream-to=origin/{BRANCH}", BRANCH])
    else:
        print("Repozytorium na GitHubie jest puste – zostanie utworzona pierwsza wersja.")


def main():
    msg = " ".join(sys.argv[1:]).strip() or "Aktualizacja aplikacji"
    os.chdir(ROOT)

    if not shutil.which("git"):
        sys.exit("Nie znaleziono programu git. Zainstaluj Git for Windows.")

    # 1. data
    run([sys.executable, os.path.join("tools", "gen_data.py")])

    # 2. tests
    if shutil.which("node"):
        run(["node", os.path.join("pp", "tests", "run-node.js")])
    else:
        print("Node.js nie jest zainstalowany – pomijam testy w terminalu.\n"
              "Możesz je sprawdzić w przeglądarce: pp/tests/scoring.test.html")

    # 3. repository
    if not os.path.isdir(os.path.join(ROOT, ".git")):
        first_time_setup()
    if not git_out("config", "user.name"):
        sys.exit('\nUstaw raz swoje dane dla Gita i uruchom skrypt ponownie:\n'
                 '  git config --global user.name "Maciej Pacyński"\n'
                 '  git config --global user.email "twoj-email@example.com"')

    # 4. commit + push
    run(["git", "add", "-A"])
    if not git_out("status", "--porcelain"):
        print("\nBrak zmian do wysłania – strona jest aktualna.")
        return
    run(["git", "commit", "-m", msg])
    run(["git", "push", "-u", "origin", BRANCH])
    print(f"\nWysłano. Strona odświeży się za 1–2 minuty:\n  {SITE}")


if __name__ == "__main__":
    main()
