# Network Issue Fix - React Native Android

## Changes Made

### 1. Created Network Security Configuration
**File:** `android/app/src/main/res/xml/network_security_config.xml`

This file allows:
- HTTPS connections to your API (queryme.in)
- Cleartext traffic for localhost development
- System certificate trust

### 2. Updated Android Manifest
**File:** `android/app/src/main/AndroidManifest.xml`

Added the network security config reference to the application tag:
```xml
android:networkSecurityConfig="@xml/network_security_config"
```

### 3. Enhanced API Error Handling
**File:** `app/index.tsx`

Added:
- Better error logging with console messages
- HTTP status checking
- Accept headers for JSON responses
- Detailed error messages for debugging
- Store message text before clearing input

## Why API Works on Web but Fails on Android

1. **Android 9+ Requires HTTPS by Default** - Web browsers don't enforce this
2. **Network Security Policies** - Android apps need explicit configuration
3. **Cleartext Traffic** - HTTP connections are blocked unless explicitly allowed
4. **Certificate Validation** - Android validates SSL certificates more strictly

## Next Steps

1. **Rebuild the Android App:**
   ```bash
   npm run android
   # or if using Expo
   eas build --platform android --local
   ```

2. **Test the App:**
   - Open the app on your Android device
   - Try sending a message
   - Check the console logs for any network errors

3. **If Still Having Issues:**
   - Check if your API endpoint is HTTPS (recommended)
   - Verify your device has internet connection
   - Check Android logcat for network errors: `adb logcat`
   - Ensure firewall isn't blocking the API

## Important Notes

⚠️ **Production:** The `cleartextTrafficPermitted="true"` for localhost/127.0.0.1 is only for development. For production, ensure your API uses HTTPS and remove cleartext permissions.

## Debugging Tips

Run these commands if you encounter issues:

```bash
# Check device logs
adb logcat | grep -i fetch

# Test network connectivity
adb shell ping 8.8.8.8

# Check current network
adb shell ip route
```
