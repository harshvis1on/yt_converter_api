# New Onboarding Flow Architecture

## Overview
The new onboarding flow splits the podcast creation process into two steps with a user form in between, giving users control over their podcast details while still automating data fetching.

## Flow Steps

### 1. Google OAuth + YouTube Data Fetch
**Route:** `/auth` → **n8n Workflow:** `1-youtube-channel-sync.json`

- User signs in with Google OAuth
- App fetches YouTube channel data and videos
- **n8n workflow stops at data formatting** (no podcast creation yet)
- Returns: `channel`, `videos`, `prefillData` for form

```javascript
// n8n Response
{
  success: true,
  channel: { id, title, description, subscriberCount, videoCount },
  videos: [...videoList],
  prefillData: {
    title: channelTitle,
    description: channelDescription,
    author: channelTitle,
    language: 'en',
    primaryCategory: 'Technology',
    explicit: 'clean',
    podcastType: 'serial'
  }
}
```

### 2. Podcast Creation Form
**Route:** `/create-podcast` → **Component:** `PodcastCreationForm.jsx`

- Form is pre-filled with YouTube channel data
- User can customize all podcast attributes:
  - Title, Description, Author
  - Language, Categories (Primary/Secondary)  
  - Explicit rating, Podcast type
- User has full control over final podcast details

### 3. Podcast Creation
**Action:** Form Submit → **n8n Workflow:** `5-create-podcast.json`

- Takes user's form data and creates podcast on Megaphone
- Saves podcast to Supabase database
- Returns podcast ID and complete podcast object

### 4. Dashboard
**Route:** `/dashboard`

- User lands on dashboard with completed podcast
- Can now manage episodes and view analytics

## Architecture Benefits

### ✅ **User Control**
- Users can customize podcast details before creation
- No more auto-generated titles that users don't like
- Professional podcast setup with proper categories

### ✅ **Better UX**
- Clear progression: Auth → Data → Form → Creation → Dashboard
- User sees exactly what will be created before submission
- Form validation ensures quality podcast metadata

### ✅ **Cleaner Code**
- Separated data fetching from podcast creation
- Two focused n8n workflows instead of one complex one
- Frontend components have single responsibilities

### ✅ **Easier Debugging**
- Can test data fetching separately from podcast creation
- Clear error boundaries at each step
- User can retry form submission without re-fetching data

## n8n Workflows

### Workflow 1: YouTube Data Fetch (`1-youtube-channel-sync.json`)
```
Webhook → Get Channel → Get Videos → Format Data → Return to Frontend
```

### Workflow 2: Create Podcast (`5-create-podcast.json`)
```
Webhook → Prepare Data → Create Megaphone Podcast → Save to Supabase → Return Success
```

## Frontend Components

### Updated Components
- **`GoogleAuth.jsx`** - Now stops at data fetch, redirects to form
- **`PodcastCreationForm.jsx`** - New comprehensive form component
- **`PodcastCreationFlow.jsx`** - Wrapper that handles form submission
- **`App.jsx`** - Added `/create-podcast` route

### Data Flow
```javascript
// Step 1: After OAuth
localStorage.setItem('channelData', JSON.stringify(result.channel));
localStorage.setItem('videosData', JSON.stringify(result.videos));
localStorage.setItem('prefillData', JSON.stringify(result.prefillData));

// Step 2: After podcast creation
localStorage.setItem('podcastId', result.podcastId);
localStorage.setItem('podcastData', JSON.stringify(result.podcast));
```

## Environment Setup

### Required Environment Variables
```bash
# n8n instance
REACT_APP_N8N_BASE_URL=https://your-n8n-instance.com

# Development mode (enables mock responses)
REACT_APP_DEV_MODE=true
```

### n8n Environment Variables
```bash
# Megaphone API
MEGAPHONE_API_TOKEN=your_token_here
MEGAPHONE_NETWORK_ID=your_network_id

# Supabase (for podcast storage)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

## Testing

The new flow includes comprehensive mock responses for development:

```bash
# Test the frontend with mock responses
npm start
# Navigate through: /auth → /create-podcast → /dashboard
```

Mock responses simulate:
- ✅ YouTube channel data with realistic content
- ✅ Podcast creation with generated ID
- ✅ Error handling and validation

## Migration from Old Flow

### What Changed
- **Before:** Single workflow created podcast automatically
- **After:** Two workflows with user form in between

### What's Removed
- Auto-generated podcast titles
- Hardcoded categories and descriptions  
- Complex fallback logic in single workflow

### What's Added
- User podcast customization form
- Better error handling and validation
- Cleaner separation of concerns
- Professional podcast metadata collection

## Next Steps

1. **Set up n8n instance** (cloud or self-hosted)
2. **Import both workflow JSON files** into n8n
3. **Configure n8n environment variables** (Megaphone, Supabase)
4. **Update frontend environment** with n8n webhook URLs
5. **Test complete flow** from auth to dashboard

The new architecture provides better user experience while maintaining the automation benefits of n8n workflows.