# TradeVibe — Complete Setup Guide

## What you have
- Firebase project: tradevibe-44c08 (Blaze plan ✓)
- google-services.json: already placed in android/app/ ✓
- Service account: already in functions/src/index.js ✓
- Default webhook secret: tradevibe2024

---

## STEP 1 — Install Required Tools on your PC

### Node.js 20
https://nodejs.org → Download LTS → Install

### JDK 17
https://adoptium.net → Download JDK 17 → Install

### Android Studio
https://developer.android.com/studio → Download → Install
During install: check "Android SDK", "Android SDK Platform", "Android Virtual Device"

### Set ANDROID_HOME (Windows)
1. Search "Environment Variables" in Start menu
2. Under "System variables" → New
   Variable: ANDROID_HOME
   Value: C:\Users\YOUR_NAME\AppData\Local\Android\Sdk
3. Edit "Path" → Add:
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   %ANDROID_HOME%\platform-tools

### Firebase CLI
Open Command Prompt and run:
   npm install -g firebase-tools

---

## STEP 2 — Deploy Firebase Cloud Functions

Open Command Prompt, navigate to the project folder:
   cd "C:\path\to\tradevibe"

Run the deploy script:
   deploy-functions.bat

OR manually:
   cd functions
   npm install
   firebase login
   firebase use tradevibe-44c08
   firebase deploy --only functions

After deploy finishes you will see 3 URLs:
   alertWebhook:  https://us-central1-tradevibe-44c08.cloudfunctions.net/alertWebhook
   registerToken: https://us-central1-tradevibe-44c08.cloudfunctions.net/registerToken
   getStatus:     https://us-central1-tradevibe-44c08.cloudfunctions.net/getStatus

SAVE THESE URLS — you need them in Step 5.

---

## STEP 3 — Also update Firestore Rules

Go to console.firebase.google.com → TradeVibe project
→ Firestore Database → Rules tab
→ Replace everything with:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

→ Click Publish

---

## STEP 4 — Build the Android APK

Open Command Prompt in the project folder:
   cd "C:\path\to\tradevibe"
   build.bat

OR manually:
   cd app
   npm install
   cd android
   gradlew.bat assembleDebug

Wait 10-15 minutes on first build.

APK will be at:
   app\android\app\build\outputs\apk\debug\app-debug.apk

---

## STEP 5 — Install APK on your phone

### Enable USB Debugging on your Android phone
1. Settings → About phone → tap "Build number" 7 times
2. Settings → Developer options → enable "USB Debugging"

### Connect and install
1. Connect phone via USB cable
2. Phone shows popup → tap "Allow USB Debugging"
3. In Command Prompt run:
   adb install app\android\app\build\outputs\apk\debug\app-debug.apk
4. Wait for "Success" message

### OR transfer manually
1. Copy app-debug.apk to phone Downloads
2. Phone → Settings → Apps → Special app access → Install unknown apps → Files → Allow
3. Open Files app → Downloads → tap app-debug.apk → Install

---

## STEP 6 — Configure the app (first time)

1. Open TradeVibe app on your phone
2. Tap the gear icon (⚙) → Settings
3. Fill in these fields:

   Webhook URL:
   https://us-central1-tradevibe-44c08.cloudfunctions.net/alertWebhook

   Register Token URL:
   https://us-central1-tradevibe-44c08.cloudfunctions.net/registerToken

   Status URL:
   https://us-central1-tradevibe-44c08.cloudfunctions.net/getStatus

   Webhook Secret:
   tradevibe2024

4. Tap the green ✓ checkmark to save
5. Tap "↑ Register Device"
6. Wait 3-5 seconds → you should see FCM dot turn GREEN
7. Tap "↻ Refresh status" → Firebase dot should turn GREEN

---

## STEP 7 — Test the full flow

In the Settings screen, tap "▶ Send Test Alert"

Expected result:
- Phone vibrates within 1-2 seconds
- AlertActive screen appears with TESTUSDT BUY alert
- 4 connectivity dots should be green (or amber for TradingView until you set it up)

---

## STEP 8 — Configure TradingView

1. Open TradingView → go to any chart
2. Click the clock/alert icon → Create Alert
3. Set your alert conditions
4. Click the "Notifications" tab
5. Check "Webhook URL"
6. Paste this URL:
   https://us-central1-tradevibe-44c08.cloudfunctions.net/alertWebhook?secret=tradevibe2024

7. In the "Message" field paste this template:
   {"ticker":"{{ticker}}","action":"{{strategy.order.action}}","price":{{close}},"message":"{{strategy.order.comment}}","interval":"{{interval}}","exchange":"{{exchange}}"}

8. Click "Create" to save the alert

Now when TradingView fires → your phone vibrates within 1 second.

---

## TROUBLESHOOTING

### Build fails: SDK not found
→ Make sure ANDROID_HOME is set correctly
→ Open Android Studio → SDK Manager → install API 34

### "JAVA_HOME not set"
→ Install JDK 17 and restart Command Prompt

### App installs but blank screen
→ Run: adb logcat *:E
→ Check for JavaScript errors

### FCM token not registering
→ Make sure Register Token URL is correct
→ Check internet connection
→ Try: adb logcat | grep FCM

### Functions deploy fails: billing not enabled
→ Firebase Console → Upgrade to Blaze (already done ✓)

### TradingView webhook 401 error
→ Check your secret matches exactly: tradevibe2024
→ No extra spaces in the URL

### Phone not vibrating
→ Check phone is not in silent/DND mode
→ Settings → vibration pattern → tap Test Vibration

---

## Default webhook secret: tradevibe2024
You can change this in Settings screen at any time.
After changing, update TradingView webhook URL with new ?secret= value.

---

## Your Firebase project details
Project ID:    tradevibe-44c08
Project Number: 436549482618
Package name:  com.tradevibe
Region:        us-central1
