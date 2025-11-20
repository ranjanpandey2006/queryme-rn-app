# Network Troubleshooting Guide

## Current Error: "TypeError: Network request failed"

This error typically means one of the following:

### 1. **API Endpoint Issue**
- The API URL `https://queryme.in/smondoville/app` may not be reachable
- Check if the server is running and accessible
- Test from your development machine: `curl https://queryme.in/smondoville/app/text_query`

### 2. **Network Configuration**

#### For Physical Android Device:
```bash
# Verify device can access the network
adb shell ping 8.8.8.8

# Check device network info
adb shell ip route
adb shell getprop ro.kernel.qemu
```

#### For Emulator:
```bash
# The special IP 10.0.2.2 refers to the host machine
# Update API_URL to: http://10.0.2.2:5500 (if backend is on host)
```

### 3. **SSL/TLS Certificate Issues**
- If using HTTPS, verify the certificate is valid
- Check if the domain has a valid SSL certificate
- Our network_security_config.xml should handle this, but verify:

```bash
adb shell "openssl s_client -connect queryme.in:443"
```

### 4. **Firewall/Network Restrictions**
- Check if your firewall is blocking requests
- Verify your network allows HTTPS traffic (port 443)
- Some networks block certain ports or require proxies

## Debugging Steps

### Step 1: Check Connectivity
```bash
# From device shell
adb shell
ping 8.8.8.8          # Test public internet
ping queryme.in       # Test DNS resolution
```

### Step 2: Check Logs in Real-time
```bash
# Monitor all network-related logs
adb logcat | grep -E "Network|Fetch|http|timeout"

# Monitor specific app logs
adb logcat | grep "myApp"
```

### Step 3: Test API Directly
From your computer:
```bash
curl -X POST https://queryme.in/smondoville/app/text_query \
  -H "Content-Type: application/json" \
  -d '{"text_input": "test"}'
```

## Solutions

### Solution 1: Update API Configuration
Edit `utils/apiConfig.ts`:
```typescript
export const API_CONFIG = {
  production: 'https://queryme.in/smondoville/app',
  development: 'http://192.168.29.169:5500', // Your local IP
};
```

### Solution 2: Use Local Backend
If you have a local backend running on port 5500:
```typescript
const API_URL = 'http://10.0.2.2:5500'; // For emulator
// or
const API_URL = 'http://192.168.x.x:5500'; // Your actual network IP
```

### Solution 3: Enable Cleartext Traffic
If using HTTP (already done in network_security_config.xml for localhost):
```xml
<domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">192.168.29.169</domain>
</domain-config>
```

### Solution 4: Increase Timeout
The app currently uses a 20-second timeout. If your API is slow:
```typescript
const response = await fetchWithTimeout(url, options, 30000); // 30 seconds
```

## Common Issues and Fixes

| Issue | Solution |
|-------|----------|
| "Network request failed" | Check if device has internet, verify API endpoint |
| Timeout errors | Increase timeout value, check server performance |
| SSL certificate error | Verify HTTPS is properly configured |
| Can't resolve domain | Check DNS settings on device: `adb shell getprop net.dns1` |
| Connection refused | Verify server is running and port is correct |

## Recommended Workflow

1. **Test API from browser** (web version works, so API is likely fine)
2. **Check device network** - ping public DNS
3. **Check logs** - real-time monitoring with adb logcat
4. **Test with simplified endpoint** - try a public API first
5. **Rebuild app** - after any configuration changes: `npm run android`

## Files Modified

- `android/app/src/main/res/xml/network_security_config.xml` - Network security
- `android/app/src/main/AndroidManifest.xml` - References security config
- `utils/apiConfig.ts` - Centralized API configuration
- `app/index.tsx` - Enhanced error logging

## Next Steps

1. Run `adb logcat` in one terminal
2. Try to send a message in the app
3. Look for detailed error messages in the logs
4. Share the specific error from logcat for more targeted help
