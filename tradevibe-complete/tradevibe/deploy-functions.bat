@echo off
echo ============================================
echo   TradeVibe - Deploy Firebase Functions
echo ============================================

echo.
echo [1/3] Logging into Firebase...
call firebase login

echo.
echo [2/3] Setting Firebase project...
call firebase use tradevibe-44c08

echo.
echo [3/3] Deploying functions...
call firebase deploy --only functions

echo.
echo ============================================
echo   COPY THE FUNCTION URLS ABOVE
echo   Paste them into your app Settings screen
echo ============================================
echo.
pause
