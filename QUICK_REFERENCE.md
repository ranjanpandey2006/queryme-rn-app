# QueryMe App - Network Fix Quick Reference Card

## 🎯 Quick Start (Copy & Paste)

### Terminal 1: Rebuild App
```bash
npm run android -- --clear
```

### Terminal 2: Monitor Logs
```bash
adb logcat | grep -E "\[Network\]\|\[Chat\]"
```

### In App
1. Type message
2. Tap Send
3. Watch logs

---

## 📊 What You'll See

### Success ✅
```
[Chat] API Request: {...}
[Network] Attempt 1/3: Sending request to https://queryme.in/smondoville/app
[Network] Response received in 245ms: Status 200
[Chat] Response data received successfully
```
→ Message reply appears in chat in < 1 second

### With Retry (Also Good) ✅
```
[Network] Attempt 1/3: Sending request...
[Network] Request timeout after 30000ms - attempt 1/3
[Network] Retrying in 1000ms... (exponential backoff)
[Network] Attempt 2/3: Sending request...
[Network] Response received in 150ms: Status 200
```
→ Message reply appears in chat after ~1 second delay

### Error ❌
```
[Network] Attempt 1/3: Sending request...
[Network] Attempt 2/3: Sending request...
[Network] Attempt 3/3: Sending request...
[Network] All 3 attempts failed. Throwing error.
[Chat] Error occurred:
  - Name: [Error Type]
  - Message: [Error Details]
```
→ Error message appears in chat (see troubleshooting below)

---

## 🔧 Troubleshooting One-Liners

### Test 1: Device Has Internet?
```bash
adb shell ping 8.8.8.8
```
**Should see**: "64 bytes from 8.8.8.8" (repeat 3x)  
**If fails**: Device offline or no internet

### Test 2: Can Reach API?
```bash
adb shell ping queryme.in
```
**Should see**: "bytes from [IP]" (repeat 3x)  
**If fails**: DNS issue or server unreachable

### Test 3: HTTPS Works?
```bash
adb shell curl -v https://queryme.in/smondoville/app
```
**Should see**: "HTTP/1.1 200 OK" or similar  
**If fails**: Certificate or network issue

### Test 4: POST Request Works?
```bash
adb shell curl -X POST -H "Content-Type: application/json" \
  -d '{"text_input":"test"}' \
  https://queryme.in/smondoville/app/text_query
```
**Should see**: JSON response with "reply" field  
**If fails**: API endpoint issue

---

## 📋 Error Decision Tree

```
See AbortError in logs?
├─ YES → Timeout (network slow)
│  └─ Run: adb shell ping -c 10 queryme.in
│
See "Network request failed"?
├─ YES → Device can't reach API
│  └─ Run: adb shell ping 8.8.8.8
│
See "HTTP 5xx"?
├─ YES → Server error
│  └─ Run from PC: curl https://queryme.in/smondoville/app
│
See "HTTP 4xx"?
├─ YES → Client error (unusual)
│  └─ Check request format is correct
│
Still stuck?
└─ Read: NETWORK_TROUBLESHOOTING.md
```

---

## 🎯 Response Time Guide

| Time | Quality | Action |
|------|---------|--------|
| < 1 sec | Excellent | ✅ All good |
| 1-3 sec | Good | ✅ Normal |
| 3-10 sec | Slow | ⚠️ May retry |
| 10-30 sec | Very Slow | ⚠️ May timeout |
| > 30 sec | Timeout | ❌ Retry |

Check with: `adb shell ping queryme.in`

---

## 🔄 Retry Strategy Diagram

```
Attempt 1: t=0s
├─ Success? → ✅ DONE
└─ Fail? → Wait 1s

Attempt 2: t=1s
├─ Success? → ✅ DONE
└─ Fail? → Wait 2s

Attempt 3: t=3s
├─ Success? → ✅ DONE
└─ Fail? → ❌ ERROR

Max Total Time: 3 seconds (successful) or ~95 seconds (all timeouts)
```

---

## 📱 Log Prefixes

| Prefix | Meaning | Example |
|--------|---------|---------|
| `[Network]` | Low-level network ops | Attempt, timeout, response |
| `[Chat]` | App-level chat ops | API request, data received |
| `ERROR` | Error occurred | Error name, message |

**Filter for debugging:**
```bash
adb logcat | grep "\[Network\]"     # Network only
adb logcat | grep "\[Chat\]"        # Chat only
adb logcat | grep -i error          # Errors only
```

---

## 🛠️ Common Fix Commands

### Rebuild App
```bash
npm run android -- --clear
```

### Clear Build Cache
```bash
cd android && ./gradlew clean && cd ..
```

### Check Device Connected
```bash
adb devices
```

### Save Logs to File
```bash
adb logcat > logs_$(date +%Y%m%d_%H%M%S).log
```

### Monitor Specific Device
```bash
adb -s <device_id> logcat | grep "\[Network\]"
```

---

## 📊 Status Codes Explained

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | ✅ Return response |
| 429 | Rate Limited | ⏳ Wait & retry |
| 400-499 | Client Error | ❌ Don't retry |
| 500-599 | Server Error | 🔄 Retry |
| Timeout | No Response | 🔄 Retry |
| Network Error | No Connection | 🔄 Retry |

---

## 🎯 Expected Behavior

### First Message
- Takes ~1-3 seconds
- Should succeed on first attempt
- Look for: `[Network] Response received`

### Slow Network
- Might timeout on attempt 1
- Automatically retries
- Look for: `[Network] Retrying in XXXms`

### All Attempts Fail
- After ~3-5 seconds
- Shows error message in chat
- Look for: `[Network] All 3 attempts failed`

### Server Down
- Fails quickly (< 1 second)
- HTTP 500/502/503 error
- Look for: `[Network] Response received in XXXms: Status 500`

---

## 🔍 Best Debugging Setup

### Terminal 1: Logs
```bash
adb logcat | grep -E "\[Network\]\|\[Chat\]\|Error" | tee logs.txt
```
(Tee saves to file + shows on screen)

### Terminal 2: Quick Tests
```bash
# Keep ready to run:
adb shell ping 8.8.8.8
adb shell ping queryme.in
adb shell curl -v https://queryme.in/smondoville/app
```

### Terminal 3: Device Control
```bash
adb shell
# Now you can run commands directly on device
# Type: exit to return
```

---

## ✅ Pre-Testing Checklist

- [ ] Device connected: `adb devices`
- [ ] Device has internet (check WiFi/mobile)
- [ ] Storage available (rebuild ~500MB)
- [ ] No other builds running
- [ ] Terminal ready for logs
- [ ] App can be restarted
- [ ] Patience (rebuild takes 2-3 min)

---

## 🚀 Start Here

1. **Open Terminal 1:**
   ```bash
   npm run android -- --clear
   ```

2. **While rebuilding, open Terminal 2:**
   ```bash
   adb logcat | grep -E "\[Network\]\|\[Chat\]"
   ```

3. **When app appears:**
   - Type message: "Hello"
   - Tap Send
   - Watch Terminal 2 for logs

4. **Interpret results:**
   - ✅ See `Response received` = Success!
   - ❌ See error? Check the error decision tree above

---

## 📞 Quick Help

**App won't rebuild?**
- Ensure device connected: `adb devices`
- Clear cache: `cd android && ./gradlew clean && cd ..`
- Try again: `npm run android`

**Can't see logs?**
- Check filter: `adb logcat | grep "\[Network\]"`
- Use simpler filter: `adb logcat | grep -i network`
- Save to file: `adb logcat > all_logs.txt`

**Specific error?**
- See: Error Decision Tree (above)
- Or: NETWORK_TROUBLESHOOTING.md (full guide)

**Want detailed info?**
- See: README_NETWORK_FIX.md (overview)
- See: NETWORK_ENHANCEMENTS.md (technical)
- See: NEXT_STEPS.md (detailed testing)

---

## 🎯 Success Criteria

After rebuilding and testing:

✅ **Success** = Message sent → Reply received in 1-3 seconds
✅ **Retry** = Message sent → After 1-2 sec delay → Reply received
✅ **Error** = Message sent → Clear error message appears
❌ **Failure** = App crashes or hangs indefinitely

Any of the first 3 = Fix is working correctly!

---

## 🎓 What Changed

### Before
- 1 attempt, failure = permanent error
- Generic "Network connection failed"
- No visibility into what's happening
- Hard to debug on real devices

### After
- 3 attempts with smart retry
- Clear error messages ("timeout", "network error", etc.)
- Detailed logs showing each attempt
- Easy to diagnose with tools provided

### Result
Better user experience + easier debugging! 🎉

---

**Print this card and keep it handy while testing!**

*For detailed guides, see: NEXT_STEPS.md*
