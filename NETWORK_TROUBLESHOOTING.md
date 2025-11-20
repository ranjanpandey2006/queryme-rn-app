# Network Troubleshooting Guide for QueryMe App

## Overview
This guide provides step-by-step instructions for diagnosing and resolving network connectivity issues in the QueryMe React Native app on Android devices.

## Current Implementation

### Network Configuration
- **API Endpoint**: `https://queryme.in/smondoville/app`
- **Request Timeout**: 30 seconds (increased from 15s for slower networks)
- **Retry Logic**: Up to 2 retries (3 total attempts) with exponential backoff (1s, 2s, 4s delays)
- **Network Security**: Android 9+ compliant with network_security_config.xml

### Network Security Config
Located at: `android/app/src/main/res/xml/network_security_config.xml`

**Features**:
- HTTPS connections to queryme.in and *.queryme.in (system + user certs)
- Cleartext HTTP allowed for development IPs (localhost, 10.0.2.2, 192.168.x.x)
- System and user certificate trust for maximum compatibility

## Troubleshooting Steps

### Step 1: Check Console Logs
Start monitoring logs with:
```bash
adb logcat | grep -i "\[Network\]\|\[Chat\]\|Error"
```

**What to look for**:
- `[Network] Attempt 1/3`: Initial connection attempt
- `[Network] Response received in XXXms`: Successful connection (check time)
- `[Network] timeout`: Request exceeded 30 second timeout
- `AbortError`: Network timeout occurred
- `Network error`: Device cannot reach server

### Step 2: Verify Device Network Connection
Test basic connectivity:
```bash
adb shell ping -c 3 8.8.8.8
```
Should see responses. If you get "Network unreachable", device has no internet.

### Step 3: Test DNS Resolution
Check if device can resolve queryme.in:
```bash
adb shell ping -c 3 queryme.in
```

**Possible outcomes**:
- ✅ **Success**: Device can reach the API server
- ❌ **"Unknown host"**: DNS cannot resolve queryme.in (network or ISP issue)
- ❌ **"Temporary failure"**: DNS temporarily unavailable

### Step 4: Test HTTPS Connection
Try direct HTTPS connection:
```bash
adb shell curl -v -k https://queryme.in/smondoville/app
```

**Expected**:
- Should return HTTPS response (200, 301, 404, or 500)
- SSL certificate should be validated

**Failure modes**:
- `Connection refused`: Server not running or firewall blocking
- `Connection timeout`: Network latency or firewall issue
- `SSL certificate problem`: Certificate validation failed

### Step 5: Test POST Request to API
Simulate the actual API call:
```bash
adb shell curl -X POST -H "Content-Type: application/json" \
  -d '{"text_input":"hello"}' \
  https://queryme.in/smondoville/app/text_query
```

### Step 6: Check Network Security Config
Verify the configuration is correct:
```bash
adb shell cat /data/data/com.obfy.myapp/files/network_security_config.xml
```

Or on device: Settings → Apps → App info → Network permissions

## Common Issues and Solutions

### Issue 1: "Network connection failed" on Android, works on web
**Cause**: Android network security policy stricter than web/desktop
**Solution**: Ensure network_security_config.xml is properly configured
```bash
# Verify the file exists
adb shell ls -la /data/app/com.obfy.myapp-*/base.apk
adb shell unzip -l /data/app/com.obfy.myapp-*/base.apk | grep network_security
```

### Issue 2: Timeout errors (AbortError)
**Cause**: Request takes longer than 30 seconds
**Solution**: 
- Check if network is very slow: `adb shell ping queryme.in` (check response time)
- Increase timeout further in apiConfig.ts: `timeoutMs: 45000`
- Check server logs for slow query processing

### Issue 3: "Unknown host" error
**Cause**: DNS cannot resolve queryme.in
**Solution**:
- Test: `adb shell nslookup queryme.in`
- Try alternative DNS: Device Settings → WiFi → Advanced → DNS
- Check if ISP blocks the domain (unlikely)
- Try IP address directly if DNS fails

### Issue 4: SSL Certificate errors
**Cause**: Certificate validation failed
**Solution**: Already configured in network_security_config.xml to trust user certificates
- Ensure certificate is properly installed on device
- App already trusts both system and user certificates

### Issue 5: Connection refused
**Cause**: Server unreachable or port blocked
**Solution**:
- Check if server is running: `curl https://queryme.in/smondoville/app` (from your PC)
- Check firewall/port blocking
- Verify endpoint URL is correct

## Performance Monitoring

### Response Time Breakdown
The console logs show request duration in milliseconds:
```
[Network] Response received in 245ms: Status 200
```

**Expected times**:
- ✅ **< 1 second**: Excellent (local/fast network)
- ✅ **1-3 seconds**: Good (normal internet)
- ⚠️ **3-10 seconds**: Slow (poor network, far server)
- ❌ **> 30 seconds**: Timeout (connection issue)

### Network Quality Indicators
- If most requests take 10+ seconds, network is poor (will timeout on slow devices)
- If responses vary wildly (100ms to 10s), connection is unstable
- If all requests timeout, server unreachable or firewall blocking

## Advanced Debugging

### Monitor All Network Traffic
```bash
adb shell tcpdump -i any -n "port 443" -w /sdcard/network.pcap
# Stop with Ctrl+C after reproducing issue
adb pull /sdcard/network.pcap
# Open in Wireshark on your PC
```

### Enable More Verbose Logging
In `app/index.tsx`, add detailed logging:
```typescript
console.log('[Chat] Full message context:', {
  inputLength: messageText.length,
  requestBody: {text_input: messageText},
  apiUrl: API_URL
});
```

### Test from Device Terminal
```bash
adb shell
# Now in device shell:
curl -v https://queryme.in/smondoville/app
```

## Rebuilding and Testing

After making changes:

```bash
# Clean build
npm run android -- --clear

# Or rebuild from Android Studio
cd android
./gradlew clean build
cd ..

# Run on device
npm run android
```

## Network Security Config Explanation

The `network_security_config.xml` tells Android which connections are allowed:

```xml
<!-- Allow cleartext (HTTP) for development -->
<domain-config cleartextTrafficPermitted="true">
  <domain>192.168.0.0</domain>
</domain-config>

<!-- HTTPS domains with certificate requirements -->
<domain-config>
  <domain>queryme.in</domain>
  <trust-anchors>
    <certificates src="system"/>    <!-- Trust built-in CAs -->
    <certificates src="user"/>      <!-- Trust user-installed certs -->
  </trust-anchors>
</domain-config>
```

## When to Contact Server Admin

If after all these steps the API still cannot be reached:
1. Confirm the server is running: `curl https://queryme.in/smondoville/app` (from PC on different network)
2. Check if server firewall allows requests from outside
3. Check if the API path is correct (`/text_query` endpoint exists)
4. Verify database connection on server side

## Quick Reference Checklist

- [ ] Device has internet (ping 8.8.8.8)
- [ ] Device can resolve DNS (ping queryme.in)
- [ ] Can reach API via HTTPS (curl test)
- [ ] POST endpoint working (send test JSON)
- [ ] network_security_config.xml in app
- [ ] AndroidManifest.xml references network config
- [ ] Internet permission in AndroidManifest.xml
- [ ] App rebuilt after changes
- [ ] Logs show retry attempts (check [Network] logs)
- [ ] Response times reasonable (< 30 seconds)

## Additional Resources

- [Android Network Security Configuration](https://developer.android.com/training/articles/security-config)
- [Debugging Network Issues in React Native](https://reactnative.dev/docs/debugging#chrome-developer-tools)
- [Axios/Fetch Timeout Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
