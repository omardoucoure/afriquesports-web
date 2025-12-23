# YouTube Live Stream Integration - Complete Setup Guide

This guide explains how to integrate YouTube live streams and extract commentary from live chat for CAN 2025 matches.

## 📋 Overview

**New System:**
- ✅ YouTube live streams embedded directly on match pages
- ✅ AI commentary generated from YouTube live chat messages
- ✅ Real-time chat sentiment analysis
- ✅ Automatic discovery of live CAN 2025 matches on YouTube

**Replaces:**
- ❌ ESPN API for match detection
- ❌ Separate video hosting

## 🎯 Benefits

1. **Better User Experience**
   - Watch live match video directly on your site
   - No need to leave for external streams
   - Professional broadcasts from Channel 4, beIN Sports, etc.

2. **Richer Commentary**
   - Real fan reactions from live chat
   - Sentiment-driven commentary generation
   - More engaging and contextual

3. **Cost Savings**
   - YouTube API: FREE (1 million quota units/day)
   - No video hosting costs
   - Same RunPod costs ($0.41/hour)

## 🔧 Prerequisites

### 1. Get YouTube Data API Key

**Step 1:** Go to [Google Cloud Console](https://console.cloud.google.com/)

**Step 2:** Create a new project (or select existing)

**Step 3:** Enable YouTube Data API v3
```
APIs & Services → Library → Search "YouTube Data API v3" → Enable
```

**Step 4:** Create API Key
```
APIs & Services → Credentials → Create Credentials → API Key
```

**Step 5:** Restrict the API Key (recommended)
```
Edit API Key → API Restrictions → Restrict key → YouTube Data API v3
```

**Step 6:** Copy your API key (looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### 2. Update Environment Variables

Add to your `.env.local` (local) and Vercel/production:

```bash
# YouTube API
YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Existing variables
AI_AGENT_WEBHOOK_SECRET=53d94589c60800904ed55f45cddb8ef0f607fa7059da81db2a0453895a7946fd
VLLM_BASE_URL=http://194.68.245.75:8000/v1
VLLM_API_KEY=afrique-sports-70b-working
NEXT_PUBLIC_SITE_URL=https://www.afriquesports.net
```

## 🚀 Deployment Steps

### Step 1: Apply Database Migration ✅

Already applied! The `match_youtube_streams` table is ready.

Verify:
```bash
psql $POSTGRES_URL_NON_POOLING -c "SELECT COUNT(*) FROM match_youtube_streams;"
```

### Step 2: Deploy YouTube Agent to DigitalOcean

**Upload agent:**
```bash
scp scripts/deployment/youtube-commentary-agent.js root@159.223.103.16:/opt/afrique-sports-commentary/
```

**Update environment:**
```bash
ssh root@159.223.103.16

# Edit environment file
nano /opt/afrique-sports-commentary/.env
```

Add:
```bash
AI_AGENT_WEBHOOK_SECRET=53d94589c60800904ed55f45cddb8ef0f607fa7059da81db2a0453895a7946fd
YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VLLM_BASE_URL=http://194.68.245.75:8000/v1
VLLM_API_KEY=afrique-sports-70b-working
VLLM_MODEL=llama-3.1-70b
NEXT_PUBLIC_SITE_URL=https://www.afriquesports.net
CHECK_INTERVAL_SECONDS=60
```

**Create systemd service:**
```bash
nano /etc/systemd/system/youtube-commentary.service
```

Paste:
```ini
[Unit]
Description=YouTube Live Commentary Agent for CAN 2025
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/afrique-sports-commentary
ExecStart=/usr/bin/node /opt/afrique-sports-commentary/youtube-commentary-agent.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/youtube-commentary.log
StandardError=append:/var/log/youtube-commentary-error.log
EnvironmentFile=/opt/afrique-sports-commentary/.env

[Install]
WantedBy=multi-user.target
```

**Start the service:**
```bash
systemctl daemon-reload
systemctl enable youtube-commentary
systemctl start youtube-commentary
systemctl status youtube-commentary
```

**Monitor logs:**
```bash
tail -f /var/log/youtube-commentary.log
```

### Step 3: Stop Old ESPN Agent (Optional)

```bash
ssh root@159.223.103.16
systemctl stop afrique-sports-commentary
systemctl disable afrique-sports-commentary
```

### Step 4: Set YouTube Stream for Current Match

**Method A: Using API (Recommended)**

```bash
curl -X POST "https://www.afriquesports.net/api/match-youtube-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "732140",
    "youtube_video_id": "YOUTUBE_VIDEO_ID_HERE",
    "channel_name": "Channel 4 Sport",
    "video_title": "Tunisia vs Uganda LIVE | AFCON 2025",
    "is_live": true
  }'
```

**Method B: Direct Database Insert**

```bash
psql $POSTGRES_URL_NON_POOLING << EOF
INSERT INTO match_youtube_streams (match_id, youtube_video_id, channel_name, video_title, is_live)
VALUES ('732140', 'YOUTUBE_VIDEO_ID_HERE', 'Channel 4 Sport', 'Tunisia vs Uganda', true)
ON CONFLICT (match_id) DO UPDATE
SET youtube_video_id = EXCLUDED.youtube_video_id, updated_at = NOW();
EOF
```

## 🔍 How to Find YouTube Video IDs

### Option 1: Manual Search

1. Go to YouTube and search: "CAN 2025 Tunisia Uganda live"
2. Find the live stream (look for "LIVE" badge)
3. Copy the video ID from the URL:
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
                                   ^^^^^^^^^^^
                                   This is the ID
   ```

### Option 2: Automatic Discovery (Agent)

The agent will automatically find live streams! Just wait 60 seconds and check logs:

```bash
tail -f /var/log/youtube-commentary.log
```

You'll see:
```
🔍 Searching YouTube for live CAN 2025 matches...
   Found 1 live stream(s):
   - Tunisia vs Uganda LIVE | AFCON 2025 (Channel 4 Sport)
```

### Option 3: YouTube API Explorer

Use [YouTube API Explorer](https://developers.google.com/youtube/v3/docs/search/list):

**Parameters:**
- part: `snippet`
- eventType: `live`
- type: `video`
- q: `CAN 2025 Tunisia Uganda`

## 📺 Supported Channels

The agent searches these channels automatically:

**Free Streams:**
- Channel 4 Sport (UK) - YouTube channel
- beIN Sports (some regions)
- Official AFCON channels

**Paid/Geo-restricted:**
- beIN Sports (US/MENA)
- SuperSport (Africa)
- DSTV (South Africa)

## 🧪 Testing

### Test 1: Check YouTube Stream Display

Visit: `http://localhost:3000/can-2025/match/732140`

You should see:
- Video tab shows YouTube embed
- "EN DIRECT" badge (if stream is live)
- Autoplay enabled

### Test 2: Check Agent Logs

```bash
tail -50 /var/log/youtube-commentary.log
```

Expected:
```
🤖 YOUTUBE COMMENTARY AGENT STARTED
📺 Data Source: YouTube Live Streams
🔍 Searching YouTube for live CAN 2025 matches...
   Found 1 live stream(s):
   - Tunisia vs Uganda (Channel 4 Sport)
📺 Processing: Tunisia vs Uganda...
   Chat messages: 152
   💬 Generated: "Moment intense ! Les supporters tunisiens..."
✅ Commentary posted for match 732140
```

### Test 3: Check Live Chat Extraction

```bash
# Check if chat messages are being extracted
grep "Chat messages" /var/log/youtube-commentary.log
```

### Test 4: Verify Database

```bash
# Check streams table
psql $POSTGRES_URL_NON_POOLING -c "SELECT * FROM match_youtube_streams;"

# Check commentary from YouTube source
psql $POSTGRES_URL_NON_POOLING -c "SELECT time, text FROM match_commentary_ai WHERE match_id='732140' AND type='general' ORDER BY time_seconds DESC LIMIT 5;"
```

## 🛠️ Troubleshooting

### Agent Not Finding Streams

**Problem:** Logs show "No live streams found"

**Solutions:**
1. Check YouTube API key is valid
2. Verify match is actually live on YouTube
3. Try manual search on YouTube first
4. Check API quota: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas

### No Live Chat Messages

**Problem:** "Chat messages: 0"

**Possible Causes:**
- Stream has chat disabled
- Need to authenticate for private streams
- Chat not available yet (stream just started)

**Solution:** Agent will still work, will use video title/description for context

### YouTube Embed Not Showing

**Problem:** Video tab is empty

**Solutions:**
1. Check match has YouTube stream in database
2. Verify video ID is correct (11 characters)
3. Check browser console for iframe errors
4. Try different video ID format

### API Quota Exceeded

**Problem:** Error 403 "quotaExceeded"

**Solution:**
```
Each search = 100 units
Daily limit = 10,000 units (free tier)
= 100 searches/day

Recommendation:
- Reduce search frequency to every 5 minutes
- Use fewer search queries
- Request quota increase from Google
```

## 📊 System Architecture

```
┌─────────────────┐
│  YouTube API    │ (Search for live CAN 2025)
│   (Free)        │
└────────┬────────┘
         │
         │ Every 60s
         ▼
┌─────────────────────────┐
│ YouTube Commentary Agent │
│  (DigitalOcean Server)   │
└───┬──────────────────┬──┘
    │                  │
    │ Extract chat     │ Generate
    │ messages         │ commentary
    ▼                  ▼
┌──────────────┐  ┌──────────────┐
│ YouTube      │  │ RunPod vLLM  │
│ Live Chat    │  │ Llama 3.1    │
│              │  │ 70B Model    │
└──────────────┘  └──────┬───────┘
                         │
                         │ Post
                         ▼
                  ┌──────────────┐
                  │   Supabase   │
                  │   Database   │
                  └──────┬───────┘
                         │
                         │ Display
                         ▼
                  ┌──────────────┐
                  │  Next.js Web │
                  │  + YouTube   │
                  │  Embed       │
                  └──────────────┘
```

## 💰 Cost Breakdown

| Service | Usage | Cost |
|---------|-------|------|
| YouTube API | 100 searches/day | **FREE** (within quota) |
| RunPod vLLM | 90 hours/month | $36.90/month |
| Supabase | Within limits | **FREE** |
| DigitalOcean | Existing server | $0 (already paid) |
| **TOTAL** | | **$36.90/month** |

**Savings vs ESPN approach:** YouTube is FREE!

## 🎉 Success Checklist

- [x] YouTube Data API enabled
- [x] API key obtained and set in environment
- [x] Database migration applied
- [ ] YouTube agent deployed to DigitalOcean
- [ ] Agent service running (`systemctl status youtube-commentary`)
- [ ] Logs showing successful YouTube searches
- [ ] Live chat extraction working
- [ ] Commentary being generated and posted
- [ ] YouTube embed showing on match pages
- [ ] Live stream playing with commentary

## 📞 Support

**YouTube API Issues:**
- Quota problems: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
- API documentation: https://developers.google.com/youtube/v3

**Agent Issues:**
- Check logs: `/var/log/youtube-commentary.log`
- Restart: `systemctl restart youtube-commentary`

## 🔄 Migration from ESPN

If switching from ESPN-based agent:

1. Stop ESPN agent: `systemctl stop afrique-sports-commentary`
2. Start YouTube agent: `systemctl start youtube-commentary`
3. Disable ESPN agent: `systemctl disable afrique-sports-commentary`
4. Keep logs for debugging: `mv /var/log/afrique-sports-commentary.log /var/log/afrique-sports-commentary-espn-backup.log`

---

**Sources:**
- [How to watch AFCON 2025](https://www.tomsguide.com/entertainment/sports/how-to-watch-afcon-2025-on-channel-4-its-free)
- [Tunisia vs Uganda streaming info](https://www.fourfourtwo.com/competition/is-tunisia-vs-uganda-on-tv-live-streams-preview-and-how-to-watch-the-afcon-clash-from-anywhere)
- [AFCON 2025 free streams guide](https://www.techradar.com/how-to-watch/football/africa-cup-of-nations-2025-free-afcon)

**Ready for CAN 2025 with YouTube integration! 🎥⚽**
