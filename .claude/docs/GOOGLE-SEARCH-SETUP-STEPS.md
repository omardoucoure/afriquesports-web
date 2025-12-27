# Google Custom Search Engine - Setup Steps

**Status**: ✅ API Key Configured | ⏳ Search Engine ID Needed

## Current Status

✅ **API Key**: Configured in `.env.local`
- Key: `AIzaSyAMp1MfZiwDoPo8WTkxnyCMky46Cy69pws`

⏳ **Custom Search Engine ID**: Not yet configured
- You need to create this (takes 2 minutes)

## Step-by-Step Guide

### Step 1: Go to Google Programmable Search Engine

Open this link: **https://programmablesearchengine.google.com/**

(Sign in with your Google account if needed)

### Step 2: Create New Search Engine

Click the **"Add"** or **"New search engine"** button

### Step 3: Configure Your Search Engine

Fill in the form:

**1. Name your search engine:**
```
Afrique Sports Team Search
```

**2. What to search:**
Select: **"Search the entire web"**
(Do NOT limit to specific sites)

**3. Language (optional):**
Select: **French** (or leave as default)

### Step 4: Create

Click **"Create"** button

### Step 5: Get Your Search Engine ID

After creation, you'll see your new search engine.

1. Click on the search engine name
2. Look for **"Search engine ID"** or **"Engine ID"**
3. It looks like: `a1b2c3d4e5f6g7h8i` (alphanumeric string)
4. **Copy this ID**

### Step 6: Add to Your Configuration

Run this command (replace `your-cx-id` with the ID you copied):

```bash
cd "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web"

echo 'GOOGLE_SEARCH_ENGINE_ID=your-cx-id-here' >> .env.local
```

**Example:**
```bash
echo 'GOOGLE_SEARCH_ENGINE_ID=a1b2c3d4e5f6g7h8i' >> .env.local
```

### Step 7: Verify Configuration

```bash
cd "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web"

# Check both variables are set
grep "GOOGLE_SEARCH" .env.local
```

You should see:
```
GOOGLE_SEARCH_API_KEY=AIzaSyAMp1MfZiwDoPo8WTkxnyCMky46Cy69pws
GOOGLE_SEARCH_ENGINE_ID=a1b2c3d4e5f6g7h8i
```

### Step 8: Test Web Search

```bash
cd "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web"

# Generate pre-match with web search
node scripts/ai/generate-prematch-with-search.js 732149 "Benin" "Botswana"
```

You should see:
```
1. Searching web for team information...
   Searching: Benin forme récente...
   ✅ Found 3 results
   Searching: Botswana forme récente...
   ✅ Found 3 results
   ...
```

(Instead of "⚠️ No Google Search API configured, using mock data")

## Quick Reference

### What You Need

| Item | Status | Value |
|------|--------|-------|
| API Key | ✅ Configured | `AIzaSy...pws` |
| Search Engine ID | ⏳ Needed | Get from https://programmablesearchengine.google.com/ |

### Environment Variables

Add to `.env.local`:

```bash
# Google Custom Search API
GOOGLE_SEARCH_API_KEY=AIzaSyAMp1MfZiwDoPo8WTkxnyCMky46Cy69pws
GOOGLE_SEARCH_ENGINE_ID=your-cx-id-here  # ← You need to add this
```

## What This Enables

Once configured, the pre-match generator will:

1. **Search Google** for real-time information:
   - Team recent form
   - Head-to-head history
   - Key players
   - Latest news

2. **Provide context** to the AI model

3. **Generate better analysis** based on current data

## Pricing

- **Free**: 100 searches/day
- **Paid**: $5 per 1,000 additional queries

For AFCON (50 matches × 5 searches = 250 total): **FREE**

## Troubleshooting

### Can't Find Search Engine ID?

1. Go to https://programmablesearchengine.google.com/
2. Click on your search engine name
3. Click "Setup" or "Overview"
4. Look for "Search engine ID" or copy from the URL: `cx=YOUR_ID_HERE`

### Search Returns No Results?

1. Make sure "Search the entire web" is enabled
2. Check your search engine is active
3. Verify API key hasn't exceeded quota

### Still Getting Mock Data?

Check environment variables are loaded:
```bash
node -e "console.log('API Key:', process.env.GOOGLE_SEARCH_API_KEY ? 'SET' : 'NOT SET')"
node -e "console.log('Engine ID:', process.env.GOOGLE_SEARCH_ENGINE_ID ? 'SET' : 'NOT SET')"
```

If "NOT SET", make sure you're running from the project directory where `.env.local` exists.

## Next Steps

1. ✅ API Key configured
2. ⏳ **Create Custom Search Engine** (do this now - takes 2 minutes)
3. ⏳ Add Search Engine ID to `.env.local`
4. ⏳ Test web search functionality
5. ⏳ Generate better pre-match analysis with real data!

## Visual Guide

```
You are here:
  ✅ Google Cloud Project (has API key)
  ⏳ Custom Search Engine (need to create)
     ↓
  Create at: programmablesearchengine.google.com
     ↓
  Get: Search Engine ID (cx parameter)
     ↓
  Add to: .env.local
     ↓
  ✅ Web search enabled!
```

---

**Ready?** Go to https://programmablesearchengine.google.com/ and create your search engine now!
