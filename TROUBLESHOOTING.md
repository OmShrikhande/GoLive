# Troubleshooting "Network request failed" in Release APK

When you build and run the release APK and see **"Initialization error: Network request failed"**, it means the app cannot reach the backend token server. Here's how to fix it:

## Common Causes

### 1. **Backend URL is Incorrect or Unreachable**
- The APK has `BACKEND_URL = "http://194.163.178.69:3000"` baked in.
- Your VPS at `194.163.178.69` must be running the Node.js backend.
- Check:
  ```bash
  # On your VPS, verify the backend is running:
  ps aux | grep node
  netstat -tlnp | grep 3000  # Ensure port 3000 is listening
  ```

### 2. **Firewall / Network Access**
- Port 3000 on the VPS must be open to traffic from your mobile device/emulator.
- Android emulator may not reach `194.163.178.69:3000` if:
  - The IP is not reachable from the emulator's network
  - Firewall blocks the port
- **Solution:** Test from your phone or verify emulator can reach the backend:
  ```bash
  # From emulator console (Android), test:
  curl http://194.163.178.69:3000/getToken
  ```

### 3. **SSL/HTTPS Issues (if using HTTPS)**
- If you switch to HTTPS (`https://...`), ensure the certificate is valid.
- Android may reject self-signed certificates in release builds.
- Use a valid CA certificate or test with HTTP first.

### 4. **Environment Variables Not Baked into APK**
- `.env` files are **NOT** included in the built APK.
- The app uses hardcoded fallback URLs in `App.tsx`:
  ```typescript
  const BACKEND_URL = process.env.Backend_URL || "http://194.163.178.69:3000";
  const LIVEKIT_URL = (process.env.LIVEKIT_URL || "ws://194.163.178.69:7880").replace(/\/$/, "");
  ```
- If you need to change URLs for the release build, you **must** either:
  - Edit `App.tsx` before building the APK, or
  - Use Expo secrets / build-time environment variables (see below)

### 5. **Android Emulator Network Issues**
- Android emulator may not resolve `194.163.178.69` correctly.
- **For local testing on emulator:**
  - Use `http://10.0.2.2:3000` instead (special alias to host machine)
  - Or connect a real Android device to the same network as your VPS

### 6. **Retry Logic**
- The updated `App.tsx` now retries 3 times with 2-second delays.
- If retries still fail, the detailed error message will tell you what went wrong.
- Check the LogDisplay in the error screen for exact error details.

## Quick Debugging Steps

1. **Check Backend is Running**
   ```bash
   curl http://194.163.178.69:3000/getToken
   ```
   Should return a JWT token (long string starting with `ey...`).

2. **Check Network Connectivity from Phone/Emulator**
   - Use a web browser on the device to visit `http://194.163.178.69:3000/getToken`
   - You should see the token in the browser.

3. **Check LiveKit Server is Running**
   - Ensure LiveKit server is accessible at `ws://194.163.178.69:7880`
   - Verify with:
     ```bash
     # From your VPS
     docker ps  # Check if LiveKit container is running
     ```

4. **Enable Debug Logs**
   - The error screen shows console logs in `LogDisplay`.
   - Watch for messages like:
     - `📍 Backend URL: ...` — confirms the URL being used
     - `📡 Attempt X/3: Fetching token...` — shows retry attempts
     - Exact error message from the failed request

## Setting Environment Variables for Release Builds

If you want to use different URLs for the release APK without editing `App.tsx`, use Expo's build environment variables:

### Option A: Hardcode in `app.json`
Edit `app.json` and add:
```json
{
  "expo": {
    "name": "...",
    "plugins": [
      [
        "@livekit/react-native-expo-plugin",
        {
          "defaultBackendUrl": "http://194.163.178.69:3000",
          "defaultLiveKitUrl": "ws://194.163.178.69:7880"
        }
      ]
    ],
    "extra": {
      "backendUrl": "http://194.163.178.69:3000",
      "liveKitUrl": "ws://194.163.178.69:7880"
    }
  }
}
```

Then in `App.tsx`, read from `app.json`:
```typescript
import Constants from "expo-constants";
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || "http://194.163.178.69:3000";
```

### Option B: Use Render Backend URL (Recommended for Production)
Once your backend is deployed to Render:
```typescript
const BACKEND_URL = process.env.Backend_URL || "https://golive-hg5x.onrender.com";
```

This way, your released app connects to the cloud backend instead of a local VPS.

## Testing Workflow

1. **Start Backend**
   ```bash
   cd backend
   npm start
   ```

2. **Test from Web Browser**
   - Open `http://194.163.178.69:3000/getToken` → should return a token

3. **Build APK**
   ```bash
   eas build -p android --profile preview
   ```

4. **Install on Device**
   - Download the APK and install on Android device or emulator

5. **Run and Check Logs**
   - Open the app, look at the error/loading screen
   - Check the logs in `LogDisplay` for detailed error messages

## Still Stuck?

- Paste the exact error message from the LogDisplay here
- Check if `http://194.163.178.69:3000/getToken` works from your device's browser
- Verify your VPS backend is running: `ps aux | grep node`
- Check firewall: `sudo ufw status` (if using UFW)
