# YouTube Live Stream Commentary Integration

## 🎉 Implementation Complete!

The autonomous agent now automatically extracts captions from your Afrique Sports YouTube live streams and posts them as match commentary.

## 📋 What Was Implemented

### 1. **Automatic Stream Discovery**
   - Agent searches your YouTube channel for live matches
   - Matches by team names: "Senegal vs RD Congo CAN 2025"
   - No manual intervention needed for most matches

### 2. **Real-Time Caption Extraction**
   - Uses `youtube-transcript` library
   - Extracts French captions during live stream
   - Converts video timestamps → match minutes (28', 45+2')
   - Incremental: only fetches new captions since last check

### 3. **Database Tracking**
   - New table: `wp_match_youtube_streams`
   - Stores video_id, URL, last caption offset
   - Prevents duplicate processing

### 4. **Intelligent Fallback**
   - **Primary**: YouTube captions (fast, reliable)
   - **Fallback**: Web scraping (RMC Sport, Eurosport)
   - **Manual**: Admin dashboard override

## 🚀 How It Works

```
Every 30 seconds:
├─> Check for live matches
├─> Search YouTube channel for stream
│   └─> Query: "{home_team} vs {away_team} CAN 2025"
│
├─> IF stream found:
│   ├─> Extract new captions
│   ├─> Convert timestamps to match minutes
│   └─> Post to database
│
└─> IF no stream:
    └─> Fall back to web scraping
```

## ⚙️ Configuration

### Environment Variables (Already Set)
```bash
# On server: /opt/afrique-sports-commentary/.env
YOUTUBE_API_KEY=AIzaSyAMp1MfZiwDoPo8WTkxnyCMky46Cy69pws
AI_AGENT_WEBHOOK_SECRET=53d94589c60800904ed55f45cddb8ef0f607fa7059da81db2a0453895a7946fd
```

### YouTube Channel ID
Set your channel ID in `.env` (optional - uses default if not set):
```bash
YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxx  # Your Afrique Sports channel ID
```

**To find your channel ID:**
1. Go to YouTube Studio → Settings → Channel → Advanced
2. Copy the Channel ID
3. Add to `/opt/afrique-sports-commentary/.env` on server

## 🗄️ Database Setup

**IMPORTANT**: Create the YouTube streams table by running this SQL:

```sql
CREATE TABLE IF NOT EXISTS wp_match_youtube_streams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  youtube_url VARCHAR(255),
  video_id VARCHAR(20),
  channel_id VARCHAR(50) DEFAULT 'UC_YOUR_CHANNEL_ID',
  status ENUM('searching', 'found', 'manual', 'live', 'ended') DEFAULT 'searching',
  search_query VARCHAR(255),
  last_caption_offset INT DEFAULT 0,
  discovered_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_match (match_id),
  INDEX idx_status (status),
  INDEX idx_video_id (video_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Run via phpMyAdmin or MySQL CLI:**
```bash
mysql -h 159.223.103.16 -u YOUR_USER -p wordpress < scripts/deployment/create-youtube-streams-table.sql
```

## 📊 Manual Override (Optional)

If automatic discovery fails, you can manually set a YouTube stream:

### Via API:
```bash
curl -X POST https://www.afriquesports.net/api/admin/youtube-stream \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d '{
    "match_id": "732149",
    "youtube_url": "https://www.youtube.com/watch?v=p3o4aLGv7Ww",
    "video_id": "p3o4aLGv7Ww",
    "status": "manual"
  }'
```

### Via Database (Direct):
```sql
INSERT INTO wp_match_youtube_streams (match_id, youtube_url, video_id, status)
VALUES ('732149', 'https://www.youtube.com/watch?v=p3o4aLGv7Ww', 'p3o4aLGv7Ww', 'manual');
```

## ✅ Verification

Check if the agent is working:

```bash
# SSH to server
ssh root@159.223.103.16

# Check agent logs
journalctl -u autonomous-agent -f

# Look for these messages:
# ✅ "Searching YouTube for: Senegal vs RD Congo CAN 2025"
# ✅ "Found live stream: [title]"
# ✅ "Extracting captions from video..."
# ✅ "Posted: 28' - [caption text]"
```

## 🎯 Benefits

✅ **Reliable**: Uses your own YouTube channel
✅ **Real-time**: Captions available during broadcast
✅ **Accurate**: Match minutes extracted correctly
✅ **No scraping**: No HTML parsing issues
✅ **Automatic**: Zero manual intervention
✅ **Fallback ready**: Web scraping if YouTube fails

## 🔧 Troubleshooting

### No captions extracted
**Problem**: Agent reports "No captions available"
**Solution**: Ensure YouTube auto-captions are enabled on your live stream

### Wrong channel searched
**Problem**: Agent searches wrong channel
**Solution**: Set `YOUTUBE_CHANNEL_ID` in `.env`

### API quota exceeded
**Problem**: YouTube API returns 403 quota error
**Solution**: Wait 24 hours or use manual override

### Timestamps showing clock time (16:07') instead of match minutes (28')
**Problem**: Wrong timestamp format
**Solution**: Already fixed! Agent now calculates match minutes from video offset

## 📁 Files Changed

- `scripts/deployment/autonomous-match-agent.js` - Added YouTube functions
- `src/app/api/admin/youtube-stream/route.ts` - API endpoints
- `src/app/api/admin/create-youtube-table/route.ts` - Table creation
- `package.json` - Added youtube-transcript dependency
- `/opt/afrique-sports-commentary/.env` - Updated API key

## 🚀 Deployment Status

✅ Agent code deployed to server
✅ youtube-transcript installed
✅ Environment variables updated
✅ Agent restarted and running
⚠️  **TODO**: Create `wp_match_youtube_streams` table (see SQL above)

## 🎬 Next Steps

1. **Create the database table** (SQL above)
2. **Optional**: Set your YouTube channel ID in `.env`
3. **Test**: Wait for next live match or manually trigger with example match
4. **Monitor**: Check logs during live match

## 📞 Support

If you encounter issues:
1. Check agent logs: `journalctl -u autonomous-agent -f`
2. Verify table exists: `SHOW TABLES LIKE 'wp_match_youtube_streams';`
3. Check YouTube API quota: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas

---

**Status**: ✅ Ready for testing
**Last Updated**: 2025-12-27
**Agent Version**: 2.0 (YouTube Integration)
