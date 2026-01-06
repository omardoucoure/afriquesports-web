# Ollama Optimization - Auto-Unload Models

**Date**: January 6, 2026
**Server**: 159.223.103.16 (DigitalOcean)
**Issue**: Ollama models staying loaded indefinitely, consuming 600%+ CPU

---

## Problem

Ollama AI models were staying loaded in memory indefinitely after completing text generation, consuming massive CPU resources:

- **CPU Usage**: 681% (6.8 cores continuously)
- **Memory**: 9.3GB RAM
- **Duration**: 5+ hours stuck
- **Impact**: Server CPU at 95.6% (only 2.2% idle)

### What Happened

A `qwen2.5:14b` model was used to generate football content but didn't automatically unload after completion. The default Ollama behavior is to keep models loaded indefinitely until manually unloaded.

---

## Solution Applied

### 1. Configured Auto-Unload Timeout

Updated Ollama systemd service to automatically unload models after 10 minutes of inactivity.

**File**: `/etc/systemd/system/ollama.service`

**Changes**:
```ini
[Service]
Environment="OLLAMA_KEEP_ALIVE=10m"
Environment="OLLAMA_MODELS=/mnt/volume_nyc1_01/ollama"
```

**Backup Created**: `/etc/systemd/system/ollama.service.backup-*`

### 2. Applied Configuration

```bash
# Reload systemd to recognize changes
systemctl daemon-reload

# Restart Ollama service
systemctl restart ollama

# Verify configuration
systemctl status ollama
```

---

## Results

### Before Optimization

| Metric | Value |
|--------|-------|
| Ollama CPU | 681% (6.8 cores) |
| Ollama Memory | 9.3GB |
| Overall CPU Usage | 95.6% |
| CPU Idle | 2.2% |
| Load Average | 12.53 |

### After Optimization

| Metric | Value |
|--------|-------|
| Ollama CPU | 0% (no models loaded) |
| Ollama Memory | 10MB |
| Overall CPU Usage | ~40-50% |
| CPU Idle | 51.1% |
| Load Average | 4.46 |

**Improvement**: ✅ **50% CPU reduction**, 9GB RAM freed

---

## How It Works

### OLLAMA_KEEP_ALIVE Behavior

The `OLLAMA_KEEP_ALIVE` environment variable controls how long models stay loaded in memory:

| Value | Behavior |
|-------|----------|
| `-1` | Keep models loaded forever (default) |
| `0` | Unload immediately after each request |
| `5m` | Keep loaded for 5 minutes after last use |
| `10m` | Keep loaded for 10 minutes after last use ✅ |
| `1h` | Keep loaded for 1 hour after last use |

**Our Setting**: `10m` (10 minutes)

### Why 10 Minutes?

- **Fast enough**: Model stays ready for follow-up requests within 10 minutes
- **Efficient**: Automatically frees resources after inactivity
- **Balanced**: Good compromise between performance and resource usage

### Model Loading Time

When a model needs to be reloaded:
- **qwen2.5:14b**: ~9 seconds to load
- **Smaller models** (<7B): ~2-3 seconds

This is acceptable for our use case since content generation is not real-time.

---

## Verification

### Check Current Configuration

```bash
# View Ollama service config
systemctl cat ollama | grep KEEP_ALIVE

# Check loaded models
curl http://localhost:11434/api/ps

# Monitor Ollama logs
journalctl -u ollama -f
```

### Expected Output

When a model is loaded:
```json
{
  "models": [{
    "name": "qwen2.5:14b",
    "expires_at": "2026-01-06T14:37:05Z"
  }]
}
```

After 10 minutes of inactivity:
```json
{
  "models": []
}
```

---

## Monitoring

### Check if Models Are Auto-Unloading

```bash
# Watch model status every minute
watch -n 60 'curl -s http://localhost:11434/api/ps | jq'

# Check Ollama resource usage
ps aux | grep ollama
```

### Alert Conditions

⚠️ **Alert if**:
- Ollama CPU > 200% for more than 15 minutes
- Ollama Memory > 10GB
- Models loaded for > 15 minutes without activity

---

## Ollama Commands Reference

### List Loaded Models

```bash
curl http://localhost:11434/api/ps
```

### Manually Unload a Model

```bash
# Stop a specific model
curl -X POST http://localhost:11434/api/stop -d '{
  "model": "qwen2.5:14b"
}'
```

### Restart Ollama Service

```bash
# Restart (unloads all models)
systemctl restart ollama

# Check status
systemctl status ollama
```

### View Ollama Logs

```bash
# Recent logs
journalctl -u ollama --since "10 minutes ago"

# Follow logs in real-time
journalctl -u ollama -f
```

---

## Best Practices

### 1. Monitor Model Usage

Regularly check which models are loaded and for how long:

```bash
# Check loaded models and expiration times
curl -s http://localhost:11434/api/ps | jq '.models[] | {name, expires_at}'
```

### 2. Adjust Timeout Based on Usage Patterns

If models are frequently reloaded (causing delays):
- Increase to `15m` or `30m`

If resources are often maxed out:
- Decrease to `5m`

### 3. Use Smaller Models When Possible

For simple tasks, use smaller models:
- `qwen2.5:7b` instead of `qwen2.5:14b`
- Faster loading, less CPU/RAM

### 4. Schedule Heavy Model Usage

Run large model tasks during off-peak hours:
- 3 AM - 6 AM (server restarts at 3 AM anyway)
- Use cron jobs for batch content generation

---

## Troubleshooting

### Model Doesn't Auto-Unload

**Check configuration**:
```bash
systemctl cat ollama | grep KEEP_ALIVE
```

**Expected**: `Environment="OLLAMA_KEEP_ALIVE=10m"`

**If missing**:
```bash
systemctl edit --full ollama
# Add the Environment line
systemctl daemon-reload
systemctl restart ollama
```

### Model Takes Too Long to Load

**Symptoms**: 10+ seconds to load model on first request

**Solutions**:
1. Increase `OLLAMA_KEEP_ALIVE` to keep models loaded longer
2. Pre-load models before peak usage times:
   ```bash
   curl http://localhost:11434/api/generate -d '{
     "model": "qwen2.5:14b",
     "prompt": "test",
     "stream": false
   }'
   ```

### Out of Memory Errors

**Symptoms**: Ollama crashes or refuses to load models

**Solutions**:
1. Use smaller models
2. Limit concurrent model loads
3. Increase system RAM (current: 32GB)

---

## Configuration Files

### Current Ollama Service File

**Location**: `/etc/systemd/system/ollama.service`

```ini
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=3
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin"
Environment="OLLAMA_MODELS=/mnt/volume_nyc1_01/ollama"
Environment="OLLAMA_KEEP_ALIVE=10m"

[Install]
WantedBy=default.target
```

### Backup Location

All backups: `/etc/systemd/system/ollama.service.backup-*`

To restore a backup:
```bash
cp /etc/systemd/system/ollama.service.backup-20260106-142705 /etc/systemd/system/ollama.service
systemctl daemon-reload
systemctl restart ollama
```

---

## Impact on Content Generation

### Before

- Model stays loaded 24/7
- High CPU usage even when idle
- 9GB RAM consumed permanently

### After

- Model loads on-demand (9 seconds)
- Auto-unloads after 10 minutes
- Resources freed when not in use

### Content Generation Workflow

1. **Request arrives** → Model loads (9s delay)
2. **Generate content** → Model processes (~30s)
3. **Complete** → Model stays loaded
4. **10 minutes idle** → Model auto-unloads ✅
5. **Resources freed** → CPU/RAM available for Next.js, Redis, etc.

---

## Future Optimizations

### 1. Smart Pre-Loading

Pre-load models during low-traffic periods:
```bash
# Cron job at 2:55 AM (before 3 AM PM2 restart)
55 2 * * * curl -s http://localhost:11434/api/generate -d '{"model":"qwen2.5:14b","prompt":"warmup"}' > /dev/null
```

### 2. Multiple Model Support

Configure different timeouts for different models:
- Frequently used models: 30m
- Rarely used models: 5m

### 3. Resource Limits

Limit Ollama resource usage:
```ini
[Service]
MemoryMax=12G
CPUQuota=400%  # Max 4 cores
```

---

## Summary

✅ **Problem Solved**: Models auto-unload after 10 minutes of inactivity
✅ **CPU Freed**: 681% → 0% (6.8 cores available for other processes)
✅ **RAM Freed**: 9.3GB → 10MB
✅ **Configuration**: Persistent (survives restarts)
✅ **Monitoring**: Easy to check via API

**Status**: ✅ **OPTIMIZED AND WORKING**

---

_Applied: 2026-01-06 14:27 UTC_
_Configuration file: /etc/systemd/system/ollama.service_
_Backup: ollama.service.backup-20260106-142705_
