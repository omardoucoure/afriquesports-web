# Autonomous Live Commentary Agent - Deployment Guide

This guide explains how to deploy the automatic live commentary system that monitors CAN 2025 matches and generates real-time French commentary using your RunPod Llama 3.1 70B model.

## 📋 Overview

The system consists of:
- **Live Commentary Agent**: Node.js service that monitors ESPN API for live matches
- **Llama 3.1 70B Model**: Running on RunPod vLLM server (194.68.245.75:8000)
- **Supabase Database**: Stores commentary events
- **Next.js Website**: Displays live commentary to users

## 🚀 Deployment Steps

### 1. Deploy to DigitalOcean Server (159.223.103.16)

SSH into your DigitalOcean server:
```bash
ssh root@159.223.103.16
```

### 2. Create Agent Directory

```bash
mkdir -p /opt/afrique-sports-commentary
cd /opt/afrique-sports-commentary
```

### 3. Upload Agent Script

Copy the `live-commentary-agent.js` file to the server:

```bash
# From your local machine:
scp scripts/deployment/live-commentary-agent.js root@159.223.103.16:/opt/afrique-sports-commentary/

# Or use nano to create the file directly on the server
nano /opt/afrique-sports-commentary/live-commentary-agent.js
# (paste the content from live-commentary-agent.js)
```

### 4. Create Environment File

```bash
nano /opt/afrique-sports-commentary/.env
```

Add this content:
```bash
AI_AGENT_WEBHOOK_SECRET=your_webhook_secret_here_change_this
```

**IMPORTANT**: Replace `your_webhook_secret_here_change_this` with a strong random secret.

Generate a strong secret:
```bash
openssl rand -hex 32
```

### 5. Update Next.js Environment Variables

On your DigitalOcean server, update the Next.js `.env.local` file:

```bash
cd /var/www/afriquesports-web  # Or wherever your Next.js app is deployed
nano .env.local
```

Add the same webhook secret:
```bash
AI_AGENT_WEBHOOK_SECRET=your_webhook_secret_here_change_this
```

Rebuild and restart your Next.js app:
```bash
npm run build
pm2 restart afriquesports-web
```

### 6. Install as Systemd Service

Copy the service file:
```bash
# From local machine:
scp scripts/deployment/afrique-sports-commentary.service root@159.223.103.16:/etc/systemd/system/

# Or create it on the server:
nano /etc/systemd/system/afrique-sports-commentary.service
# (paste the content)
```

Enable and start the service:
```bash
# Reload systemd
systemctl daemon-reload

# Enable service to start on boot
systemctl enable afrique-sports-commentary

# Start the service
systemctl start afrique-sports-commentary

# Check status
systemctl status afrique-sports-commentary
```

### 7. Monitor Agent Logs

```bash
# Real-time logs
tail -f /var/log/afrique-sports-commentary.log

# Error logs
tail -f /var/log/afrique-sports-commentary-error.log

# View last 50 lines
tail -50 /var/log/afrique-sports-commentary.log
```

## 🔧 Configuration Options

Edit `/etc/systemd/system/afrique-sports-commentary.service` to change:

| Variable | Default | Description |
|----------|---------|-------------|
| `CHECK_INTERVAL_SECONDS` | 60 | How often to check for live matches (seconds) |
| `COMMENTARY_INTERVAL_MINUTES` | 5 | How often to generate commentary during live matches (minutes) |
| `VLLM_BASE_URL` | http://194.68.245.75:8000/v1 | RunPod vLLM endpoint |
| `VLLM_API_KEY` | afrique-sports-70b-working | vLLM API key |
| `NEXT_PUBLIC_SITE_URL` | https://www.afriquesports.net | Your website URL |

After changing, reload:
```bash
systemctl daemon-reload
systemctl restart afrique-sports-commentary
```

## ✅ Testing

### Test 1: Check if Agent is Running

```bash
systemctl status afrique-sports-commentary
```

Expected output:
```
● afrique-sports-commentary.service - Afrique Sports Live Commentary Agent
   Loaded: loaded (/etc/systemd/system/afrique-sports-commentary.service)
   Active: active (running) since Mon 2025-12-23 19:00:00 UTC
```

### Test 2: Check Logs for Activity

```bash
tail -30 /var/log/afrique-sports-commentary.log
```

You should see:
```
🤖 LIVE COMMENTARY AGENT STARTED
================================
📡 vLLM Endpoint: http://194.68.245.75:8000/v1
🔑 API Key: afrique-sports-70b-w...
...
🔍 Checking for live CAN 2025 matches...
```

### Test 3: Verify vLLM Connection

The agent tests the connection on startup. Check for:
```
✅ vLLM connection successful!
```

If you see an error, verify RunPod is running:
```bash
ssh runpod "ps aux | grep vllm"
```

### Test 4: Check Database Commentary

Visit your match page:
```
https://www.afriquesports.net/can-2025/match/732138
```

Commentary should appear under "⚽ Commentaires en direct"

## 🛠️ Troubleshooting

### Agent Not Starting

Check service status:
```bash
journalctl -u afrique-sports-commentary -n 50
```

Common issues:
- **Node.js not installed**: `apt install nodejs npm`
- **Missing environment file**: Create `/opt/afrique-sports-commentary/.env`
- **Wrong permissions**: `chmod +x /opt/afrique-sports-commentary/live-commentary-agent.js`

### No Commentary Being Generated

1. **Check if match is actually live:**
   ```bash
   curl "https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/scoreboard" | grep '"state":"in"'
   ```

2. **Verify RunPod vLLM is running:**
   ```bash
   curl http://194.68.245.75:8000/v1/models \
     -H "Authorization: Bearer afrique-sports-70b-working"
   ```

3. **Check agent logs:**
   ```bash
   tail -100 /var/log/afrique-sports-commentary.log
   ```

### Commentary Not Appearing on Website

1. **Check database:**
   ```bash
   # On DigitalOcean server
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM match_commentary_ai WHERE match_id='732138';"
   ```

2. **Check API endpoint:**
   ```bash
   curl "https://www.afriquesports.net/api/can2025/live-commentary?match_id=732138&locale=fr"
   ```

3. **Clear Next.js cache:**
   ```bash
   pm2 restart afriquesports-web
   ```

## 📊 System Architecture

```
┌─────────────────┐
│   ESPN API      │ (Live match data)
│  Scoreboard     │
└────────┬────────┘
         │
         │ Poll every 60s
         ▼
┌─────────────────────────┐
│  Live Commentary Agent  │
│  (DigitalOcean Server)  │
└───┬─────────────────┬───┘
    │                 │
    │ Generate        │ Post commentary
    │ commentary      │ via webhook
    ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ RunPod vLLM  │  │   Supabase   │
│ Llama 3.1    │  │   Database   │
│ 70B Model    │  │              │
└──────────────┘  └──────┬───────┘
                         │
                         │ Read commentary
                         ▼
                  ┌──────────────┐
                  │  Next.js Web │
                  │  (Frontend)  │
                  └──────────────┘
```

## 🎯 Expected Behavior

When a CAN 2025 match goes live:

1. **T+0min**: Agent detects live match via ESPN API
2. **T+1min**: Generates first commentary via Llama 3.1 70B
3. **T+1min**: Posts commentary to database
4. **T+1min**: Commentary appears on website (within 15 seconds via ISR revalidation)
5. **T+6min**: Generates second commentary (5-minute interval)
6. **Repeat** until match ends

## 💰 Cost Management

The agent only uses RunPod resources when:
- Matches are live (generates commentary every 5 minutes)
- ~18 commentary events per 90-minute match
- ~30 matches per month = 540 API calls/month

**Estimated cost:**
- RunPod: $0.41/hour × 90 hours = $36.90/month (same as before)
- Agent overhead: Free (runs on existing DigitalOcean server)

## 🔒 Security

- ✅ Webhook secret required for posting commentary
- ✅ Environment variables stored securely
- ✅ No credentials in code
- ✅ Supabase RLS enabled (public read-only access)

## 📝 Manual Controls

### Stop Agent
```bash
systemctl stop afrique-sports-commentary
```

### Start Agent
```bash
systemctl start afrique-sports-commentary
```

### Restart Agent
```bash
systemctl restart afrique-sports-commentary
```

### Disable Auto-Start
```bash
systemctl disable afrique-sports-commentary
```

## 🎉 Success Checklist

- [ ] Agent service is running
- [ ] vLLM connection test passes
- [ ] Logs show "Checking for live matches" every 60 seconds
- [ ] When match is live, logs show "Processing live match"
- [ ] Commentary appears in database
- [ ] Commentary visible on website
- [ ] Service restarts automatically if it crashes
- [ ] Service starts automatically on server reboot

## 📞 Support

If issues persist:
1. Check all logs: `/var/log/afrique-sports-commentary.log`
2. Verify all environment variables are set correctly
3. Test each component individually (vLLM, database, API)
4. Check firewall rules allow connections to RunPod (194.68.245.75:8000)

---

**🚀 Ready for CAN 2025 live coverage!**
