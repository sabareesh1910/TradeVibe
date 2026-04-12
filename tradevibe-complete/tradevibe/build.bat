@echo off
echo ============================================
echo   TradeVibe - Build Script
echo ============================================

echo.
echo [1/4] Installing app dependencies...
cd app
call npm install
if %errorlevel% neq 0 (echo ERROR: npm install failed && pause && exit /b 1)

echo.
echo [2/4] Installing Firebase function dependencies...
cd ..\functions
call npm install
if %errorlevel% neq 0 (echo ERROR: functions npm install failed && pause && exit /b 1)

echo.
echo [3/4] Building Android APK...
cd ..\app\android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (echo ERROR: APK build failed && pause && exit /b 1)

echo.
echo [4/4] Done!
echo.
echo APK location:
echo app\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Next: Connect phone via USB and run:
echo   adb install app\android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
