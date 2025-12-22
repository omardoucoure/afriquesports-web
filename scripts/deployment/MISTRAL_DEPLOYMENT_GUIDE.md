# 🚀 Mistral Model Deployment Guide

Complete guide to deploy fine-tuned Mistral 7B model with A/B testing.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ Fine-tuned Mistral model exported to GGUF format (`mistral-commentary.gguf`)
- ✅ SSH access to DigitalOcean server (159.223.103.16)
- ✅ Ollama installed and running on the server
- ✅ Current Llama 3.1 8B model working

## 🎯 Deployment Workflow

```
1. Upload Model → 2. Deploy to Ollama → 3. Test Quality → 4. Enable A/B Test → 5. Monitor → 6. Rollout
```

---

## Step 1: Upload Model File to Server

First, upload your fine-tuned GGUF model to the server:

```bash
# From your local machine
scp mistral-commentary.gguf root@159.223.103.16:/mnt/volume_nyc1_01/models/
```

**Verify upload:**
```bash
ssh root@159.223.103.16 "ls -lh /mnt/volume_nyc1_01/models/mistral-commentary.gguf"
```

Expected output: File size around 4-5GB for Q4 quantized model.

---

## Step 2: Deploy Model to Ollama

Run the deployment script from your local machine:

```bash
cd scripts/deployment
./deploy_mistral_model.sh
```

**What this does:**
1. ✅ Checks if model file exists on server
2. ✅ Uploads Modelfile configuration
3. ✅ Creates Ollama model from GGUF
4. ✅ Verifies model is available
5. ✅ Runs test generation

**Expected output:**
```
==========================================
🚀 Deploying Mistral Model to Ollama
==========================================

📋 Step 1: Checking if model file exists on server...
✅ Model file found on server

📋 Step 2: Uploading Modelfile to server...
✅ Modelfile uploaded

📋 Step 3: Loading model into Ollama...
✅ Model loaded into Ollama

📋 Step 4: Verifying model availability...
NAME                    SIZE      MODIFIED
mistral-commentary      4.9 GB    2 minutes ago
✅ Model verified in Ollama

📋 Step 5: Testing model generation...
Test prompt: 'Génère un commentaire pour minute 67, but de Mbappé'

Mbappé accélère sur le côté gauche, élimine deux défenseurs d'un grand pont
et frappe en force du gauche. Le gardien est battu, c'est 2-0 pour les Bleus !

✅ Model generation successful

==========================================
✅ Deployment Complete!
==========================================
```

---

## Step 3: Test Model Quality

Compare Mistral vs Llama 3.1 quality on sample prompts:

```bash
./test_mistral_quality.sh
```

**What this does:**
- Generates 5 test commentaries with each model (10 total)
- Measures repetition, length variance, generation time
- Provides quality comparison report

**Sample output:**
```
========================================== 📊 Quality Comparison Report
==========================================

{
  "llama3.1": {
    "count": 5,
    "avg_repetition": 0.42,
    "avg_length": 89.2,
    "avg_gen_time": 3421,
    "length_variance": 8.5
  },
  "mistral-commentary": {
    "count": 5,
    "avg_repetition": 0.18,
    "avg_length": 104.6,
    "avg_gen_time": 4102,
    "length_variance": 18.3
  }
}

==========================================
🎯 Recommendation
==========================================

Action: CONTINUE_TESTING
Reason: Metrics inconclusive, continue A/B test
Confidence: low
```

**Interpretation:**
- ✅ **Repetition < 0.25**: Good (Mistral: 0.18 ✅, Llama: 0.42 ❌)
- ✅ **Variance > 15%**: Good (Mistral: 18.3% ✅, Llama: 8.5% ❌)
- ⚠️ **Gen time < 10s**: Acceptable (both under 5s)
- ⏳ **Sample size**: Need 20+ for reliable decision

---

## Step 4: Enable A/B Testing

Enable 50/50 traffic split between Llama and Mistral:

```bash
./enable_ab_testing.sh
```

**What this does:**
1. Creates A/B test configuration (50/50 split)
2. Uploads enhanced commentary generator with A/B logic
3. Enables automatic metric logging

**Configuration created:**
```json
{
  "active_model": "llama3.1:8b",
  "ab_test": {
    "enabled": true,
    "split_ratio": 0.5,
    "variant_model": "mistral-commentary",
    "control_model": "llama3.1:8b"
  }
}
```

**How A/B split works:**
- Each event gets a unique ID (e.g., `match123_min45`)
- ID is hashed to determine model: hash % 100 < 50 → Mistral, else → Llama
- Same event always uses same model (consistent user experience)

---

## Step 5: Monitor Metrics

### One-time snapshot:
```bash
./monitor_ab_test.sh
```

### Continuous monitoring (refreshes every 10s):
```bash
./monitor_ab_test.sh --watch
```

**Dashboard output:**
```
================================================================================
📊 A/B TEST DASHBOARD - 2025-12-22 15:30:00
================================================================================

Total Samples: 47

🦙 LLAMA 3.1 (Control)
----------------------------------------
  Samples: 24
  Avg Repetition: 0.412 ⚠️
  Length Variance: 9.2% ⚠️
  Avg Length: 91 chars
  Avg Gen Time: 3215ms

🚀 MISTRAL COMMENTARY (Variant)
----------------------------------------
  Samples: 23
  Avg Repetition: 0.194 ✅
  Length Variance: 17.8% ✅
  Avg Length: 107 chars
  Avg Gen Time: 4089ms

🏆 COMPARISON
----------------------------------------
  Repetition: -52.9% 🟢 Better
  Variance: +8.6% 🟢 Better
  Gen Time: +27.2% ⚠️ Slower

🎯 RECOMMENDATION
----------------------------------------
  Action: FULL_ROLLOUT
  Reason: Mistral shows better quality (repetition: 0.19, variance: 17.8%)
  Confidence: HIGH

✅ SUCCESS CRITERIA
----------------------------------------
  ✅ Minimum 20 samples (current: 23)
  ✅ Repetition < 0.25 (current: 0.194)
  ✅ Variance > 15% (current: 17.8%)
  ✅ Gen time < 10s (current: 4.1s)

================================================================================
```

---

## Step 6: Make Rollout Decision

### Automatic decision (based on metrics):
```bash
./rollout_decision.sh
```

**Possible outcomes:**

### ✅ Full Rollout (Mistral wins):
```
🎯 DECISION: FULL_ROLLOUT
✅ Mistral shows better quality
✅ Executing full rollout to Mistral
✅ Mistral is now serving 100% of traffic
```

### ❌ Rollback (Llama wins):
```
🎯 DECISION: ROLLBACK
⚠️  Mistral quality issues detected
⚠️  Rolling back to Llama 3.1
✅ Llama 3.1 restored to 100% traffic
```

### ⏳ Continue Testing (inconclusive):
```
🎯 DECISION: CONTINUE_TESTING
⏳ Metrics inconclusive, need more data
Run this script again after more matches
```

---

## Manual Override (Advanced)

If you want to bypass metrics and force a decision:

### Force Mistral to 100%:
```bash
./rollout_decision.sh --force-rollout
```

### Force Llama to 100%:
```bash
./rollout_decision.sh --force-rollback
```

⚠️ **Warning:** Only use manual override if:
- You have evidence metrics are misleading
- You want to test Mistral in production before full validation
- Emergency rollback is needed

---

## 🔍 Troubleshooting

### Issue: "Model file not found"

**Cause:** GGUF file not uploaded or wrong path

**Fix:**
```bash
# Check if file exists
ssh root@159.223.103.16 "ls -lh /mnt/volume_nyc1_01/models/"

# Upload if missing
scp mistral-commentary.gguf root@159.223.103.16:/mnt/volume_nyc1_01/models/
```

---

### Issue: "Ollama model creation failed"

**Cause:** Corrupted GGUF or Ollama service down

**Fix:**
```bash
# Check Ollama status
ssh root@159.223.103.16 "systemctl status ollama"

# Restart Ollama if needed
ssh root@159.223.103.16 "systemctl restart ollama"

# Verify Modelfile syntax
cat scripts/data-collection/Modelfile.mistral-commentary
```

---

### Issue: "High repetition score"

**Cause:** Model needs more training data or better parameters

**Fix:**
1. Collect more training data (aim for 500+ examples)
2. Adjust `repeat_penalty` in Modelfile (increase to 1.2-1.3)
3. Retrain with lower learning rate

Edit Modelfile:
```bash
PARAMETER repeat_penalty 1.25  # Increase from 1.15
```

Recreate model:
```bash
ssh root@159.223.103.16 "cd /root/afcon-agent-temp && ollama create mistral-commentary -f Modelfile.mistral-commentary"
```

---

### Issue: "Generation too slow"

**Cause:** Model too large for server hardware

**Fix:**
1. Use smaller quantization (Q3 instead of Q4)
2. Reduce `num_predict` to 100 (from 120)
3. Upgrade server RAM/CPU

Quick fix - reduce output length:
```bash
# Edit Modelfile
PARAMETER num_predict 100  # Reduce from 120
```

---

### Issue: "A/B test not working"

**Cause:** Configuration file not found or invalid

**Fix:**
```bash
# Check config exists
ssh root@159.223.103.16 "cat /root/afcon-agent-temp/config/models.json"

# Re-enable A/B testing
./enable_ab_testing.sh
```

---

## 📊 Success Metrics

Your rollout is successful when:

| Metric | Target | Current |
|--------|--------|---------|
| Repetition Score | < 0.25 | Check dashboard |
| Length Variance | > 15% | Check dashboard |
| Generation Time | < 10s | Check dashboard |
| Sample Size | 20+ | Check dashboard |

---

## 🎯 Rollout Decision Matrix

| Repetition | Variance | Gen Time | Decision |
|------------|----------|----------|----------|
| < 0.25 | > 15% | < 10s | ✅ **Full Rollout** |
| < 0.35 | > 10% | < 15s | ⏳ **Continue Testing** |
| > 0.35 | < 10% | > 15s | ❌ **Rollback** |

---

## 📝 Post-Deployment Checklist

After successful rollout:

- [ ] Verify Mistral is at 100% in config: `ssh root@159.223.103.16 "cat /root/afcon-agent-temp/config/models.json"`
- [ ] Monitor production commentary for 1-2 matches
- [ ] Check no errors in logs: `ssh root@159.223.103.16 "tail -100 /root/afcon-agent-temp/logs/scheduler.log"`
- [ ] Verify frontend shows AI-generated commentary
- [ ] Celebrate! 🎉

---

## 🔄 Rollback Procedure

If you need to rollback to Llama 3.1 after deployment:

```bash
# Option 1: Automatic (if metrics show issues)
./rollout_decision.sh

# Option 2: Manual force rollback
./rollout_decision.sh --force-rollback
```

**Rollback is instant** - next commentary will use Llama 3.1.

---

## 📚 File Reference

### Deployment Scripts (scripts/deployment/)
- `deploy_mistral_model.sh` - Loads model into Ollama
- `test_mistral_quality.sh` - Compares Mistral vs Llama
- `enable_ab_testing.sh` - Enables 50/50 split
- `monitor_ab_test.sh` - Real-time metrics dashboard
- `rollout_decision.sh` - Makes production decision

### Server Files (/root/afcon-agent-temp/)
- `config/models.json` - Active model configuration
- `metrics/commentary_metrics.jsonl` - Quality metrics log
- `Modelfile.mistral-commentary` - Ollama model definition
- `commentary_generator_ab.py` - A/B-enabled generator

### Model Files
- `/mnt/volume_nyc1_01/models/mistral-commentary.gguf` - Fine-tuned model

---

## 🆘 Support

If you encounter issues:

1. Check logs: `ssh root@159.223.103.16 "tail -100 /root/afcon-agent-temp/logs/scheduler.log"`
2. Verify Ollama: `ssh root@159.223.103.16 "ollama list"`
3. Review metrics: `./monitor_ab_test.sh`
4. Force rollback if critical: `./rollout_decision.sh --force-rollback`

---

## 🎉 You're Ready!

Your deployment pipeline is complete:

1. ✅ Model deployment script
2. ✅ Quality testing framework
3. ✅ A/B testing configuration
4. ✅ Real-time monitoring dashboard
5. ✅ Automatic rollout decision
6. ✅ Manual override controls

Start with:
```bash
./deploy_mistral_model.sh
```

Good luck! 🚀
