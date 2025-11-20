#!/bin/bash
# Quick Debugging Commands for QueryMe Network Issues
# Copy these commands into your terminal to quickly test various aspects

# ============================================
# BASIC CONNECTIVITY TESTS
# ============================================

# Test if device has internet at all
echo "=== Testing basic connectivity ==="
adb shell ping -c 3 8.8.8.8

# Test DNS resolution
echo "=== Testing DNS resolution ==="
adb shell ping -c 3 queryme.in

# ============================================
# API ENDPOINT TESTS
# ============================================

# Test HTTPS endpoint (verbose output)
echo "=== Testing HTTPS endpoint ==="
adb shell curl -v -k https://queryme.in/smondoville/app

# Test POST request to API
echo "=== Testing POST request ==="
adb shell curl -X POST -H "Content-Type: application/json" \
  -d '{"text_input":"test message"}' \
  https://queryme.in/smondoville/app/text_query

# ============================================
# LOGS AND MONITORING
# ============================================

# Monitor network-related logs in real-time
echo "=== Monitoring network logs (Ctrl+C to stop) ==="
adb logcat | grep -E "\[Network\]|\[Chat\]|error|Error|Network"

# Save logs to file for analysis
echo "=== Saving logs to file ==="
adb logcat > network_logs_$(date +%Y%m%d_%H%M%S).log

# Monitor only React Native warnings
echo "=== Monitoring React Native logs ==="
adb logcat "*:S" "ReactNative:V" "ReactNativeJS:V"

# ============================================
# NETWORK CONFIGURATION VERIFICATION
# ============================================

# Check if network_security_config is referenced
echo "=== Checking AndroidManifest.xml ==="
adb shell grep -i "networkSecurityConfig" /data/data/com.obfy.myapp/shared_prefs/*

# List all network-related files
echo "=== Finding network config files ==="
adb shell find /data/data/com.obfy.myapp -name "*network*" -o -name "*security*"

# ============================================
# PERFORMANCE MONITORING
# ============================================

# Check network latency
echo "=== Checking ping response times ==="
adb shell ping -c 10 queryme.in

# Get detailed connection info
echo "=== Connection details ==="
adb shell netstat | grep -i established

# ============================================
# REBUILD AND CLEAN
# ============================================

# Full clean rebuild
echo "=== Performing clean rebuild ==="
npm run android -- --clear

# Or alternative clean method
# cd android && ./gradlew clean && cd .. && npm run android

# ============================================
# DEVICE INFO
# ============================================

# Check Android version (important for network security policies)
echo "=== Android version ==="
adb shell getprop ro.build.version.release

# Check device network state
echo "=== Device network state ==="
adb shell dumpsys connectivity | grep -i "state\|wifi\|mobile"

# ============================================
# CERTIFICATE VERIFICATION
# ============================================

# Check if queryme.in certificate is trusted
echo "=== Checking certificate (requires openssl) ==="
openssl s_client -connect queryme.in:443 -showcerts

# ============================================
# TIPS
# ============================================
# 
# 1. Before testing: Make sure app is running and ready
#    - Run: npm run android
#
# 2. For continuous monitoring:
#    - Run: adb logcat | grep -E "\[Network\]|\[Chat\]"
#    - Then trigger the API call in app
#    - Watch the logs in real-time
#
# 3. If you see timeout errors:
#    - Check response times with: adb shell ping -c 20 queryme.in
#    - If ping times are > 5 seconds, that's your problem
#
# 4. If you see "Network error":
#    - Try the curl tests to isolate the problem
#    - Try from PC to confirm server is accessible
#
# 5. Save logs for debugging:
#    - Before testing: adb logcat -c (clear logs)
#    - Trigger error in app
#    - adb logcat > debug_logs.txt
#    - Share logs.txt for analysis
#
