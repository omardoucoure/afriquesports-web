# Moving Vercel Crons to WordPress Server

## Why This Saves Money

**Current Situation:**
- Vercel billing: ~$120/month (without crons)
- Adding Vercel crons would add: +$50-100/month
- **Total with Vercel crons: $170-220/month**

**After Moving to WordPress:**
- Vercel billing: ~$120/month (unchanged)
- WordPress server: $0 extra (already running 24/7)
- **Total: $120/month**

**Monthly Savings: $50-100** 💰

---

## How It Works

Instead of Vercel running cron jobs (which charges per-invocation), we run them from your WordPress server:

```
WordPress Server (free) → HTTP Request → Vercel API Endpoint (minimal cost)
```

Vercel only charges for the final API call, not for the cron scheduling itself.

---

## Step-by-Step Setup

### 1. Upload Script to WordPress Server

```bash
# SSH into your WordPress server
ssh root@159.223.103.16

# Create scripts directory
mkdir -p /var/www/scripts

# Create log directory
mkdir -p /var/log

# Upload the script (from your local machine)
scp wordpress-cron-runner.sh root@159.223.103.16:/var/www/scripts/

# Make it executable
ssh root@159.223.103.16 "chmod +x /var/www/scripts/vercel-cron-runner.sh"
```

### 2. Set CRON_SECRET Environment Variable

```bash
# SSH into WordPress server
ssh root@159.223.103.16

# Add to /etc/environment
echo "CRON_SECRET=${CRON_SECRET}" >> /etc/environment

# Or create a dedicated file for cron environment
cat > /etc/cron.d/vercel-env << 'EOF'
CRON_SECRET=your_cron_secret_here
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
EOF

# Make sure CRON_SECRET matches .env.local value
```

### 3. Install Cron Jobs

```bash
# SSH into WordPress server
ssh root@159.223.103.16

# Edit crontab
crontab -e

# Add these lines (copy from wordpress-crontab.txt):

# Set environment
CRON_SECRET=your_cron_secret_here
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Monitor Matches - Every 5 minutes, 9am-11pm
*/5 9-23 * * * /var/www/scripts/vercel-cron-runner.sh monitor-matches

# Pre-Index Matches - Every 2 hours
0 */2 * * * /var/www/scripts/vercel-cron-runner.sh preindex-matches

# Index Upcoming Matches - Every 6 hours
0 */6 * * * /var/www/scripts/vercel-cron-runner.sh index-upcoming-matches

# SEO Realtime Check - Every hour, 9am-9pm
0 9-21 * * * /var/www/scripts/vercel-cron-runner.sh seo-realtime

# SEO Agent Daily Run - Daily at 6am
0 6 * * * /var/www/scripts/vercel-cron-runner.sh seo-agent

# SEO Weekly Report - Weekly on Monday at 8am
0 8 * * 1 /var/www/scripts/vercel-cron-runner.sh seo-report

# Save and exit (:wq in vim, Ctrl+X in nano)
```

### 4. Verify Cron Setup

```bash
# List current cron jobs
crontab -l

# Check cron service is running
systemctl status cron

# Watch logs in real-time
tail -f /var/log/vercel-crons.log

# Test individual cron manually
/var/www/scripts/vercel-cron-runner.sh monitor-matches
```

### 5. Deploy Empty Vercel Crons

This step removes all cron jobs from Vercel (they're now running on WordPress):

```bash
# From your local machine
git add vercel.json
git commit -m "chore: move cron jobs to WordPress server to reduce costs"
git push
```

---

## Monitoring

### Check Logs

```bash
# Real-time log monitoring
tail -f /var/log/vercel-crons.log

# Last 50 lines
tail -n 50 /var/log/vercel-crons.log

# Search for errors
grep "❌" /var/log/vercel-crons.log

# Search for success
grep "✅" /var/log/vercel-crons.log
```

### Verify Crons Are Running

```bash
# Check when crons last ran
grep "Calling" /var/log/vercel-crons.log | tail -20

# Monitor system cron logs
grep CRON /var/log/syslog | tail -20
```

---

## Troubleshooting

### Cron Not Running

```bash
# Check cron service
systemctl status cron

# Restart cron service
systemctl restart cron

# Check crontab syntax
crontab -l
```

### CRON_SECRET Not Working

```bash
# Verify environment variable
echo $CRON_SECRET

# If empty, add to crontab directly (see Step 3)

# Test with explicit secret
CRON_SECRET=your_secret /var/www/scripts/vercel-cron-runner.sh monitor-matches
```

### 403 Unauthorized Errors

- Check that `CRON_SECRET` in crontab matches `.env.local` value
- Verify Vercel API endpoints are accessible
- Check firewall isn't blocking outbound HTTPS

### Script Not Found

```bash
# Verify script exists
ls -la /var/www/scripts/vercel-cron-runner.sh

# Check permissions
chmod +x /var/www/scripts/vercel-cron-runner.sh

# Verify path in crontab
which bash
# Should be /bin/bash
```

---

## Cost Comparison

### Before (Vercel Crons)

| Cron Job | Frequency | Monthly Runs | Estimated Cost |
|----------|-----------|--------------|----------------|
| monitor-matches | Every 5 min (9am-11pm) | 5,400 | ~$25 |
| preindex-matches | Every 2 hours | 360 | ~$10 |
| index-upcoming-matches | Every 6 hours | 120 | ~$5 |
| seo-realtime | Every hour (9am-9pm) | 390 | ~$10 |
| seo-agent | Daily | 30 | ~$2 |
| seo-report | Weekly | 4 | ~$1 |
| **TOTAL** | - | **6,704** | **~$53** |

### After (WordPress Crons)

| Resource | Cost |
|----------|------|
| WordPress Server CPU | $0 (already paid) |
| WordPress Server Bandwidth | $0 (included) |
| Vercel API Calls | ~$5/month (only final endpoint calls) |
| **TOTAL** | **~$5/month** |

**Monthly Savings: ~$48** (91% reduction)

---

## Next Steps

1. ✅ Upload `vercel-cron-runner.sh` to WordPress server
2. ✅ Configure crontab on WordPress server
3. ✅ Deploy empty `vercel.json` to Vercel
4. ⏳ Monitor logs for 24 hours
5. ⏳ Verify Vercel billing decreases next month

---

## Rollback Plan

If something goes wrong, you can quickly restore Vercel crons:

```bash
# Revert vercel.json
git revert HEAD
git push

# This will restore all Vercel crons immediately
```

Then debug the WordPress setup without impacting production.
