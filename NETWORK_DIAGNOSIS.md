# Network Connection Diagnosis - QueryMe App

## Current Status
The app is showing: **"Network request failed"** on all 3 retry attempts

This means the Android device cannot establish a connection to `https://queryme.in/smondoville/app/text_query`

## Root Causes (Most Likely to Least Likely)

### 1. ⚠️ MOST LIKELY: API Server Unreachable
**Symptom**: Fails immediately on all 3 attempts  
**Why**: The server at `queryme.in` might be:
- Temporarily down for maintenance
- Not accepting connections from your network
- Firewall blocking the request
- DNS not resolving correctly on device

**Test from your PC**:
```bash
# From Windows PowerShell
curl.exe -v https://queryme.in/smondoville/app
```

If this fails, the server is unreachable. Contact server admin.

### 2. Device Network Configuration
**Symptom**: Works on PC but not on phone  
**Why**: Device might be on different network with restrictions

**Tests to run on device**:
```bash
# Test 1: Check if device has internet
adb shell ping 8.8.8.8

# Test 2: Check DNS resolution
adb shell ping queryme.in

# Test 3: Try alternative DNS
adb shell getprop net.dns1
adb shell getprop net.dns2
```

### 3. Network Security Config Issue
**Symptom**: Certificate or HTTPS validation error  
**Why**: Android network security might be rejecting the connection

**Current Config**: `android/app/src/main/res/xml/network_security_config.xml`

Includes:
- ✅ HTTPS support for queryme.in
- ✅ System + User certificates trusted
- ✅ Cleartext for dev IPs

This should be correct, but can be verified.

---

## Quick Diagnostic Steps

### Step 1: Test from PC (Right Now)
```powershell
# Windows PowerShell
curl.exe -v https://queryme.in/smondoville/app

# If successful, you should see:
# < HTTP/1.1 200 OK
# or similar success/error response

# If it fails:
# curl: (7) Failed to connect to queryme.in port 443: Connection refused
```

### Step 2: Use New Test Button in App
The app now has a **"Test Connection"** button in the landing screen:
1. Rebuild app: `npm run android -- --clear`
2. Open app
3. Tap "Test Connection" button
4. Check the result alert
5. Check console logs with: `adb logcat | grep "\[Diagnostic\]"`

### Step 3: Check Device Network
```bash
# These commands test device connectivity
adb shell ping 8.8.8.8      # Basic internet test
adb shell ping queryme.in   # Specific domain test
adb shell curl https://queryme.in/smondoville/app  # Full request test
```

### Step 4: Review Logs
```bash
# Watch network diagnostics in real-time
adb logcat | grep -E "\[Network\]|\[Diagnostic\]"
```

---

## What the Logs Tell You

### All Attempts Fail Immediately
```
[Network] Attempt 1/3: Sending request to https://queryme.in/smondoville/app/text_query
[Network] Attempt 1/3 failed:
  - Error Name: TypeError
  - Error Message: Network request failed
```
**Diagnosis**: Device cannot reach the API endpoint

**Possible causes**:
1. API server is down
2. Device's network blocks the request
3. DNS cannot resolve queryme.in
4. Firewall blocking port 443

---

## Solutions to Try

### Solution 1: Verify Server is Running
From your PC:
```powershell
# Test if server responds
curl.exe https://queryme.in/smondoville/app

# If it times out or refuses connection, server might be down
# Contact the server administrator
```

### Solution 2: Check Device Network
```bash
# Check what DNS servers device is using
adb shell getprop net.dns1
adb shell getprop net.dns2

# Try changing DNS (on device Settings → WiFi → Advanced)
# Try: 8.8.8.8, 1.1.1.1, or 208.67.222.222
```

### Solution 3: Force WiFi Over Mobile Data
If testing on mobile data:
1. Go to device Settings
2. Turn OFF mobile data
3. Connect to WiFi
4. Test in app

(Different networks might have different firewall rules)

### Solution 4: Check Network Security Config
The file `android/app/src/main/res/xml/network_security_config.xml` should contain:
```xml
<domain-config>
  <domain includeSubdomains="true">queryme.in</domain>
  <trust-anchors>
    <certificates src="system"/>
    <certificates src="user"/>
  </trust-anchors>
</domain-config>
```

If missing or incorrect, the HTTPS connection will fail.

---

## Updated Features

### 1. Test Connection Button
New button in landing screen:
- Tap "Test Connection"
- Shows alert with result
- Logs detailed diagnostics

### 2. Enhanced Diagnostics
Console logs now include:
- `[Diagnostic]` prefix for connectivity tests
- Response times in milliseconds
- Error names and codes
- Helpful suggestions for network errors

### 3. Better Error Messages
App shows specific errors:
- ❌ Timeout (server slow)
- ❌ Network error (cannot reach server)
- ❌ Server error (5xx status)
- ❌ Request error (4xx status)

---

## Next Steps

1. **Rebuild app**:
   ```bash
   npm run android -- --clear
   ```

2. **Test from PC** (to verify server is reachable):
   ```powershell
   curl.exe -v https://queryme.in/smondoville/app
   ```

3. **Use Test Button in App**:
   - Open app
   - Tap "Test Connection"
   - Note the result

4. **Check Logs**:
   ```bash
   adb logcat | grep "\[Diagnostic\]"
   ```

5. **Report findings**:
   - Does PC test succeed or fail?
   - What does app's Test Connection button show?
   - What are the [Diagnostic] logs saying?

---

## Common Scenarios

### Scenario A: PC test works, phone test fails
**Diagnosis**: Network difference between PC and phone  
**Solution**: Check if phone is on WiFi vs mobile data, try different network

### Scenario B: Both PC and phone fail
**Diagnosis**: Server is unreachable  
**Solution**: Contact server admin, check if server is running

### Scenario C: Phone fails immediately, logs show "Network request failed"
**Diagnosis**: Network connectivity or DNS issue  
**Solution**: 
- Confirm device has internet (ping 8.8.8.8)
- Confirm DNS works (ping queryme.in)
- Try different WiFi/network

### Scenario D: Phone test passes, but send message fails
**Diagnosis**: Possible issue with specific endpoint  
**Solution**: Check logs, might be `/text_query` endpoint issue

---

## Contact Information

When contacting for support, provide:
1. PC test result: `curl.exe -v https://queryme.in/smondoville/app`
2. Phone test result: (from app's Test Connection button)
3. Device Android version: `adb shell getprop ro.build.version.release`
4. Network type: WiFi/Mobile data
5. Device logs: `adb logcat > debug_logs.txt`

---

## Technical Details

### Network Request Flow
```
Device → DNS lookup → queryme.in IP
     ↓
Device → HTTPS connection → queryme.in:443
     ↓
Device → Send POST request → /text_query
     ↓
Device ← Receive response ← Server
```

**If fails at DNS step**: `Network request failed` (DNS resolution)
**If fails at connection step**: `Network request failed` (connection refused)
**If fails at request step**: Usually HTTP error (5xx, 4xx)

### Current Retry Strategy
- Attempt 1: Immediate (0s)
- Attempt 2: Wait 1 second, then retry
- Attempt 3: Wait 2 more seconds, then retry
- Total: 3 seconds wait + response times

For "Network request failed", retries usually don't help because the underlying network issue persists.

---

**Status**: Ready to test with new diagnostics  
**Action Required**: Run app and use Test Connection button  
**Expected Result**: Clear indication of why connection is failing
