# 🤖 AI Commentary Deployment Scripts

Automated deployment and A/B testing for fine-tuned Mistral 7B commentary model.

## 🚀 Quick Start

Deploy your fine-tuned Mistral model in 4 steps:

```bash
# 1. Upload your GGUF model to server
scp mistral-commentary.gguf root@159.223.103.16:/mnt/volume_nyc1_01/models/

# 2. Deploy to Ollama
./deploy_mistral_model.sh

# 3. Test quality
./test_mistral_quality.sh

# 4. Enable A/B testing
./enable_ab_testing.sh

# 5. Monitor metrics
./monitor_ab_test.sh --watch

# 6. Make rollout decision
./rollout_decision.sh
```

## 📄 Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `deploy_mistral_model.sh` | Load model into Ollama | Run once after uploading GGUF |
| `test_mistral_quality.sh` | Compare Mistral vs Llama | Run before enabling A/B test |
| `enable_ab_testing.sh` | Enable 50/50 traffic split | Run to start A/B test |
| `monitor_ab_test.sh` | View real-time metrics | Run with `--watch` for live updates |
| `rollout_decision.sh` | Make production decision | Run after 20+ samples collected |

## 📊 A/B Testing Flow

```
Upload Model → Deploy → Test → Enable A/B → Monitor → Rollout
    ↓            ↓        ↓         ↓           ↓         ↓
  (manual)   (script)  (script)  (script)   (script)  (script)
```

## 🎯 Success Criteria

For full rollout to Mistral, you need:

- ✅ **Repetition score** < 0.25
- ✅ **Length variance** > 15%
- ✅ **Generation time** < 10 seconds
- ✅ **Sample size** ≥ 20 events

## 📖 Documentation

See [MISTRAL_DEPLOYMENT_GUIDE.md](./MISTRAL_DEPLOYMENT_GUIDE.md) for complete deployment instructions, troubleshooting, and rollback procedures.

## 🔧 Configuration Files

### Model Configuration
- **Location:** `/root/afcon-agent-temp/config/models.json`
- **Purpose:** Controls active model and A/B test settings

### Metrics Log
- **Location:** `/root/afcon-agent-temp/metrics/commentary_metrics.jsonl`
- **Purpose:** Stores quality metrics for analysis

### Modelfile
- **Location:** `scripts/data-collection/Modelfile.mistral-commentary`
- **Purpose:** Defines Ollama model parameters

## 🆘 Quick Troubleshooting

### Model not loading?
```bash
# Check if file exists
ssh root@159.223.103.16 "ls -lh /mnt/volume_nyc1_01/models/mistral-commentary.gguf"

# Verify Ollama is running
ssh root@159.223.103.16 "systemctl status ollama"
```

### A/B test not working?
```bash
# Re-enable A/B testing
./enable_ab_testing.sh

# Check configuration
ssh root@159.223.103.16 "cat /root/afcon-agent-temp/config/models.json"
```

### Need to rollback?
```bash
# Force rollback to Llama 3.1
./rollout_decision.sh --force-rollback
```

## 📦 Python Dependencies

All scripts use existing server dependencies:
- `requests` - HTTP calls to Ollama
- `json` - Configuration management
- Standard library (hashlib, pathlib, datetime)

## 🎓 Learn More

- **AI System Overview:** See `/AI_SYSTEM_SUMMARY.md`
- **Training Guide:** See `/scripts/data-collection/TRAINING_GUIDE.md`
- **Model Config:** See `model_config.py`
- **Quality Monitor:** See `quality_monitor.py`

## ✅ Current System Status

- ✅ Llama 3.1 8B deployed and working
- ✅ Llama 3.2 3B fallback available
- ✅ A/B testing framework ready
- ✅ Quality monitoring configured
- ⏳ Mistral deployment pending

## 🚀 Ready to Deploy?

Start with:
```bash
./deploy_mistral_model.sh
```

Then follow the prompts! The scripts will guide you through each step.

---

**Questions?** Review the full guide: [MISTRAL_DEPLOYMENT_GUIDE.md](./MISTRAL_DEPLOYMENT_GUIDE.md)
