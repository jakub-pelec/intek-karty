@echo off
node "%~dp0..\node_modules\tsx\dist\cli.mjs" "%~dp0..\db\seed.ts"
