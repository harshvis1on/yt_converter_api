# 🛠️ Testing Commands & Setup

## Start Testing Environment

### **1. Clear Browser State (Fresh User)**
```javascript
// Run in browser console to simulate new user
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### **2. Start Development Server**
```bash
cd "/Users/harshdeshmukh/YouTube To Mp4 Links"
PORT=3001 npm start
```

### **3. Monitor Real-Time Logs**
```bash
# Keep this terminal open during testing
cd "/Users/harshdeshmukh/YouTube To Mp4 Links"
tail -f *.log 2>/dev/null || echo "No log files found - check browser console instead"
```

## Test User Scenarios

### **Scenario A: Brand New User**
```javascript
// Clear everything
localStorage.clear();
// Navigate to http://localhost:3001
// Follow complete signup flow
```

### **Scenario B: Returning User** 
```javascript
// Keep user_info and google_token
localStorage.removeItem('onboardingCompleted');
localStorage.removeItem('currentPodcast');
// Navigate to http://localhost:3001
// Should trigger login sync
```

### **Scenario C: Existing User with Podcast**
```javascript
// Keep all data intact
// Navigate to http://localhost:3001
// Should go directly to dashboard
```

## Debug Commands

### **Check Current State**
```javascript
// Run in browser console
console.log('Auth State:', {
  token: !!localStorage.getItem('google_token'),
  user: !!localStorage.getItem('user_info'),
  podcast: !!localStorage.getItem('currentPodcast'),
  onboarding: localStorage.getItem('onboardingCompleted')
});
```

### **Check Network Requests**
```javascript
// Monitor n8n API calls
// Open Network tab in dev tools
// Filter by: n8n-6s78.onrender.com
// Watch for: user-setup, youtube-sync, create-podcast calls
```

### **Force Refresh Data**
```javascript
// Force refresh podcast data
if (window.usePodcastData && window.usePodcastData.refreshPodcasts) {
  window.usePodcastData.refreshPodcasts();
}
```

## Expected API Calls During Testing

### **New User Flow**:
1. `POST /webhook/user-setup` - Setup user in n8n
2. `POST /webhook/youtube-sync` - Fetch YouTube data
3. `POST /webhook/create-podcast` - Create podcast

### **Returning User Flow**:  
1. `POST /webhook/sync-podcast-data` - Sync podcast data
2. `POST /webhook/sync-megaphone-episodes` - Sync episodes (if triggered)

### **Episode Creation Flow**:
1. `POST /webhook/create-episodes` - Create episodes
2. `POST /webhook/sync-megaphone-episodes` - Auto-sync after creation

## Test Data to Verify

### **After Signup**:
```javascript
// Check these exist
localStorage.getItem('user_info')        // User profile
localStorage.getItem('channelData')      // YouTube channel
localStorage.getItem('currentPodcast')   // Created podcast
localStorage.getItem('onboardingCompleted') // 'true'
```

### **After Login**:
```javascript
// Should see these console messages
"✅ User already signed in, syncing podcast data"
"🔄 syncPodcastDataFromMegaphone called"  
"✅ Podcast data synced on login"
```

### **After Episode Creation**:
```javascript
// Should see these console messages
"Creating X episodes and saving to database..."
"✅ X/X episodes created and saved to database!"
"🔄 Episodes created, refreshing data..."
```

## Troubleshooting Commands

### **If Stuck in Auth Loop**:
```javascript
localStorage.clear();
location.href = '/auth';
```

### **If n8n Calls Failing**:
```javascript
// Check n8n configuration
console.log('N8N Config:', {
  baseUrl: process.env.REACT_APP_N8N_BASE_URL,
  devMode: process.env.REACT_APP_DEV_MODE
});
```

### **If TypeScript Errors**:
```bash
cd "/Users/harshdeshmukh/YouTube To Mp4 Links"
npm run build
# Should complete without errors
```

### **Check Supabase Connection**:
```javascript
// Test Supabase connection
import { supabase } from './src/services/supabase';
supabase.from('podcasts').select('count').then(console.log);
```

## Performance Monitoring

### **Key Metrics to Watch**:
- OAuth response time (< 3 seconds)
- YouTube sync time (< 10 seconds)  
- Podcast creation time (< 15 seconds)
- Page navigation time (< 1 second)
- Database queries (< 2 seconds)

### **Memory Usage**:
```javascript
// Check for memory leaks
performance.memory && console.log({
  used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
  total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB'
});
```

Ready to test! Let me know what you discover during the flow testing.