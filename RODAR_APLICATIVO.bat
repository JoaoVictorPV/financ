@echo off
setlocal

REM Sempre executa a partir da pasta do projeto
cd /d "%~dp0"

echo =====================================
echo Fin.SYS - Rodar local
echo =====================================

if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)

echo Iniciando servidor de desenvolvimento (em uma nova janela)...
start "Fin.SYS Dev" cmd /k "npm run dev"

REM abre o Google Chrome automaticamente (pode demorar 1-3s para o servidor responder)
timeout /t 2 /nobreak >nul

REM tenta localizar o Chrome (x64/x86). Se nao achar, cai para o navegador padrao.
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" (
  start "" "%CHROME%" "http://localhost:3000"
) else (
  set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  if exist "%CHROME%" (
    start "" "%CHROME%" "http://localhost:3000"
  ) else (
    start "" "http://localhost:3000"
  )
)

echo Navegador aberto em: http://localhost:3000
echo Se nao abrir, copie e cole esse link no navegador.
