@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Pubblica Smart Cucine su GitHub
cd /d "%~dp0"

set REPO=https://github.com/simoxst91-lgtm/SmartCucine.git
set RAMO=main

echo.
echo ===========================================================
echo   SMART CUCINE - pubblicazione su GitHub
echo   %REPO%
echo ===========================================================
echo.

REM ---------- 1. controlli ----------
where git >nul 2>&1
if errorlevel 1 (
  echo [ERRORE] Git non e' installato su questo computer.
  echo.
  echo Scaricalo da https://git-scm.com/download/win
  echo Installalo lasciando tutte le opzioni predefinite, poi rilancia.
  echo.
  pause
  exit /b 1
)

if not exist "index.html" (
  echo [ERRORE] Non trovo index.html in questa cartella:
  echo   %CD%
  echo.
  echo Sposta pubblica.bat dentro la cartella del sito e rilancia.
  echo.
  pause
  exit /b 1
)

REM ---------- 2. file di servizio ----------
if not exist ".gitignore" (
  echo Creo .gitignore
  >  ".gitignore" echo immagini-originali/
  >> ".gitignore" echo *.zip
  >> ".gitignore" echo Thumbs.db
  >> ".gitignore" echo .DS_Store
  >> ".gitignore" echo desktop.ini
)

if not exist ".nojekyll" (
  echo Creo .nojekyll
  type nul > ".nojekyll"
)

if not exist "README.md" (
  echo Creo README.md
  >  "README.md" echo # Smart Cucine
  >> "README.md" echo.
  >> "README.md" echo Sito di Smart Cucine F.lli Erba s.a.s. - Via Garibaldi 219, Fino Mornasco ^(CO^).
  >> "README.md" echo.
  >> "README.md" echo Sito statico: nessun CMS, nessun database.
  >> "README.md" echo Istruzioni di manutenzione in LEGGIMI.txt
)

REM ---------- 3. repository locale ----------
if not exist ".git" (
  echo.
  echo Primo avvio: collego la cartella al repository...
  git init >nul 2>&1
  git branch -M %RAMO% >nul 2>&1
  git remote add origin %REPO%
) else (
  git remote get-url origin >nul 2>&1
  if errorlevel 1 (
    git remote add origin %REPO%
  ) else (
    git remote set-url origin %REPO%
  )
)

REM ---------- 4. allineo al contenuto gia' online ----------
echo Controllo cosa c'e' gia' su GitHub...
git fetch origin %RAMO% >nul 2>&1
if not errorlevel 1 (
  git rev-parse --verify HEAD >nul 2>&1
  if errorlevel 1 (
    echo Trovato contenuto online: mi ci aggancio senza cancellarlo.
    git reset --mixed FETCH_HEAD >nul 2>&1
  )
)

REM ---------- 5. commit ----------
echo Preparo i file...
git add -A >nul 2>&1

git diff --cached --quiet
if not errorlevel 1 (
  REM Nessun file cambiato. Potrebbero pero' esserci commit gia' fatti
  REM ma mai arrivati su GitHub, per esempio dopo un invio fallito.
  set DACARICARE=0
  for /f %%c in ('git rev-list --count origin/%RAMO%..HEAD 2^>nul') do set DACARICARE=%%c
  if "!DACARICARE!"=="0" (
    echo.
    echo Nessuna modifica da pubblicare: online c'e' gia' tutto.
    echo.
    pause
    exit /b 0
  )
  echo.
  echo Nessun file modificato, ma ci sono !DACARICARE! commit mai inviati.
  echo Provo a mandarli.
  goto :INVIO
)

set MESSAGGIO=%~1
if "%MESSAGGIO%"=="" set MESSAGGIO=Aggiornamento sito %DATE% %TIME%

git commit -m "%MESSAGGIO%" >nul
if errorlevel 1 (
  echo.
  echo [ERRORE] Commit non riuscito.
  echo Se e' la prima volta che usi Git, imposta nome ed email con:
  echo    git config --global user.name "Simone Terragni"
  echo    git config --global user.email "simox91.st@gmail.com"
  echo.
  pause
  exit /b 1
)

REM ---------- 6. invio ----------
echo.
echo Invio a GitHub. Se chiede le credenziali, accedi con il browser
echo oppure usa un token personale al posto della password.
echo.

git push -u origin %RAMO% 2> "%TEMP%\sc_push_err.txt"
set PUSHKO=%errorlevel%
type "%TEMP%\sc_push_err.txt"

if not "%PUSHKO%"=="0" (
  echo.
  echo ===========================================================
  echo   INVIO NON RIUSCITO
  echo ===========================================================
  echo.

  findstr /i /c:"denied to" /c:"403" "%TEMP%\sc_push_err.txt" >nul 2>&1
  if not errorlevel 1 (
    echo CAUSA: stai usando l'account GitHub sbagliato.
    echo.
    echo Git su questo computer e' collegato a un account che NON ha il
    echo permesso di scrivere su questo repository. Il messaggio qui sopra
    echo dice "denied to" seguito dal nome dell'account in uso.
    echo.
    echo SOLUZIONE A - cambia account su questo computer
    echo   1. Pannello di controllo - Gestione credenziali
    echo   2. Credenziali Windows
    echo   3. cancella la voce  git:https://github.com
    echo   4. rilancia questo file: chiedera' di accedere di nuovo,
    echo      entra con l'account proprietario del repository.
    echo.
    echo SOLUZIONE B - dai il permesso all'account che stai usando
    echo   Dal profilo proprietario del repository:
    echo   Repository - Settings - Collaborators - Add people
    echo   aggiungi l'altro account e accetta l'invito.
    echo.
    echo SOLUZIONE C - sposta il progetto sull'altro account
    echo   Crea il repository sull'account che usi di solito,
    echo   poi cambia la riga  set REPO=  all'inizio di questo file.
    echo.
  ) else (
    findstr /i /c:"rejected" /c:"non-fast-forward" "%TEMP%\sc_push_err.txt" >nul 2>&1
    if not errorlevel 1 (
      echo CAUSA: il repository online e' stato modificato altrove.
      echo.
      echo Allinea e ripubblica con:
      echo    git pull --rebase origin %RAMO%
      echo poi rilancia questo file.
      echo.
    ) else (
      echo CAUSA: credenziali non valide o rete non raggiungibile.
      echo.
      echo GitHub non accetta piu' la password normale. Serve un token:
      echo   github.com - Settings - Developer settings
      echo     - Personal access tokens - Tokens ^(classic^) - Generate new
      echo   Spunta "repo", generalo e incollalo al posto della password.
      echo.
    )
  )
  del "%TEMP%\sc_push_err.txt" >nul 2>&1
  pause
  exit /b 1
)
del "%TEMP%\sc_push_err.txt" >nul 2>&1

REM ---------- 7. fatto ----------
echo.
echo ===========================================================
echo   PUBBLICATO
echo ===========================================================
echo.
for /f "tokens=*" %%i in ('git rev-parse --short HEAD') do set SHA=%%i
echo   Commit:  !SHA!
echo   Repo:    https://github.com/simoxst91-lgtm/SmartCucine
echo.
echo Se e' la prima volta, attiva GitHub Pages:
echo   Repository - Settings - Pages
echo   Source: "Deploy from a branch"
echo   Branch: %RAMO%  -  cartella: / ^(root^)  -  Save
echo.
echo Dopo qualche minuto il sito sara' su:
echo   https://simoxst91-lgtm.github.io/SmartCucine/
echo.
pause
exit /b 0
